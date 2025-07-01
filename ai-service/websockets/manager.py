"""
WebSocket Manager for AI Service
Handles communication with DeployIO Server using clean namespace architecture
"""

import asyncio
import logging
from typing import Dict, Any, Optional

import socketio

from .core.registry import ai_websocket_registry
from .namespaces.analysis_namespace import AnalysisNamespace
from .namespaces.generation_namespace import GenerationNamespace

logger = logging.getLogger(__name__)


class AIWebSocketManager:
    """
    WebSocket Manager for AI Service-Server Communication
    Manages connection to server and namespace routing
    """

    def __init__(self):
        self.client: Optional[socketio.AsyncClient] = None
        self.is_connected: bool = False
        self.connection_lock = asyncio.Lock()
        self.reconnect_attempts: int = 0
        self.max_reconnect_attempts: int = 5
        self.reconnect_delay: int = 5
        self.server_url: Optional[str] = None

    async def initialize(self, server_url: str = None) -> bool:
        """
        Initialize WebSocket client and namespaces

        Args:
            server_url: Server WebSocket URL

        Returns:
            bool: Success status
        """
        if not server_url:
            from config.settings import settings

            server_url = settings.server_websocket_url

        self.server_url = server_url

        try:
            # Initialize WebSocket client
            await self._initialize_client()

            # Initialize registry
            ai_websocket_registry.initialize(self)

            # Initialize namespaces
            await self._initialize_namespaces()

            logger.info("AI WebSocket manager initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize AI WebSocket manager: {e}")
            return False

    async def _initialize_client(self):
        """Initialize the SocketIO client"""
        self.client = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=self.max_reconnect_attempts,
            reconnection_delay=self.reconnect_delay,
            logger=False,
            engineio_logger=False,
        )

        # Setup global event handlers
        self._setup_client_handlers()

        # Connect to server
        await self.client.connect(
            self.server_url,
            namespaces=["/ai-service"],
            headers={"X-Service-Type": "ai-service", "X-Service-Version": "1.0.0"},
        )

    def _setup_client_handlers(self):
        """Setup global client event handlers"""

        @self.client.event(namespace="/ai-service")
        async def connect():
            logger.info("AI Service connected to server WebSocket")
            self.is_connected = True
            self.reconnect_attempts = 0

        @self.client.event(namespace="/ai-service")
        async def disconnect():
            logger.warning("AI Service disconnected from server WebSocket")
            self.is_connected = False

        @self.client.event(namespace="/ai-service")
        async def analysis_request(data):
            """Handle analysis request from server"""
            try:
                session_id = data.get("session_id")
                logger.info(f"Received analysis request for session: {session_id}")

                analysis_namespace = ai_websocket_registry.get_namespace("/analysis")
                if analysis_namespace:
                    asyncio.create_task(
                        analysis_namespace.handle_analysis_request(data)
                    )
                else:
                    logger.error("Analysis namespace not found")

            except Exception as e:
                logger.error(f"Error handling analysis request: {e}")

        @self.client.event(namespace="/ai-service")
        async def generation_request(data):
            """Handle generation request from server"""
            try:
                session_id = data.get("session_id")
                logger.info(f"Received generation request for session: {session_id}")

                generation_namespace = ai_websocket_registry.get_namespace(
                    "/generation"
                )
                if generation_namespace:
                    asyncio.create_task(
                        generation_namespace.handle_generation_request(data)
                    )
                else:
                    logger.error("Generation namespace not found")

            except Exception as e:
                logger.error(f"Error handling generation request: {e}")

        @self.client.event(namespace="/ai-service")
        async def individual_generation_request(data):
            """Handle individual config generation request"""
            try:
                session_id = data.get("session_id")
                config_type = data.get("config_type")
                logger.info(
                    f"Received {config_type} generation request for session: {session_id}"
                )

                generation_namespace = ai_websocket_registry.get_namespace(
                    "/generation"
                )
                if generation_namespace:
                    asyncio.create_task(
                        generation_namespace.handle_individual_generation(
                            data, config_type
                        )
                    )
                else:
                    logger.error("Generation namespace not found")

            except Exception as e:
                logger.error(f"Error handling individual generation request: {e}")

    async def _initialize_namespaces(self):
        """Initialize and register namespaces"""

        # Initialize analysis namespace
        analysis_ns = AnalysisNamespace()
        await analysis_ns.initialize(self)
        ai_websocket_registry.register("/analysis", analysis_ns)

        # Initialize generation namespace
        generation_ns = GenerationNamespace()
        await generation_ns.initialize(self)
        ai_websocket_registry.register("/generation", generation_ns)

        logger.info("All AI namespaces initialized")

    async def emit_to_server(self, event: str, data: Dict[str, Any]):
        """
        Emit event to server

        Args:
            event: Event name
            data: Event data
        """
        if not self.is_connected or not self.client:
            logger.warning(f"Cannot emit {event} - not connected to server")
            return

        try:
            await self.client.emit(event, data, namespace="/ai-service")
        except Exception as e:
            logger.error(f"Failed to emit {event} to server: {e}")

    async def disconnect(self):
        """Disconnect from server"""
        if self.client and self.is_connected:
            # Cleanup namespaces
            for namespace in ai_websocket_registry.get_all_namespaces().values():
                if hasattr(namespace, "cleanup"):
                    await namespace.cleanup()

            await self.client.disconnect()
            self.is_connected = False
            logger.info("AI WebSocket manager disconnected from server")

    def get_connection_status(self) -> Dict[str, Any]:
        """Get connection status and statistics"""
        registry_stats = ai_websocket_registry.get_stats()

        return {
            "connected": self.is_connected,
            "server_url": self.server_url,
            "reconnect_attempts": self.reconnect_attempts,
            "namespaces": registry_stats["namespaces"],
            "total_namespaces": registry_stats["total_namespaces"],
        }


# Global manager instance
ai_websocket_manager = AIWebSocketManager()
