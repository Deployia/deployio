"""
LLM Models and Data Structures

Shared models for LLM client communication and configuration.
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    GROQ = "groq"


class LLMRequest(BaseModel):
    """Standard LLM request model."""
    
    messages: List[Dict[str, str]] = Field(..., description="Messages for the LLM")
    max_tokens: Optional[int] = Field(default=4000, description="Maximum tokens to generate")
    temperature: Optional[float] = Field(default=0.1, description="Temperature for generation")
    model: Optional[str] = Field(default=None, description="Specific model to use")
    system_prompt: Optional[str] = Field(default=None, description="System prompt override")
    
    class Config:
        extra = "allow"  # Allow additional provider-specific parameters


class LLMResponse(BaseModel):
    """Standard LLM response model."""
    
    content: str = Field(..., description="Generated content")
    provider: LLMProvider = Field(..., description="Provider used")
    model: str = Field(..., description="Model used")
    usage: Optional[Dict[str, Any]] = Field(default=None, description="Token usage information")
    response_time: Optional[float] = Field(default=None, description="Response time in seconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        extra = "allow"  # Allow additional provider-specific fields


class LLMClientConfig(BaseModel):
    """Configuration for LLM clients."""
    
    # API Keys
    openai_api_key: Optional[str] = Field(default=None)
    groq_api_key: Optional[str] = Field(default=None)
    
    # Model configurations
    openai_model: str = Field(default="gpt-4o-mini")
    groq_model: str = Field(default="llama-3.3-70b-versatile")
    
    # Request settings
    max_tokens: int = Field(default=4000)
    temperature: float = Field(default=0.1)
    timeout: float = Field(default=30.0)
    
    # Retry settings
    max_retries: int = Field(default=3)
    retry_delay: float = Field(default=1.0)
    
    # Provider preferences
    preferred_provider: Optional[LLMProvider] = Field(default=None)
    fallback_providers: List[LLMProvider] = Field(default_factory=list)


class LLMError(Exception):
    """Base exception for LLM operations."""
    
    def __init__(self, message: str, provider: Optional[LLMProvider] = None, error_code: Optional[str] = None):
        super().__init__(message)
        self.provider = provider
        self.error_code = error_code
        self.timestamp = datetime.utcnow()


class LLMRateLimitError(LLMError):
    """Rate limit exceeded error."""
    pass


class LLMQuotaExceededError(LLMError):
    """Quota exceeded error."""
    pass


class LLMConnectionError(LLMError):
    """Connection error."""
    pass


class LLMValidationError(LLMError):
    """Request validation error."""
    pass
