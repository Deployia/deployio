"""
LLM Client Manager

Manages multiple LLM clients and provides a unified interface.
Handles provider selection, fallbacks, and load balancing.
"""

import os
import logging
import asyncio
from typing import Dict, List, Optional, Any

from .base_client import BaseLLMClient
from .gemini_client import GeminiClient
from .openai_client import OpenAIClient
from .groq_client import GroqClient
from .models import (
    LLMRequest,
    LLMResponse,
    LLMProvider,
    LLMClientConfig,
    LLMError,
    LLMRateLimitError,
    LLMQuotaExceededError,
)

logger = logging.getLogger(__name__)


class LLMClientManager:
    """
    Manages multiple LLM clients and provides unified access.

    Features:
    - Automatic client initialization
    - Provider selection and fallbacks
    - Health monitoring
    - Load balancing across providers
    """

    def __init__(self, config: Optional[LLMClientConfig] = None):
        self.config = config or self._load_config_from_env()
        self.clients: Dict[LLMProvider, BaseLLMClient] = {}
        self._initialized = False

    def _load_config_from_env(self) -> LLMClientConfig:
        """Load configuration from environment variables."""
        return LLMClientConfig(
            gemini_api_key=os.getenv("GEMINI_API_KEY"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            groq_api_key=os.getenv("GROQ_API_KEY"),
            gemini_model=os.getenv("LLM_MODEL_GEMINI", "gemini-flash-latest"),
            openai_model=os.getenv("LLM_MODEL_OPENAI", "gpt-4o-mini"),
            groq_model=os.getenv("LLM_MODEL_GROQ", "llama-3.3-70b-versatile"),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "4000")),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.1")),
            timeout=float(os.getenv("LLM_TIMEOUT", "60.0")),
            max_retries=int(os.getenv("LLM_MAX_RETRIES", "3")),
            retry_delay=float(os.getenv("LLM_RETRY_DELAY", "1.0")),
            preferred_provider=LLMProvider(
                os.getenv("LLM_PREFERRED_PROVIDER", "gemini")
            ),
            fallback_providers=[
                LLMProvider.GEMINI,
                LLMProvider.GROQ,
                LLMProvider.OPENAI,
            ],
        )

    async def initialize(self) -> bool:
        """Initialize all available LLM clients."""
        if self._initialized:
            return True

        try:
            logger.info("Initializing LLM clients...")

            # Initialize Gemini client if API key is available
            if self.config.gemini_api_key:
                gemini_client = GeminiClient(
                    api_key=self.config.gemini_api_key,
                    model=self.config.gemini_model,
                    max_retries=self.config.max_retries,
                    retry_delay=self.config.retry_delay,
                    timeout=self.config.timeout,
                )

                if await gemini_client.initialize():
                    self.clients[LLMProvider.GEMINI] = gemini_client
                    logger.info("Gemini client initialized successfully")
                else:
                    logger.warning("Failed to initialize Gemini client")
            else:
                logger.info("Gemini API key not provided, skipping initialization")

            # Initialize OpenAI client if API key is available
            if self.config.openai_api_key:
                openai_client = OpenAIClient(
                    api_key=self.config.openai_api_key,
                    model=self.config.openai_model,
                    max_retries=self.config.max_retries,
                    retry_delay=self.config.retry_delay,
                    timeout=self.config.timeout,
                )

                if await openai_client.initialize():
                    self.clients[LLMProvider.OPENAI] = openai_client
                    logger.info("OpenAI client initialized successfully")
                else:
                    logger.warning("Failed to initialize OpenAI client")
            else:
                logger.info("OpenAI API key not provided, skipping initialization")

            # Initialize Groq client if API key is available
            if self.config.groq_api_key:
                groq_client = GroqClient(
                    api_key=self.config.groq_api_key,
                    model=self.config.groq_model,
                    max_retries=self.config.max_retries,
                    retry_delay=self.config.retry_delay,
                    timeout=self.config.timeout,
                )

                if await groq_client.initialize():
                    self.clients[LLMProvider.GROQ] = groq_client
                    logger.info("Groq client initialized successfully")
                else:
                    logger.warning("Failed to initialize Groq client")
            else:
                logger.info("Groq API key not provided, skipping initialization")

            self._initialized = True

            available_providers = self.get_available_providers()
            logger.info(
                f"LLM Client Manager initialized with providers: {available_providers}"
            )

            return len(available_providers) > 0

        except Exception as e:
            logger.error(f"Failed to initialize LLM Client Manager: {e}")
            return False

    def get_available_providers(self) -> List[LLMProvider]:
        """Get list of available and healthy providers."""
        return [
            provider for provider, client in self.clients.items() if client.is_available
        ]

    def get_client(
        self, provider: Optional[LLMProvider] = None
    ) -> Optional[BaseLLMClient]:
        """
        Get a specific LLM client.

        Args:
            provider: Specific provider to get, or None for best available

        Returns:
            LLM client or None if not available
        """
        if provider and provider in self.clients:
            client = self.clients[provider]
            return client if client.is_available else None

        # Return best available client
        available_providers = self.get_available_providers()
        if not available_providers:
            return None

        # Prefer configured provider if available
        if self.config.preferred_provider in available_providers:
            return self.clients[self.config.preferred_provider]

        # Return first available
        return self.clients[available_providers[0]]

    async def generate(
        self, request: LLMRequest, preferred_provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """
        Generate content using the best available provider.

        Args:
            request: LLM request
            preferred_provider: Preferred provider for this request

        Returns:
            LLM response

        Raises:
            LLMError: If no providers are available or all fail
        """
        if not self._initialized:
            if not await self.initialize():
                raise LLMError("No LLM providers available")

        # Determine provider order
        providers_to_try = self._get_provider_order(preferred_provider)

        if not providers_to_try:
            raise LLMError("No LLM providers available")

        last_error = None

        for provider in providers_to_try:
            client = self.get_client(provider)
            if not client:
                continue

            try:
                logger.debug(f"Attempting LLM generation with {provider.value}")
                response = await client.generate_with_retry(request)

                logger.info(f"LLM generation successful with {provider.value}")
                return response

            except (LLMRateLimitError, LLMQuotaExceededError) as e:
                logger.warning(f"Provider {provider.value} unavailable: {e}")
                last_error = e
                continue  # Try next provider

            except LLMError as e:
                logger.error(f"Provider {provider.value} failed: {e}")
                last_error = e
                continue  # Try next provider

            except Exception as e:
                logger.error(f"Unexpected error with provider {provider.value}: {e}")
                last_error = LLMError(f"Unexpected error: {str(e)}", provider=provider)
                continue

        # If we get here, all providers failed
        if last_error:
            raise last_error
        else:
            raise LLMError("All LLM providers failed")

    def _get_provider_order(
        self, preferred_provider: Optional[LLMProvider] = None
    ) -> List[LLMProvider]:
        """Get the order of providers to try for a request."""
        available_providers = self.get_available_providers()

        if not available_providers:
            return []

        # Start with preferred provider
        providers_to_try = []

        # Add specific preferred provider if available
        if preferred_provider and preferred_provider in available_providers:
            providers_to_try.append(preferred_provider)

        # Add configured preferred provider if available and not already added
        elif self.config.preferred_provider in available_providers:
            if self.config.preferred_provider not in providers_to_try:
                providers_to_try.append(self.config.preferred_provider)

        # Add fallback providers
        for fallback in self.config.fallback_providers:
            if fallback in available_providers and fallback not in providers_to_try:
                providers_to_try.append(fallback)

        # Add any remaining available providers
        for provider in available_providers:
            if provider not in providers_to_try:
                providers_to_try.append(provider)

        return providers_to_try

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all clients."""
        if not self._initialized:
            await self.initialize()

        health_status = {
            "manager_initialized": self._initialized,
            "total_providers": len(self.clients),
            "available_providers": len(self.get_available_providers()),
            "providers": {},
        }

        # Check each client
        for provider, client in self.clients.items():
            try:
                client_health = await client.health_check()
                health_status["providers"][provider.value] = client_health
            except Exception as e:
                health_status["providers"][provider.value] = {
                    "status": "error",
                    "error": str(e),
                    "available": False,
                }

        # Overall health
        available_count = len(self.get_available_providers())
        health_status["overall_status"] = (
            "healthy" if available_count > 0 else "unhealthy"
        )

        return health_status

    async def close(self):
        """Close all clients."""
        logger.info("Closing LLM Client Manager...")

        close_tasks = []
        for client in self.clients.values():
            close_tasks.append(client.close())

        if close_tasks:
            await asyncio.gather(*close_tasks, return_exceptions=True)

        self.clients.clear()
        self._initialized = False

        logger.info("LLM Client Manager closed")
