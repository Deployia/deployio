"""
Groq LLM Client

Groq-specific implementation of the LLM client interface.
Handles Groq API communication with proper error handling and retry logic.
"""

import logging
import time
from typing import Dict, List, Optional, Any

from .base_client import BaseLLMClient
from .models import (
    LLMRequest, LLMResponse, LLMProvider, LLMError,
    LLMRateLimitError, LLMQuotaExceededError, LLMConnectionError
)

logger = logging.getLogger(__name__)

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("Groq client not available")


class GroqClient(BaseLLMClient):
    """Groq LLM client implementation."""
    
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile", **kwargs):
        super().__init__(api_key, model, **kwargs)
        self.provider_name = "Groq"
        
        if not GROQ_AVAILABLE:
            logger.error("Groq client library not available")
            return
            
        if not api_key:
            logger.error("Groq API key not provided")
            return
    
    @property
    def provider(self) -> LLMProvider:
        return LLMProvider.GROQ
    
    async def initialize(self) -> bool:
        """Initialize the Groq client."""
        try:
            if not GROQ_AVAILABLE:
                logger.error("Groq library not available")
                return False
                
            if not self.api_key:
                logger.error("Groq API key not provided")
                return False
            
            # Validate API key format
            if not self.api_key.startswith("gsk_"):
                logger.warning("Groq API key format appears invalid (should start with 'gsk_')")
            
            # Initialize async client
            self._client = AsyncGroq(api_key=self.api_key)
            
            # Test connection with a simple call
            await self._test_connection()
            
            self._is_available = True
            logger.info(f"Groq client initialized successfully with model {self.model}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
            self._is_available = False
            return False
    
    async def _test_connection(self):
        """Test Groq connection with a minimal request."""
        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=1,
                temperature=0.1
            )
            logger.debug("Groq connection test successful")
        except Exception as e:
            logger.error(f"Groq connection test failed: {e}")
            raise
    
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate content using Groq."""
        if not self.is_available:
            raise LLMError("Groq client not available", provider=self.provider)
        
        try:
            start_time = time.time()
            
            # Prepare messages
            messages = self._prepare_messages(request)
            
            # Use model from request or fallback to client default
            model = request.model or self.model
            
            # Make API call
            response = await self._client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=request.max_tokens or 4000,
                temperature=request.temperature or 0.1
            )
            
            response_time = time.time() - start_time
            
            # Extract content
            content = response.choices[0].message.content
            
            # Extract usage information
            usage = None
            if response.usage:
                usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            
            logger.debug(f"Groq generation completed in {response_time:.2f}s")
            
            return self._create_response(
                content=content,
                model=model,
                usage=usage,
                response_time=response_time
            )
            
        except Exception as e:
            return await self._handle_groq_error(e)
    
    async def _handle_groq_error(self, error: Exception) -> LLMResponse:
        """Handle Groq-specific errors."""
        logger.error(f"Groq API error: {error}")
        
        error_message = str(error)
        
        # Check for specific error types
        if "rate_limit" in error_message.lower() or "429" in error_message:
            raise LLMRateLimitError(
                f"Groq rate limit exceeded: {error_message}",
                provider=self.provider,
                error_code="rate_limit"
            )
        elif "quota" in error_message.lower() or "billing" in error_message.lower():
            raise LLMQuotaExceededError(
                f"Groq quota exceeded: {error_message}",
                provider=self.provider,
                error_code="quota_exceeded"
            )
        elif "connection" in error_message.lower() or "network" in error_message.lower():
            raise LLMConnectionError(
                f"Groq connection error: {error_message}",
                provider=self.provider,
                error_code="connection_error"
            )
        else:
            raise LLMError(
                f"Groq API error: {error_message}",
                provider=self.provider,
                error_code="api_error"
            )
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform Groq health check."""
        health_status = {
            "provider": self.provider.value,
            "model": self.model,
            "available": self.is_available,
            "timestamp": time.time()
        }
        
        if not self.is_available:
            health_status["status"] = "unavailable"
            health_status["error"] = "Client not initialized"
            return health_status
        
        try:
            # Test with minimal request
            start_time = time.time()
            
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1,
                temperature=0.1
            )
            
            response_time = time.time() - start_time
            
            health_status.update({
                "status": "healthy",
                "response_time": response_time,
                "model_available": True
            })
            
            if response.usage:
                health_status["usage"] = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
                
        except Exception as e:
            health_status.update({
                "status": "error",
                "error": str(e),
                "model_available": False
            })
            
        return health_status
    
    async def close(self):
        """Close Groq client."""
        await super().close()
        if self._client:
            # Groq client doesn't have async close method yet
            self._client = None
        logger.info("Groq client closed")
