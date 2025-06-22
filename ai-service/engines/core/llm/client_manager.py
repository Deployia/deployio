"""
LLM Client Manager - Handles initialization and management of LLM clients
"""

import logging
import os
from typing import Optional, List
from .models import LLMClientConfig, LLMProvider

logger = logging.getLogger(__name__)

# Import LLM clients with error handling
try:
    from groq import Groq

    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("Groq client not available")

try:
    from openai import OpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI client not available")


class LLMClientManager:
    """Manages LLM client initialization and health"""

    def __init__(self, config: Optional[LLMClientConfig] = None):
        self.config = config or self._load_config_from_env()
        self.groq_client: Optional[Groq] = None
        self.openai_client: Optional[OpenAI] = None
        self._initialize_clients()

    def _load_config_from_env(self) -> LLMClientConfig:
        """Load configuration from environment variables"""
        return LLMClientConfig(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            groq_model=os.getenv("LLM_MODEL_GROQ", "llama-3.3-70b-versatile"),
            openai_model=os.getenv("LLM_MODEL_OPENAI", "gpt-4-turbo-preview"),
            max_retries=int(os.getenv("LLM_MAX_RETRIES", "3")),
            retry_delay=float(os.getenv("LLM_RETRY_DELAY", "1.0")),
            timeout=float(os.getenv("LLM_TIMEOUT", "30.0")),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "4000")),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.1")),
        )

    def _initialize_clients(self):
        """Initialize available LLM clients"""
        try:
            # Unset SSL_CERT_FILE if present to avoid invalid argument error
            os.environ.pop("SSL_CERT_FILE", None)

            # Initialize Groq client
            if self.config.groq_api_key and GROQ_AVAILABLE:
                self._init_groq_client()
            else:
                logger.info("Groq API key not found or client unavailable")

            # Initialize OpenAI client
            if self.config.openai_api_key and OPENAI_AVAILABLE:
                self._init_openai_client()
            else:
                logger.info("OpenAI API key not found or client unavailable")

        except Exception as e:
            logger.error(f"Failed to initialize LLM clients: {e}")
            logger.error(
                f"FALLBACK TRIGGERED: LLM client initialization failed - {str(e)}"
            )

    def _init_groq_client(self):
        """Initialize Groq client with validation"""
        try:
            # Validate API key format
            if not self.config.groq_api_key.startswith("gsk_"):
                logger.warning(
                    "Groq API key format appears invalid (should start with 'gsk_')"
                )

            self.groq_client = Groq(api_key=self.config.groq_api_key)
            logger.info("Groq client initialized successfully")

            # Simple API call to verify connection
            self._verify_groq_connection()

        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
            self.groq_client = None

    def _init_openai_client(self):
        """Initialize OpenAI client with validation"""
        try:
            self.openai_client = OpenAI(api_key=self.config.openai_api_key)
            logger.info("OpenAI client initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.openai_client = None

    def _verify_groq_connection(self):
        """Verify Groq client connection with a simple API call"""
        try:
            response = self.groq_client.chat.completions.create(
                model=self.config.groq_model,
                messages=[{"role": "user", "content": "Say: Connection verified"}],
                max_tokens=10,
                temperature=0,
            )
            result = (
                response.choices[0].message.content.strip()
                if response.choices
                else "No response"
            )
            logger.info(f"Groq connection verified: {result}")
        except Exception as e:
            logger.warning(f"Groq connection verification failed: {e}")

    def get_available_providers(self) -> List[LLMProvider]:
        """Get list of available LLM providers"""
        providers = []
        if self.groq_client:
            providers.append(LLMProvider.GROQ)
        if self.openai_client:
            providers.append(LLMProvider.OPENAI)
        return providers

    def get_client(self, provider: LLMProvider):
        """Get specific client by provider"""
        if provider == LLMProvider.GROQ:
            return self.groq_client
        elif provider == LLMProvider.OPENAI:
            return self.openai_client
        else:
            raise ValueError(f"Unknown provider: {provider}")

    def get_preferred_client(self, preference: Optional[LLMProvider] = None):
        """Get preferred client or fallback to available"""
        if preference and self.get_client(preference):
            return self.get_client(preference), preference

        # Fallback order: Groq -> OpenAI
        if self.groq_client:
            return self.groq_client, LLMProvider.GROQ
        elif self.openai_client:
            return self.openai_client, LLMProvider.OPENAI
        else:
            return None, None

    def health_check(self) -> dict:
        """Perform health check on all clients"""
        return {
            "groq": {
                "available": self.groq_client is not None,
                "api_key_configured": bool(self.config.groq_api_key),
                "library_installed": GROQ_AVAILABLE,
            },
            "openai": {
                "available": self.openai_client is not None,
                "api_key_configured": bool(self.config.openai_api_key),
                "library_installed": OPENAI_AVAILABLE,
            },
            "any_available": len(self.get_available_providers()) > 0,
        }
