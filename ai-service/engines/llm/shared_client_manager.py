"""
Shared LLMClientManager instance for all enhancers and orchestrators.
"""

from .client_manager import LLMClientManager

shared_llm_client_manager = LLMClientManager()
