"""
WebSocket Manager for DeployIO Agent
Handles real-time communication with DeployIO Server
"""

import asyncio
import logging
from typing import Dict, Optional, Callable, Any
from contextlib import asynccontextmanager

import socketio
from socketio.exceptions import ConnectionError, TimeoutError

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentWebSocketManager:
    """
    WebSocket Manager for Agent-Server Communication
    Handles authentication, connection management, and namespace routing
    """

    def __init__(self):
        self.client: Optional[socketio.AsyncClient] = None
        self.namespaces: Dict[str, Any] = {}
        self.connection_handlers: list[Callable] = []
        self.is_connected: bool = False
        self.connection_lock = asyncio.Lock()
        self.reconnect_attempts: int = 0
        self.max_reconnect_attempts: int = settings.log_bridge_reconnect_attempts
        self.reconnect_delay: int = settings.log_bridge_reconnect_delay

    async def initialize(self, server_url: str = None) -> bool:
        """
        Initialize WebSocket client with server connection

        Args:
            server_url: Server WebSocket URL (defaults to platform_url)

        Returns:
            bool: Success status
        """
        if not server_url:
            server_url = settings.platform_url

        try:
            # Create Socket.IO client with agent-specific config
            self.client = socketio.AsyncClient(
                reconnection=True,
                reconnection_attempts=self.max_reconnect_attempts,
                reconnection_delay=self.reconnect_delay,
                logger=False,  # Use our own logging
                engineio_logger=False,
            )

            # Setup connection event handlers
            self._setup_connection_handlers()

            logger.info(
                "Agent WebSocket manager initialized",
                {
                    "server_url": server_url,
                    "agent_id": settings.agent_id,
                    "max_reconnect_attempts": self.max_reconnect_attempts,
                },
            )

            return True

        except Exception as e:
            logger.error(f"Failed to initialize WebSocket manager: {e}")
            return False

    async def connect(self, server_url: str = None) -> bool:
        """
        Connect to DeployIO Server with authentication

        Args:
            server_url: Server WebSocket URL

        Returns:
            bool: Connection success status
        """
        async with self.connection_lock:
            if self.is_connected:
                logger.debug("WebSocket already connected")
                return True

            if not self.client:
                await self.initialize(server_url)

            try:
                server_url = server_url or settings.platform_url

                # Prepare authentication headers
                auth_headers = self._get_auth_headers()

                logger.info(
                    "Connecting to DeployIO Server...",
                    {"server_url": server_url, "agent_id": settings.agent_id},
                )

                # Connect to agent-bridge namespace with authentication
                agent_bridge_url = f"{server_url}/agent-bridge"
                await self.client.connect(
                    agent_bridge_url,
                    headers=auth_headers,
                    transports=["websocket", "polling"],
                )

                self.is_connected = True
                self.reconnect_attempts = 0

                logger.info(
                    "SUCCESS: Connected to DeployIO Server",
                    {"agent_id": settings.agent_id, "connection_id": self.client.sid},
                )

                # Initialize all registered namespaces
                await self._initialize_namespaces()

                return True

            except (ConnectionError, TimeoutError) as e:
                logger.error(f"WebSocket connection failed: {e}")
                self.is_connected = False
                return False
            except Exception as e:
                logger.error(f"Unexpected WebSocket connection error: {e}")
                self.is_connected = False
                return False

    async def disconnect(self):
        """Gracefully disconnect from server"""
        async with self.connection_lock:
            if self.client and self.is_connected:
                try:
                    logger.info("Disconnecting from DeployIO Server...")
                    await self.client.disconnect()
                    self.is_connected = False
                    logger.info("SUCCESS: Disconnected from DeployIO Server")
                except Exception as e:
                    logger.error(f"Error during disconnect: {e}")

    def register_namespace(self, namespace_path: str, namespace_instance):
        """
        Register a namespace with the WebSocket manager

        Args:
            namespace_path: Namespace path (e.g., '/agent-logs')
            namespace_instance: Namespace class instance
        """
        self.namespaces[namespace_path] = namespace_instance
        logger.debug(f"Registered namespace: {namespace_path}")

    async def emit_to_namespace(
        self, namespace: str, event: str, data: Any, room: str = None
    ):
        """
        Emit event to specific namespace and room

        Args:
            namespace: Namespace path (for routing purposes)
            event: Event name
            data: Event data
            room: Room name (optional)
        """
        if not self.is_connected or not self.client:
            logger.warning(f"Cannot emit to {namespace} - not connected")
            return False

        try:
            # Include room information in data payload if specified
            emission_data = data
            if room:
                if isinstance(data, dict):
                    emission_data = {**data, "room": room}
                else:
                    emission_data = {"data": data, "room": room}

            # Since we're connected to /agent-bridge, emit directly without namespace parameter
            await self.client.emit(event, emission_data)
            return True
        except Exception as e:
            logger.error(f"Failed to emit to {namespace}: {e}")
            return False

    def _get_auth_headers(self) -> Dict[str, str]:
        """Generate authentication headers for server connection"""
        return {
            "x-agent-secret": settings.agent_secret,
            "x-agent-id": settings.agent_id,
            "x-platform-domain": settings.platform_url,
            "user-agent": f"DeployIO-Agent/{settings.version}",
            "authorization": f"Bearer {settings.platform_api_key or settings.agent_secret}",
        }

    def _setup_connection_handlers(self):
        """Setup global connection event handlers"""

        @self.client.event
        async def connect():
            logger.info("WebSocket connected to server")
            self.is_connected = True

            # Notify all connection handlers
            for handler in self.connection_handlers:
                try:
                    await handler("connect")
                except Exception as e:
                    logger.error(f"Connection handler error: {e}")

        @self.client.event
        async def disconnect():
            logger.warning("WebSocket disconnected from server")
            self.is_connected = False

            # Notify all connection handlers
            for handler in self.connection_handlers:
                try:
                    await handler("disconnect")
                except Exception as e:
                    logger.error(f"Disconnection handler error: {e}")

        @self.client.event
        async def connect_error(data):
            logger.error(f"WebSocket connection error: {data}")
            self.is_connected = False

        @self.client.event
        async def reconnect():
            logger.info("WebSocket reconnected to server")
            self.is_connected = True

    async def _initialize_namespaces(self):
        """Initialize all registered namespaces after connection"""
        for namespace_path, namespace_instance in self.namespaces.items():
            try:
                # Initialize the namespace instance
                if hasattr(namespace_instance, "on_connected"):
                    await namespace_instance.on_connected()
                logger.debug(f"SUCCESS: Initialized namespace: {namespace_path}")
            except Exception as e:
                logger.error(f"Failed to initialize namespace {namespace_path}: {e}")

    def add_connection_handler(self, handler: Callable):
        """Add global connection event handler"""
        self.connection_handlers.append(handler)

    @property
    def connection_status(self) -> Dict[str, Any]:
        """Get current connection status"""
        return {
            "connected": self.is_connected,
            "connection_id": (
                self.client.sid if self.client and self.is_connected else None
            ),
            "namespaces": list(self.namespaces.keys()),
            "reconnect_attempts": self.reconnect_attempts,
            "agent_id": settings.agent_id,
        }


# Global WebSocket manager instance
websocket_manager = AgentWebSocketManager()


@asynccontextmanager
async def websocket_lifespan():
    """Context manager for WebSocket lifecycle"""
    try:
        # Startup
        await websocket_manager.initialize()
        if settings.log_bridge_enabled:
            await websocket_manager.connect()
        yield websocket_manager
    finally:
        # Shutdown
        await websocket_manager.disconnect()
