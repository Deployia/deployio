"""
Core package - Application core modules
"""

from app.core.config import settings
from app.core.logging import setup_logging

__all__ = ["settings", "setup_logging"]
