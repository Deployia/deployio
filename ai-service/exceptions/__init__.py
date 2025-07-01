"""
Exception handling package for the AI Service
Clean exceptions for server-provided repository data architecture
"""

from .analysis_exceptions import (
    AnalysisException,
    AnalysisTimeoutException,
    LLMServiceException,
    RateLimitExceededException,
    InsufficientDataException,
    ConfigurationException,
    DependencyServiceException,
)

__all__ = [
    "AnalysisException",
    "AnalysisTimeoutException",
    "LLMServiceException",
    "RateLimitExceededException",
    "InsufficientDataException",
    "ConfigurationException",
    "DependencyServiceException",
]
