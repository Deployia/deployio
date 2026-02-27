"""
WebSocket Manager for DeployIO Agent
Handles real-time communication with DeployIO Server
"""

import asyncio
import logging
from typing import Dict, Optional, Callable, Any
from contextlib import asynccontextmanager
from datetime import datetime

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
        self.bridge_client: Optional[socketio.AsyncClient] = (
            None  # Dedicated bridge client
        )
        self.namespaces: Dict[str, Any] = {}
        self.connection_handlers: list[Callable] = []
        self.is_connected: bool = False
        self.bridge_connected: bool = False
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
            # Create main Socket.IO client
            self.client = socketio.AsyncClient(
                reconnection=True,
                reconnection_attempts=self.max_reconnect_attempts,
                reconnection_delay=self.reconnect_delay,
                logger=False,  # Use our own logging
                engineio_logger=False,
            )

            # Create dedicated bridge client for /agent-bridge namespace
            self.bridge_client = socketio.AsyncClient(
                reconnection=True,
                reconnection_attempts=self.max_reconnect_attempts,
                reconnection_delay=self.reconnect_delay,
                logger=False,
                engineio_logger=False,
            )

            # Setup connection event handlers for both clients
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
            if self.bridge_connected:
                logger.debug("Bridge WebSocket already connected")
                return True

            if not self.bridge_client:
                await self.initialize(server_url)

            try:
                server_url = server_url or settings.platform_url

                # Prepare authentication headers
                auth_headers = self._get_auth_headers()

                logger.info(
                    "Connecting to DeployIO Server agent-bridge namespace...",
                    {"server_url": server_url, "agent_id": settings.agent_id},
                )

                # Connect to the agent-bridge namespace
                # In Python Socket.IO, we connect to the base URL and then join the namespace
                await self.bridge_client.connect(
                    server_url,
                    headers=auth_headers,
                    transports=["websocket", "polling"],
                    namespaces=["/agent-bridge"],  # Specify namespace to connect to
                )

                self.bridge_connected = True
                self.is_connected = True  # Keep backward compatibility
                self.reconnect_attempts = 0

                logger.info(
                    "SUCCESS: Connected to DeployIO Server Bridge",
                    {
                        "agent_id": settings.agent_id,
                        "connection_id": self.bridge_client.sid,
                    },
                )

                # Initialize all registered namespaces
                await self._initialize_namespaces()

                return True

            except (ConnectionError, TimeoutError) as e:
                logger.error(f"Bridge WebSocket connection failed: {e}")
                self.bridge_connected = False
                self.is_connected = False
                return False
            except Exception as e:
                logger.error(f"Unexpected bridge WebSocket connection error: {e}")
                self.bridge_connected = False
                self.is_connected = False
                return False

    async def disconnect(self):
        """Gracefully disconnect from server"""
        async with self.connection_lock:
            if self.bridge_client and self.bridge_connected:
                try:
                    logger.info("Disconnecting from DeployIO Server Bridge...")
                    await self.bridge_client.disconnect()
                    self.bridge_connected = False
                    self.is_connected = False
                    logger.info("SUCCESS: Disconnected from DeployIO Server Bridge")
                except Exception as e:
                    logger.error(f"Error during bridge disconnect: {e}")

            if self.client and self.is_connected:
                try:
                    logger.info("Disconnecting from DeployIO Server...")
                    await self.client.disconnect()
                    self.is_connected = False
                    logger.info("SUCCESS: Disconnected from DeployIO Server")
                except Exception as e:
                    logger.error(f"Error during main disconnect: {e}")

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
        if not self.bridge_connected or not self.bridge_client:
            logger.warning(f"Cannot emit to {namespace} - bridge not connected")
            return False

        try:
            # Include room information in data payload if specified
            emission_data = data
            if room:
                if isinstance(data, dict):
                    emission_data = {**data, "room": room}
                else:
                    emission_data = {"data": data, "room": room}

            # Emit to the bridge namespace
            await self.bridge_client.emit(
                event, emission_data, namespace="/agent-bridge"
            )
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
        """Setup connection event handlers for bridge namespace"""

        # Bridge connection events for /agent-bridge namespace
        @self.bridge_client.event(namespace="/agent-bridge")
        async def connect():
            logger.info(
                "WebSocket connected to agent-bridge namespace - initiating handshake...",
                {"agent_id": settings.agent_id, "platform_url": settings.platform_url},
            )
            self.bridge_connected = True
            self.is_connected = True

            # Send initial handshake with connection verification
            await self._perform_connection_handshake()

            # Notify all connection handlers
            for handler in self.connection_handlers:
                try:
                    await handler("connect")
                except Exception as e:
                    logger.error(f"Connection handler error: {e}")

        @self.bridge_client.event(namespace="/agent-bridge")
        async def disconnect():
            logger.warning(
                "WebSocket disconnected from agent-bridge namespace",
                {"agent_id": settings.agent_id, "was_connected": self.bridge_connected},
            )
            self.bridge_connected = False
            self.is_connected = False

            # Notify all connection handlers
            for handler in self.connection_handlers:
                try:
                    await handler("disconnect")
                except Exception as e:
                    logger.error(f"Disconnection handler error: {e}")

        @self.bridge_client.event(namespace="/agent-bridge")
        async def connect_error(data):
            logger.error(
                "WebSocket connection error on agent-bridge namespace",
                {"error": str(data), "agent_id": settings.agent_id},
            )
            self.bridge_connected = False
            self.is_connected = False

        @self.bridge_client.event(namespace="/agent-bridge")
        async def reconnect():
            logger.info(
                "WebSocket reconnected to agent-bridge namespace",
                {"agent_id": settings.agent_id, "attempt": self.reconnect_attempts},
            )
            self.bridge_connected = True
            self.is_connected = True

        # Agent bridge specific events
        @self.bridge_client.event(namespace="/agent-bridge")
        async def connection_established(data):
            """Handle successful bridge connection establishment"""
            logger.info(
                "Bridge connection established successfully",
                {
                    "agent_id": data.get("agentId"),
                    "server_time": data.get("serverTime"),
                    "available_namespaces": data.get("availableNamespaces", []),
                    "connection_confirmed": True,
                },
            )

            # Send ACK back to server
            await self.bridge_client.emit(
                "connection_ack",
                {
                    "agent_id": settings.agent_id,
                    "client_time": datetime.now().isoformat(),
                    "status": "ready",
                    "message": "Agent bridge connection confirmed",
                },
                namespace="/agent-bridge",
            )

        @self.bridge_client.event(namespace="/agent-bridge")
        async def authentication_failed(data):
            """Handle authentication failure"""
            logger.error(
                "Authentication failed",
                {"message": data.get("message"), "agent_id": settings.agent_id},
            )
            self.bridge_connected = False
            self.is_connected = False

        @self.bridge_client.event(namespace="/agent-bridge")
        async def bridge_ping(data):
            """Handle bridge health ping from server"""
            logger.debug("Received bridge ping, sending pong")
            await self.bridge_client.emit(
                "bridge_pong",
                {
                    "agent_id": settings.agent_id,
                    "timestamp": datetime.now().isoformat(),
                    "ping_id": data.get("ping_id"),
                },
                namespace="/agent-bridge",
            )

        # Bridge handshake response from server
        @self.bridge_client.event(namespace="/agent-bridge")
        async def bridge_handshake_ack(data):
            """Handle handshake acknowledgment from server"""
            logger.info(
                "Received bridge handshake ACK from server",
                {
                    "handshake_id": data.get("handshakeId"),
                    "server_time": data.get("serverTime"),
                    "status": data.get("status"),
                    "bridge_ready": data.get("bridgeReady"),
                },
            )

        # Add event handlers for server requests
        @self.bridge_client.event(namespace="/agent-bridge")
        async def request_logs(data):
            """Handle log requests from server"""
            logger.info(f"Received log request from server: {data}")

            # Forward to the appropriate namespace
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("request_logs", data)
                    except Exception as e:
                        logger.error(
                            f"Error handling request_logs in {namespace_path}: {e}"
                        )

        @self.bridge_client.event(namespace="/agent-bridge")
        async def start_log_stream(data):
            """Handle start log stream requests from server"""
            logger.info(f"Received start log stream request: {data}")

            # Forward to the appropriate namespace
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("start_log_stream", data)
                    except Exception as e:
                        logger.error(
                            f"Error handling start_log_stream in {namespace_path}: {e}"
                        )

        @self.bridge_client.event(namespace="/agent-bridge")
        async def stop_log_stream(data):
            """Handle stop log stream requests from server"""
            logger.info(f"Received stop log stream request: {data}")

            # Forward to the appropriate namespace
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("stop_log_stream", data)
                    except Exception as e:
                        logger.error(
                            f"Error handling stop_log_stream in {namespace_path}: {e}"
                        )

        # ── Deployment events (server → agent) ──────────────────────────

        @self.bridge_client.event(namespace="/agent-bridge")
        async def deployment_trigger(data):
            """Handle deployment:trigger from server — start a deployment."""
            logger.info(f"Received deployment:trigger: {data.get('deploymentId')}")
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("deployment:trigger", data)
                    except Exception as e:
                        logger.error(f"Error handling deployment:trigger in {namespace_path}: {e}")

        @self.bridge_client.event(namespace="/agent-bridge")
        async def deployment_stop(data):
            """Handle deployment:stop from server — stop a container."""
            logger.info(f"Received deployment:stop: {data.get('deploymentId')}")
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("deployment:stop", data)
                    except Exception as e:
                        logger.error(f"Error handling deployment:stop in {namespace_path}: {e}")

        @self.bridge_client.event(namespace="/agent-bridge")
        async def deployment_restart(data):
            """Handle deployment:restart from server — restart a container."""
            logger.info(f"Received deployment:restart: {data.get('deploymentId')}")
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("deployment:restart", data)
                    except Exception as e:
                        logger.error(f"Error handling deployment:restart in {namespace_path}: {e}")

        @self.bridge_client.event(namespace="/agent-bridge")
        async def deployment_status_request(data):
            """Handle deployment:status_request from server."""
            logger.info(f"Received deployment:status_request: {data.get('deploymentId')}")
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("deployment:status_request", data)
                    except Exception as e:
                        logger.error(f"Error handling deployment:status_request in {namespace_path}: {e}")

        @self.bridge_client.event(namespace="/agent-bridge")
        async def deployment_logs_request(data):
            """Handle deployment:logs_request from server."""
            logger.info(f"Received deployment:logs_request: {data.get('deploymentId')}")
            for namespace_path, namespace_instance in self.namespaces.items():
                if hasattr(namespace_instance, "handle_event"):
                    try:
                        await namespace_instance.handle_event("deployment:logs_request", data)
                    except Exception as e:
                        logger.error(f"Error handling deployment:logs_request in {namespace_path}: {e}")

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
            "bridge_connected": self.bridge_connected,
            "connection_id": (
                self.bridge_client.sid
                if self.bridge_client and self.bridge_connected
                else None
            ),
            "namespaces": list(self.namespaces.keys()),
            "reconnect_attempts": self.reconnect_attempts,
            "agent_id": settings.agent_id,
        }

    async def _perform_connection_handshake(self):
        """
        Perform initial handshake with server to verify bridge connection
        Sends connection details and waits for server acknowledgment
        """
        try:
            handshake_data = {
                "agent_id": settings.agent_id,
                "agent_version": settings.version,
                "platform_url": settings.platform_url,
                "connection_time": datetime.now().isoformat(),
                "capabilities": {
                    "logs": True,
                    "metrics": False,  # TODO: Enable when implemented
                    "builds": False,  # TODO: Enable when implemented
                    "deployments": True,
                },
                "connection_type": "bridge_establishment",
                "handshake_id": f"handshake_{int(datetime.now().timestamp())}",
            }

            logger.info(
                "Sending connection handshake to server",
                {
                    "agent_id": settings.agent_id,
                    "handshake_id": handshake_data["handshake_id"],
                    "capabilities": handshake_data["capabilities"],
                },
            )

            # Send handshake data to server on agent-bridge namespace
            await self.bridge_client.emit(
                "bridge_handshake", handshake_data, namespace="/agent-bridge"
            )

        except Exception as e:
            logger.error(
                "Failed to perform connection handshake",
                {"error": str(e), "agent_id": settings.agent_id},
            )


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
