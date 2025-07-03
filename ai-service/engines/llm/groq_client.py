"""
Groq LLM Client

Groq-specific implementation of the LLM client interface.
Handles Groq API communication with proper error handling and retry logic.
"""

import logging
import time
from typing import Dict, Any

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

try:
    from groq import AsyncGroq

    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("Groq client not available")


def _mask_key(key: str) -> str:
    if not key or len(key) < 8:
        return "***"
    return key[:4] + "..." + key[-4:]


class GroqClient(BaseLLMClient):
    """Groq LLM client implementation using groq.AsyncGroq().chat.completions.create."""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile", **kwargs):
        super().__init__(api_key, model, **kwargs)
        self.provider_name = "Groq"
        self._client = None
        if not api_key:
            logger.error("Groq API key not provided")
            return

    @property
    def provider(self) -> LLMProvider:
        return LLMProvider.GROQ

    async def initialize(self) -> bool:
        """Initialize the Groq client (AsyncGroq)."""
        try:
            if not GROQ_AVAILABLE:
                logger.warning("Groq library not available")
                self._is_available = False
                self._client = None
                return False
            if not self.api_key or self.api_key.strip() in (
                "your_groq_api_key_here",
                "",
                "gsk-...",
                "gsk-<your-key>",
            ):
                logger.warning("Groq: No valid API key provided.")
                self._is_available = False
                self._client = None
                return False
            if not self.api_key.startswith("gsk_"):
                logger.warning(
                    f"Groq API key format appears invalid (should start with 'gsk_'): {_mask_key(self.api_key)}"
                )
            self._client = AsyncGroq(api_key=self.api_key)
            self._is_available = True
            logger.info(f"Groq client initialized with key: {_mask_key(self.api_key)}")
            return True
        except Exception as e:
            logger.error(f"Groq: Failed to initialize client: {type(e).__name__}: {e}")
            self._is_available = False
            self._client = None
            return False

    async def _test_connection(self):
        if not self._client:
            raise LLMConnectionError(
                "Groq client not initialized", provider=self.provider
            )
        try:
            await self._client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=1,
                temperature=0.1,
            )
        except Exception as e:
            logger.error(f"Groq connection test failed: {type(e).__name__}: {e}")
            raise

    async def generate(self, request: LLMRequest) -> LLMResponse:
        if not self.is_available or not self._client:
            raise LLMError("Groq client not available", provider=self.provider)
        try:
            start_time = time.time()
            messages = self._prepare_messages(request)
            model = request.model or self.model
            response = await self._client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=request.max_tokens or 4000,
                temperature=request.temperature or 0.1,
            )
            response_time = time.time() - start_time
            content = response.choices[0].message.content
            usage = None
            if response.usage:
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            logger.info(f"Groq: Generation completed in {response_time:.2f}s")
            return self._create_response(
                content=content, model=model, usage=usage, response_time=response_time
            )
        except Exception as e:
            logger.error(f"Groq: Generation error: {type(e).__name__}: {e}")
            return await self._handle_groq_error(e)

    async def _handle_groq_error(self, error: Exception) -> LLMResponse:
        """Handle Groq-specific errors."""
        logger.error(f"Groq API error: {type(error).__name__}: {error}")

        error_message = str(error)

        # Check for specific error types
        if "rate_limit" in error_message.lower() or "429" in error_message:
            raise LLMRateLimitError(
                f"Groq rate limit exceeded: {error_message}",
                provider=self.provider,
                error_code="rate_limit",
            )
        elif "quota" in error_message.lower() or "billing" in error_message.lower():
            raise LLMQuotaExceededError(
                f"Groq quota exceeded: {error_message}",
                provider=self.provider,
                error_code="quota_exceeded",
            )
        elif (
            "connection" in error_message.lower() or "network" in error_message.lower()
        ):
            raise LLMConnectionError(
                f"Groq connection error: {error_message}",
                provider=self.provider,
                error_code="connection_error",
            )
        elif (
            "invalid argument" in error_message.lower()
            or "errno 22" in error_message.lower()
        ):
            raise LLMError(
                f"Groq API error (invalid argument): {error_message}",
                provider=self.provider,
                error_code="invalid_argument",
            )
        else:
            raise LLMError(
                f"Groq API error: {error_message}",
                provider=self.provider,
                error_code="api_error",
            )

    async def health_check(self) -> Dict[str, Any]:
        """Perform Groq health check via SDK."""
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
            start_time = time.time()
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1,
                temperature=0.1,
            )
            response_time = time.time() - start_time
            health_status.update(
                {
                    "status": "healthy",
                    "response_time": response_time,
                    "model_available": True,
                }
            )
            if response.usage:
                health_status["usage"] = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
        except Exception as e:
            health_status.update(
                {
                    "status": "error",
                    "error": f"{type(e).__name__}: {e}",
                    "model_available": False,
                }
            )
        return health_status

    async def close(self):
        """Close Groq client (SDK)."""
        await super().close()
        self._client = None
        logger.info("Groq client closed")
