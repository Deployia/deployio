"""
Base LLM Client

Abstract base class for all LLM provider implementations.
Provides a consistent interface for different LLM providers.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime

from .models import LLMRequest, LLMResponse, LLMProvider, LLMError

logger = logging.getLogger(__name__)


class BaseLLMClient(ABC):
    """
    Abstract base class for LLM clients.

    All LLM provider implementations should inherit from this class
    and implement the required methods.
    """

    def __init__(self, api_key: str, model: str, **kwargs):
        self.api_key = api_key
        self.model = model
        self.max_retries = kwargs.get("max_retries", 3)
        self.retry_delay = kwargs.get("retry_delay", 1.0)
        self.timeout = kwargs.get("timeout", 30.0)
        self._client = None
        self._is_available = False

    @property
    @abstractmethod
    def provider(self) -> LLMProvider:
        """Return the provider type."""
        pass

    @property
    def is_available(self) -> bool:
        """Check if the client is available for use."""
        return self._is_available and self._client is not None

    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the LLM client.

        Returns:
            True if initialization successful, False otherwise
        """
        pass

    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """
        Generate content using the LLM.

        Args:
            request: LLM request with messages and parameters

        Returns:
            LLM response with generated content

        Raises:
            LLMError: If generation fails
        """
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the client.

        Returns:
            Health status information
        """
        pass

    async def generate_with_retry(self, request: LLMRequest) -> LLMResponse:
        """
        Generate content with retry logic.

        Args:
            request: LLM request

        Returns:
            LLM response

        Raises:
            LLMError: If all retries fail
        """
        last_error = None

        for attempt in range(self.max_retries):
            try:
                logger.debug(f"LLM generation attempt {attempt + 1}/{self.max_retries}")
                response = await self.generate(request)

                if attempt > 0:
                    logger.info(f"LLM generation succeeded on attempt {attempt + 1}")

                return response

            except Exception as e:
                last_error = e
                logger.warning(f"LLM generation attempt {attempt + 1} failed: {e}")

                if attempt < self.max_retries - 1:
                    await asyncio.sleep(
                        self.retry_delay * (2**attempt)
                    )  # Exponential backoff
                else:
                    logger.error(
                        f"All {self.max_retries} LLM generation attempts failed"
                    )

        # If we get here, all retries failed
        if isinstance(last_error, LLMError):
            raise last_error
        else:
            raise LLMError(
                f"LLM generation failed after {self.max_retries} attempts: {str(last_error)}",
                provider=self.provider,
            )

    def _prepare_messages(self, request: LLMRequest) -> List[Dict[str, str]]:
        """
        Prepare messages for the LLM API.

        Args:
            request: LLM request

        Returns:
            Formatted messages
        """
        messages = []

        # Add system prompt if provided
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})

        # Add user messages
        messages.extend(request.messages)

        return messages

    def _create_response(
        self,
        content: str,
        model: str,
        usage: Optional[Dict[str, Any]] = None,
        response_time: Optional[float] = None,
        success: bool = True,
        error: Optional[str] = None,
    ) -> LLMResponse:
        """
        Create a standardized LLM response.

        Args:
            content: Generated content
            model: Model used
            usage: Token usage information
            response_time: Response time in seconds
            success: Whether the generation was successful
            error: Error message if failed

        Returns:
            Standardized LLM response
        """
        return LLMResponse(
            content=content,
            provider=self.provider,
            model=model,
            success=success,
            usage=usage,
            response_time=response_time,
            error=error,
            timestamp=datetime.utcnow(),
        )

    async def close(self):
        """Close the client connection."""
        self._is_available = False
        # Subclasses can override this to perform cleanup
        pass
