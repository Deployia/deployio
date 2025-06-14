"""
Middleware package initialization
"""

from .error_handler import setup_exception_handlers

__all__ = [
    "setup_exception_handlers",
]
