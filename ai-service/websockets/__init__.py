"""
WebSocket Management for AI Service
Clean namespace-based architecture following agent pattern
"""

from .manager import ai_websocket_manager
from .core.registry import ai_websocket_registry

__all__ = ["ai_websocket_manager", "ai_websocket_registry"]
