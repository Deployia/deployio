"""
LLM API Client - Handles actual API calls with retry logic and fallbacks
"""

import logging
import asyncio
from typing import Optional
from .models import LLMRequest, LLMResponse, LLMProvider
from .client_manager import LLMClientManager

logger = logging.getLogger(__name__)


class LLMAPIClient:
    """Handles LLM API calls with robust error handling and fallbacks"""

    def __init__(self, client_manager: LLMClientManager):
        self.client_manager = client_manager

    async def call_llm(self, request: LLMRequest) -> Optional[LLMResponse]:
        """
        Make LLM API call with fallback support

        Args:
            request: LLM request with prompt and configuration

        Returns:
            LLMResponse or None if all attempts fail
        """
        try:
            # Get preferred client
            client, provider = self.client_manager.get_preferred_client(
                request.provider_preference
            )

            if not client:
                logger.error("No LLM clients available")
                logger.error("FALLBACK TRIGGERED: No LLM clients available")
                return None

            # Try primary provider
            response = await self._call_with_provider(request, provider, client)
            if response and response.success:
                return response

            # Try fallback providers
            for fallback_provider in self.client_manager.get_available_providers():
                if fallback_provider != provider:
                    logger.warning(f"Trying fallback provider: {fallback_provider}")
                    fallback_client = self.client_manager.get_client(fallback_provider)
                    response = await self._call_with_provider(
                        request, fallback_provider, fallback_client
                    )
                    if response and response.success:
                        logger.info(f"Fallback provider {fallback_provider} succeeded")
                        return response

            logger.error("All LLM providers failed")
            logger.error("FALLBACK TRIGGERED: All LLM providers failed")
            return None

        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            logger.error(f"FALLBACK TRIGGERED: LLM API call exception - {str(e)}")
            return None

    async def _call_with_provider(
        self, request: LLMRequest, provider: LLMProvider, client
    ) -> Optional[LLMResponse]:
        """Call specific provider with retry logic"""
        for attempt in range(self.client_manager.config.max_retries):
            try:
                if provider == LLMProvider.GROQ:
                    content = await self._call_groq(request, client)
                elif provider == LLMProvider.OPENAI:
                    content = await self._call_openai(request, client)
                else:
                    logger.error(f"Unknown provider: {provider}")
                    return None

                if content:
                    return LLMResponse(
                        content=content,
                        provider_used=provider,
                        model_used=request.model,
                        success=True,
                    )

            except Exception as e:
                logger.warning(f"Provider {provider} attempt {attempt + 1} failed: {e}")
                if attempt < self.client_manager.config.max_retries - 1:
                    await asyncio.sleep(self.client_manager.config.retry_delay)

        return LLMResponse(
            content="",
            provider_used=provider,
            model_used=request.model,
            success=False,
            error_message=f"All {self.client_manager.config.max_retries} attempts failed",
        )

    async def _call_groq(self, request: LLMRequest, client) -> Optional[str]:
        """Call Groq API with safety checks"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model=request.model,
                    messages=[{"role": "user", "content": request.prompt}],
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                ),
            )

            # Safety check for response structure
            if not response or not response.choices or len(response.choices) == 0:
                logger.error("Groq API returned empty response or no choices")
                return None

            choice = response.choices[0]
            if not choice or not choice.message or not choice.message.content:
                logger.error("Groq API returned invalid choice structure")
                return None

            return choice.message.content.strip()

        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            raise

    async def _call_openai(self, request: LLMRequest, client) -> Optional[str]:
        """Call OpenAI API with safety checks"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model=request.model,
                    messages=[{"role": "user", "content": request.prompt}],
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                ),
            )

            # Safety check for response structure
            if not response or not response.choices or len(response.choices) == 0:
                logger.error("OpenAI API returned empty response or no choices")
                return None

            choice = response.choices[0]
            if not choice or not choice.message or not choice.message.content:
                logger.error("OpenAI API returned invalid choice structure")
                return None

            return choice.message.content.strip()

        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise

    async def health_check(self) -> dict:
        """Perform health check on LLM services"""
        health = self.client_manager.health_check()

        # Test actual API calls if clients are available
        if health["any_available"]:
            test_request = LLMRequest(
                prompt="Say: Health check OK",
                model=self.client_manager.config.groq_model,
                max_tokens=10,
                temperature=0,
            )

            try:
                response = await self.call_llm(test_request)
                health["api_test"] = {
                    "success": response is not None and response.success,
                    "provider_used": response.provider_used.value if response else None,
                }
            except Exception as e:
                health["api_test"] = {"success": False, "error": str(e)}
        else:
            health["api_test"] = {"success": False, "error": "No clients available"}

        return health
