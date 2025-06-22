"""
Core LLM models and data structures
"""

from dataclasses import dataclass
from typing import Optional
from enum import Enum


class LLMProvider(Enum):
    """Available LLM providers"""

    GROQ = "groq"
    OPENAI = "openai"


class LLMModel(Enum):
    """Available LLM models"""

    # Groq models
    LLAMA_3_3_70B = "llama-3.3-70b-versatile"
    LLAMA_3_1_8B = "llama-3.1-8b-instant"

    # OpenAI models
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_3_5_TURBO = "gpt-3.5-turbo"


@dataclass
class LLMRequest:
    """Request structure for LLM API calls"""

    prompt: str
    model: str
    max_tokens: int = 1000
    temperature: float = 0.1
    provider_preference: Optional[LLMProvider] = None


@dataclass
class LLMResponse:
    """Response structure from LLM API calls"""

    content: str
    provider_used: LLMProvider
    model_used: str
    success: bool = True
    error_message: Optional[str] = None
    tokens_used: Optional[int] = None


@dataclass
class LLMClientConfig:
    """Configuration for LLM clients"""

    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    groq_model: str = LLMModel.LLAMA_3_3_70B.value
    openai_model: str = LLMModel.GPT_4_TURBO.value
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: float = 30.0
    max_tokens: int = 4000
    temperature: float = 0.1
