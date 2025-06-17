"""
Middleware package initialization for DeployIO Agent
"""

from .error_handler import setup_exception_handlers
from .auth import AuthMiddleware

__all__ = [
    "setup_exception_handlers",
    "AuthMiddleware",
]
