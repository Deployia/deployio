"""
WebSocket Initialization for DeployIO Agent
Sets up and manages WebSocket namespaces and connections
"""

import logging
from typing import Dict, Any

from app.websockets.manager import websocket_manager
from app.websockets.core.registry import agent_registry
from app.websockets.core.auth import agent_auth
from app.websockets.namespaces.logs_namespace import agent_logs_namespace
from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentWebSocketService:
    """
    WebSocket Service for DeployIO Agent
    Manages WebSocket lifecycle and namespace initialization
    """

    def __init__(self):
        self.is_initialized = False
        self.is_connected = False
        self.enabled_features = {
            "logs": True,
            "metrics": False,  # TODO: Implement in Phase 1
            "builds": False,  # TODO: Implement in Phase 2
            "deployments": False,  # TODO: Implement in Phase 2
        }

    async def initialize(self) -> bool:
        """
        Initialize WebSocket service and all namespaces

        Returns:
            bool: Initialization success status
        """
        if self.is_initialized:
            logger.debug("WebSocket service already initialized")
            return True

        try:
            logger.info("Initializing Agent WebSocket service...")

            # Validate configuration
            is_valid, error_msg = agent_auth.validate_connection_config()
            if not is_valid:
                logger.error(f"WebSocket configuration invalid: {error_msg}")
                return False

            # Initialize WebSocket manager
            success = await websocket_manager.initialize(settings.platform_url)
            if not success:
                logger.error("Failed to initialize WebSocket manager")
                return False

            # Setup namespaces
            await self._setup_namespaces()

            # Register connection handlers
            self._setup_connection_handlers()

            self.is_initialized = True

            logger.info(
                "SUCCESS: Agent WebSocket service initialized successfully",
                {
                    "enabled_features": [
                        k for k, v in self.enabled_features.items() if v
                    ],
                    "agent_id": settings.agent_id,
                    "platform_url": settings.platform_url,
                },
            )

            return True

        except Exception as e:
            logger.error(f"Failed to initialize WebSocket service: {e}")
            return False

    async def connect(self) -> bool:
        """
        Connect to DeployIO Server

        Returns:
            bool: Connection success status
        """
        if not self.is_initialized:
            logger.error("WebSocket service not initialized")
            return False

        if self.is_connected:
            logger.debug("Already connected to server")
            return True

        try:
            logger.info("Connecting to DeployIO Server...")

            # Connect WebSocket manager
            success = await websocket_manager.connect(settings.platform_url)
            if not success:
                logger.error("Failed to connect WebSocket manager")
                return False

            self.is_connected = True

            logger.info("SUCCESS: Connected to DeployIO Server successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to server: {e}")
            return False

    async def disconnect(self):
        """Disconnect from DeployIO Server"""
        if not self.is_connected:
            return

        try:
            logger.info("Disconnecting from DeployIO Server...")

            # Disconnect WebSocket manager
            await websocket_manager.disconnect()

            self.is_connected = False

            logger.info("SUCCESS: Disconnected from DeployIO Server")

        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def cleanup(self):
        """Cleanup WebSocket service"""
        try:
            logger.info("Cleaning up WebSocket service...")

            # Disconnect if connected
            await self.disconnect()

            # Cleanup all namespaces
            for namespace_path in agent_registry.get_namespace_paths():
                namespace = agent_registry.get_namespace(namespace_path)
                if namespace and hasattr(namespace, "cleanup"):
                    await namespace.cleanup()

            # Cleanup registry
            agent_registry.cleanup()

            self.is_initialized = False

            logger.info("SUCCESS: WebSocket service cleanup completed")

        except Exception as e:
            logger.error(f"Error during WebSocket cleanup: {e}")

    async def _setup_namespaces(self):
        """Setup and register all enabled namespaces"""
        logger.info("Setting up WebSocket namespaces...")

        # Logs namespace
        if self.enabled_features["logs"]:
            try:
                await agent_logs_namespace.initialize(websocket_manager)
                websocket_manager.register_namespace(
                    "/agent-bridge", agent_logs_namespace
                )
                agent_registry.register_namespace("/agent-bridge", agent_logs_namespace)
                logger.info("SUCCESS: Logs namespace setup completed")
            except Exception as e:
                logger.error(f"Failed to setup logs namespace: {e}")

        # TODO: Add other namespaces (metrics, builds, deployments) in future phases

        logger.info(
            f"SUCCESS: Namespace setup completed - {len(agent_registry.get_namespace_paths())} namespaces active"
        )

    async def _start_namespace_streaming(self):
        """Start streaming for all active namespaces"""
        logger.info("Starting namespace streaming...")

        for namespace_path in agent_registry.get_namespace_paths():
            try:
                namespace = agent_registry.get_namespace(namespace_path)
                if namespace and hasattr(namespace, "start_streaming"):
                    await namespace.start_streaming()
                    logger.debug(f"SUCCESS: Started streaming for {namespace_path}")
            except Exception as e:
                logger.error(f"Failed to start streaming for {namespace_path}: {e}")

        logger.info("SUCCESS: Namespace streaming started")

    async def _stop_namespace_streaming(self):
        """Stop streaming for all active namespaces"""
        logger.info("Stopping namespace streaming...")

        for namespace_path in agent_registry.get_namespace_paths():
            try:
                namespace = agent_registry.get_namespace(namespace_path)
                if namespace and hasattr(namespace, "stop_streaming"):
                    await namespace.stop_streaming()
                    logger.debug(f"SUCCESS: Stopped streaming for {namespace_path}")
            except Exception as e:
                logger.error(f"Failed to stop streaming for {namespace_path}: {e}")

        logger.info("SUCCESS: Namespace streaming stopped")

    def _setup_connection_handlers(self):
        """Setup global connection event handlers"""

        async def connection_handler(event_type: str):
            if event_type == "connect":
                logger.info("WebSocket connection established")
                self.is_connected = True
            elif event_type == "disconnect":
                logger.warning("WebSocket connection lost")
                self.is_connected = False

        websocket_manager.add_connection_handler(connection_handler)

    def get_service_status(self) -> Dict[str, Any]:
        """Get WebSocket service status"""
        return {
            "initialized": self.is_initialized,
            "connected": self.is_connected,
            "enabled_features": self.enabled_features,
            "websocket_manager_status": websocket_manager.connection_status,
            "registry_stats": agent_registry.get_stats(),
            "agent_config": agent_auth.get_connection_info(),
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on WebSocket service"""
        status = self.get_service_status()

        # Add health indicators
        status["health"] = {
            "overall": (
                "healthy" if self.is_initialized and self.is_connected else "unhealthy"
            ),
            "websocket_connection": "up" if self.is_connected else "down",
            "namespaces_active": len(
                [ns for ns in agent_registry.get_namespace_paths()]
            ),
            "configuration_valid": agent_auth.validate_connection_config()[0],
        }

        return status


# Global WebSocket service instance
websocket_service = AgentWebSocketService()


# Helper functions for external use
async def initialize_websockets() -> bool:
    """Initialize WebSocket service"""
    return await websocket_service.initialize()


async def connect_websockets() -> bool:
    """Connect to DeployIO Server"""
    return await websocket_service.connect()


async def disconnect_websockets():
    """Disconnect from DeployIO Server"""
    await websocket_service.disconnect()


async def cleanup_websockets():
    """Cleanup WebSocket service"""
    await websocket_service.cleanup()


def get_websocket_status() -> Dict[str, Any]:
    """Get WebSocket service status"""
    return websocket_service.get_service_status()


async def websocket_health_check() -> Dict[str, Any]:
    """Perform WebSocket health check"""
    return await websocket_service.health_check()
