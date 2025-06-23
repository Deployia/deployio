"""
Exception handling package for the AI Service
"""

from .analysis_exceptions import (
    AnalysisException,
    RepositoryNotFoundException,
    RepositoryAccessException,
    InvalidRepositoryException,
    BranchNotFoundException,
    AnalysisTimeoutException,
    LLMServiceException,
    RateLimitExceededException,
    InsufficientDataException,
    ConfigurationException,
    DependencyServiceException,
)

__all__ = [
    "AnalysisException",
    "RepositoryNotFoundException",
    "RepositoryAccessException",
    "InvalidRepositoryException",
    "BranchNotFoundException",
    "AnalysisTimeoutException",
    "LLMServiceException",
    "RateLimitExceededException",
    "InsufficientDataException",
    "ConfigurationException",
    "DependencyServiceException",
]
