"""
WebSocket Registry for Agent Namespaces
Manages namespace registration and routing
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class AgentWebSocketRegistry:
    """
    Registry for managing WebSocket namespaces in the agent
    Provides centralized namespace management and statistics
    """

    def __init__(self):
        self.namespaces: Dict[str, Any] = {}
        self.namespace_stats: Dict[str, Dict] = {}

    def register_namespace(self, namespace_path: str, namespace_instance: Any) -> bool:
        """
        Register a namespace with the registry

        Args:
            namespace_path: Namespace path (e.g., '/agent-logs')
            namespace_instance: Namespace class instance

        Returns:
            bool: Success status
        """
        try:
            if namespace_path in self.namespaces:
                logger.warning(f"Namespace {namespace_path} already registered")
                return False

            self.namespaces[namespace_path] = namespace_instance
            self.namespace_stats[namespace_path] = {
                "registered_at": logger.getEffectiveLevel(),  # Placeholder for timestamp
                "active": True,
                "events_handled": 0,
                "errors": 0,
            }

            logger.info(f"SUCCESS: Registered namespace: {namespace_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to register namespace {namespace_path}: {e}")
            return False

    def unregister_namespace(self, namespace_path: str) -> bool:
        """
        Unregister a namespace

        Args:
            namespace_path: Namespace path to unregister

        Returns:
            bool: Success status
        """
        try:
            if namespace_path not in self.namespaces:
                logger.warning(
                    f"Namespace {namespace_path} not found for unregistration"
                )
                return False

            # Cleanup namespace
            namespace_instance = self.namespaces[namespace_path]
            if hasattr(namespace_instance, "cleanup"):
                namespace_instance.cleanup()

            del self.namespaces[namespace_path]
            if namespace_path in self.namespace_stats:
                self.namespace_stats[namespace_path]["active"] = False

            logger.info(f"SUCCESS: Unregistered namespace: {namespace_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to unregister namespace {namespace_path}: {e}")
            return False

    def get_namespace(self, namespace_path: str) -> Optional[Any]:
        """Get namespace instance by path"""
        return self.namespaces.get(namespace_path)

    def get_all_namespaces(self) -> Dict[str, Any]:
        """Get all registered namespaces"""
        return self.namespaces.copy()

    def get_namespace_paths(self) -> List[str]:
        """Get list of all registered namespace paths"""
        return list(self.namespaces.keys())

    def increment_event_count(self, namespace_path: str):
        """Increment event count for namespace statistics"""
        if namespace_path in self.namespace_stats:
            self.namespace_stats[namespace_path]["events_handled"] += 1

    def increment_error_count(self, namespace_path: str):
        """Increment error count for namespace statistics"""
        if namespace_path in self.namespace_stats:
            self.namespace_stats[namespace_path]["errors"] += 1

    def get_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        return {
            "total_namespaces": len(self.namespaces),
            "active_namespaces": len(
                [ns for ns in self.namespace_stats.values() if ns.get("active", False)]
            ),
            "namespace_paths": list(self.namespaces.keys()),
            "namespace_stats": self.namespace_stats.copy(),
        }

    def cleanup(self):
        """Cleanup all namespaces"""
        logger.info("Cleaning up WebSocket registry...")

        for namespace_path, namespace_instance in self.namespaces.items():
            try:
                if hasattr(namespace_instance, "cleanup"):
                    namespace_instance.cleanup()
                logger.debug(f"SUCCESS: Cleaned up namespace: {namespace_path}")
            except Exception as e:
                logger.error(f"Error cleaning up namespace {namespace_path}: {e}")

        self.namespaces.clear()
        for stats in self.namespace_stats.values():
            stats["active"] = False

        logger.info("SUCCESS: WebSocket registry cleanup completed")


# Global registry instance
agent_registry = AgentWebSocketRegistry()
