"""
Gemini LLM Client

Google Gemini implementation of the LLM client interface.
Uses the Gemini generateContent REST API.
"""

import logging
import time
from typing import Dict, Any

import httpx

from .base_client import BaseLLMClient
from .models import (
    LLMRequest,
    LLMResponse,
    LLMProvider,
    LLMError,
    LLMRateLimitError,
    LLMQuotaExceededError,
    LLMConnectionError,
)

logger = logging.getLogger(__name__)


def _mask_key(key: str) -> str:
    if not key or len(key) < 8:
        return "***"
    return key[:4] + "..." + key[-4:]


class GeminiClient(BaseLLMClient):
    """Gemini LLM client implementation using REST API."""

    def __init__(self, api_key: str, model: str = "gemini-flash-latest", **kwargs):
        super().__init__(api_key, model, **kwargs)
        self.provider_name = "Gemini"
        self._client: httpx.AsyncClient | None = None
        if not api_key:
            logger.error("Gemini API key not provided")

    @property
    def provider(self) -> LLMProvider:
        return LLMProvider.GEMINI

    async def initialize(self) -> bool:
        """Initialize the Gemini client."""
        try:
            if not self.api_key or self.api_key.strip() in (
                "",
                "your_gemini_api_key_here",
                "AIza...",
            ):
                logger.warning("Gemini: No valid API key provided.")
                self._is_available = False
                self._client = None
                return False

            timeout = httpx.Timeout(
                timeout=self.timeout,
                connect=min(10.0, float(self.timeout)),
                read=float(self.timeout),
                write=min(10.0, float(self.timeout)),
            )
            self._client = httpx.AsyncClient(timeout=timeout)
            self._is_available = True
            logger.info(
                f"Gemini client initialized with model {self.model} and key {_mask_key(self.api_key)}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Gemini: Failed to initialize client: {type(e).__name__}: {e}"
            )
            self._is_available = False
            self._client = None
            return False

    def _build_prompt_text(self, request: LLMRequest) -> str:
        messages = self._prepare_messages(request)
        lines = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            lines.append(f"{role.upper()}: {content}")
        return "\n\n".join(lines)

    def _extract_text_content(self, data: Dict[str, Any]) -> str:
        """Extract text from Gemini response candidates, tolerating non-text parts."""
        candidates = data.get("candidates", [])
        if not candidates:
            raise LLMError(
                "Gemini response did not include candidates", provider=self.provider
            )

        all_text_parts = []
        for candidate in candidates:
            parts = candidate.get("content", {}).get("parts", [])
            for part in parts:
                text = part.get("text")
                if isinstance(text, str) and text.strip():
                    all_text_parts.append(text.strip())

        content = "\n".join(all_text_parts).strip()
        if content:
            return content

        finish_reason = candidates[0].get("finishReason")
        if finish_reason:
            raise LLMError(
                f"Gemini returned no text content (finishReason={finish_reason})",
                provider=self.provider,
                error_code="empty_content",
            )

        raise LLMError(
            "Gemini response did not include text content",
            provider=self.provider,
            error_code="empty_content",
        )

    async def generate(self, request: LLMRequest) -> LLMResponse:
        if not self.is_available or not self._client:
            raise LLMError("Gemini client not available", provider=self.provider)

        try:
            start_time = time.time()
            model = request.model or self.model
            prompt_text = self._build_prompt_text(request)

            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt_text,
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": (
                        request.temperature if request.temperature is not None else 0.1
                    ),
                    "maxOutputTokens": (
                        request.max_tokens if request.max_tokens is not None else 2048
                    ),
                },
            }

            response = await self._client.post(
                endpoint,
                headers={
                    "Content-Type": "application/json",
                    "X-goog-api-key": self.api_key,
                },
                json=payload,
            )

            if response.status_code >= 400:
                return await self._handle_gemini_error(response)

            response_time = time.time() - start_time
            data = response.json()
            content = self._extract_text_content(data)

            usage_data = data.get("usageMetadata", {})
            usage = {
                "prompt_tokens": usage_data.get("promptTokenCount"),
                "completion_tokens": usage_data.get("candidatesTokenCount"),
                "total_tokens": usage_data.get("totalTokenCount"),
            }

            logger.info(f"Gemini: Generation completed in {response_time:.2f}s")
            return self._create_response(
                content=content,
                model=model,
                usage=usage,
                response_time=response_time,
            )

        except LLMError:
            raise
        except httpx.ReadTimeout as e:
            logger.error(f"Gemini: Read timeout after {self.timeout}s: {e}")
            raise LLMConnectionError(
                f"Gemini read timeout after {self.timeout}s",
                provider=self.provider,
                error_code="timeout",
            )
        except httpx.ConnectTimeout as e:
            logger.error(f"Gemini: Connection timeout: {e}")
            raise LLMConnectionError(
                "Gemini connection timeout",
                provider=self.provider,
                error_code="connect_timeout",
            )
        except httpx.TimeoutException as e:
            logger.error(f"Gemini: Timeout exception: {e}")
            raise LLMConnectionError(
                "Gemini request timed out",
                provider=self.provider,
                error_code="timeout",
            )
        except Exception as e:
            logger.error(f"Gemini: Generation error: {type(e).__name__}: {e}")
            raise LLMError(
                f"Gemini API error: {str(e)}",
                provider=self.provider,
                error_code="api_error",
            )

    async def _handle_gemini_error(self, response: httpx.Response) -> LLMResponse:
        error_text = response.text
        logger.error(
            f"Gemini API error: status={response.status_code}, body={error_text}"
        )

        if response.status_code == 429:
            raise LLMRateLimitError(
                f"Gemini rate limit exceeded: {error_text}",
                provider=self.provider,
                error_code="rate_limit",
            )

        if response.status_code in (401, 403):
            raise LLMQuotaExceededError(
                f"Gemini authentication/quota error: {error_text}",
                provider=self.provider,
                error_code="quota_or_auth",
            )

        if response.status_code >= 500:
            raise LLMConnectionError(
                f"Gemini server error: {error_text}",
                provider=self.provider,
                error_code="server_error",
            )

        raise LLMError(
            f"Gemini API error: {error_text}",
            provider=self.provider,
            error_code="api_error",
        )

    async def health_check(self) -> Dict[str, Any]:
        """Perform Gemini health check with a minimal request."""
        health_status = {
            "provider": self.provider.value,
            "model": self.model,
            "available": self.is_available,
            "timestamp": time.time(),
        }

        if not self.is_available or not self._client:
            health_status["status"] = "unavailable"
            health_status["error"] = "Client not initialized"
            return health_status

        try:
            request = LLMRequest(
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=8,
                temperature=0.1,
            )
            await self.generate(request)
            health_status["status"] = "healthy"
            health_status["model_available"] = True
        except Exception as e:
            health_status["status"] = "error"
            health_status["error"] = f"{type(e).__name__}: {e}"
            health_status["model_available"] = False

        return health_status

    async def close(self):
        """Close Gemini client resources."""
        await super().close()
        if self._client:
            await self._client.aclose()
        self._client = None
        logger.info("Gemini client closed")
