"""
WebSocket Registry for AI Service
Manages namespace registration and lifecycle
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class AIWebSocketRegistry:
    """
    WebSocket namespace registry for AI service
    Manages namespace instances and their lifecycle
    """

    def __init__(self):
        self.namespaces: Dict[str, Any] = {}
        self.websocket_manager = None

    def initialize(self, websocket_manager):
        """Initialize registry with WebSocket manager"""
        self.websocket_manager = websocket_manager
        logger.info("AI WebSocket registry initialized")

    def register(self, namespace_path: str, namespace_instance):
        """Register a namespace instance"""
        self.namespaces[namespace_path] = namespace_instance
        logger.info(f"Registered namespace: {namespace_path}")
        return namespace_instance

    def get_namespace(self, namespace_path: str):
        """Get a registered namespace"""
        return self.namespaces.get(namespace_path)

    def get_all_namespaces(self) -> Dict[str, Any]:
        """Get all registered namespaces"""
        return self.namespaces.copy()

    def unregister(self, namespace_path: str):
        """Unregister a namespace"""
        if namespace_path in self.namespaces:
            del self.namespaces[namespace_path]
            logger.info(f"Unregistered namespace: {namespace_path}")

    def get_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        return {
            "total_namespaces": len(self.namespaces),
            "namespaces": list(self.namespaces.keys()),
            "manager_connected": self.websocket_manager is not None,
        }


# Global registry instance
ai_websocket_registry = AIWebSocketRegistry()
