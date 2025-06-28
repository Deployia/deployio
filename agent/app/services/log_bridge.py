"""
Log Bridge Service - WebSocket connection to DeployIO Platform
Real-time log streaming and agent communication
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional
from queue import Queue

import socketio
import docker
import psutil

from app.core.config import settings

logger = logging.getLogger(__name__)


class LogBridgeHandler(logging.Handler):
    """Custom logging handler that captures Python logs and sends them via bridge"""

    def __init__(self, log_bridge):
        super().__init__()
        self.log_bridge = log_bridge
        self.log_queue = Queue()

    def emit(self, record):
        """Called whenever a log message is generated"""
        try:
            # Format the log entry
            log_entry = {
                "source": "application",
                "level": record.levelname.lower(),
                "message": self.format(record),
                "logger_name": record.name,
                "module": getattr(record, "module", "unknown"),
                "function": getattr(record, "funcName", "unknown"),
                "line_number": getattr(record, "lineno", 0),
                "timestamp": datetime.fromtimestamp(record.created).isoformat(),
                "agent_id": self.log_bridge.agent_id if self.log_bridge else "unknown",
            }

            # Queue log for async processing
            if self.log_bridge and self.log_bridge.connected:
                try:
                    loop = asyncio.get_event_loop()
                    loop.create_task(self.log_bridge.queue_log(log_entry))
                except RuntimeError:
                    # If no event loop is running, queue for later
                    self.log_queue.put(log_entry)

        except Exception:
            # Don't let logging errors break the application
            pass

    def flush_queued_logs(self):
        """Flush any queued logs"""
        while not self.log_queue.empty():
            try:
                log_entry = self.log_queue.get_nowait()
                if self.log_bridge and self.log_bridge.connected:
                    loop = asyncio.get_event_loop()
                    loop.create_task(self.log_bridge.queue_log(log_entry))
            except Exception:
                break


class LogBridgeService:
    """WebSocket-based log bridge service for streaming logs to platform"""

    def __init__(self):
        self.sio = None
        self.connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = settings.log_bridge_reconnect_attempts
        self.reconnect_delay = settings.log_bridge_reconnect_delay
        self.last_heartbeat = None
        self.agent_id = settings.agent_id

        # Docker client for container logs
        try:
            self.docker_client = docker.from_env()
        except Exception as e:
            logger.warning(f"Docker client initialization failed: {e}")
            self.docker_client = None

        # Log processing
        self.log_buffer = []
        self.buffer_size = settings.log_bridge_buffer_size
        self.batch_size = settings.log_bridge_batch_size
        self.flush_interval = settings.log_bridge_flush_interval

        # Background tasks
        self.log_processor_task = None
        self.system_monitor_task = None
        self.docker_monitor_task = None
        self.heartbeat_task = None

        # Build WebSocket URL
        self.server_url = self._build_websocket_url()

        # Log handler
        self.log_handler = None

    def _build_websocket_url(self) -> str:
        """Build proper WebSocket URL based on platform URL"""
        platform_url = settings.platform_url

        if platform_url.startswith("https://"):
            ws_url = platform_url.replace("https://", "wss://")
        elif platform_url.startswith("http://"):
            ws_url = platform_url.replace("http://", "ws://")
        else:
            # Assume https in production, http in development
            if settings.environment == "production":
                ws_url = f"wss://{platform_url}"
            else:
                ws_url = f"ws://{platform_url}"

        return f"{ws_url}/agent-bridge"

    async def start(self):
        """Start the log bridge service"""
        logger.info("Initializing Agent Log Bridge")

        try:
            await self._initialize_websocket()
            await self._setup_log_handler()
            logger.info("Log bridge service started successfully")
        except Exception as e:
            logger.error(f"Failed to start log bridge service: {e}")
            # Gracefully degrade: do not raise, just log and continue
            self.connected = False
            logger.warning(
                "Log bridge service could not connect, continuing without log bridge."
            )

    async def stop(self):
        """Stop the log bridge service"""
        logger.info("Stopping log bridge service...")

        try:
            # Stop background tasks
            if self.log_processor_task:
                self.log_processor_task.cancel()
            if self.system_monitor_task:
                self.system_monitor_task.cancel()
            if self.docker_monitor_task:
                self.docker_monitor_task.cancel()
            if self.heartbeat_task:
                self.heartbeat_task.cancel()

            # Remove log handler
            if self.log_handler:
                root_logger = logging.getLogger()
                root_logger.removeHandler(self.log_handler)

            # Disconnect WebSocket
            if self.sio:
                await self.sio.disconnect()

            self.connected = False
            logger.info("Log bridge service stopped successfully")

        except Exception as e:
            logger.error(f"Error stopping log bridge service: {e}")

    async def _initialize_websocket(self):
        """Initialize WebSocket connection"""
        logger.info(f"Connecting to {self.server_url}")

        self.sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=self.max_reconnect_attempts,
            reconnection_delay=self.reconnect_delay,
            logger=False,  # Disable socketio internal logging
            engineio_logger=False,
        )

        # Setup event handlers
        self._setup_websocket_handlers()

        try:
            # Connect with agent headers
            await self.sio.connect(
                self.server_url,
                headers={
                    "x-agent-secret": settings.agent_secret,
                    "x-agent-id": self.agent_id,
                    "x-agent-domain": settings.platform_url,
                },
            )

            self.connected = True
            self.reconnect_attempts = 0
            logger.info("Connected to server log bridge")

            # Send agent identification
            await self._send_agent_identification()

            # Start background tasks
            await self._start_background_tasks()

        except Exception as e:
            logger.error(f"Connection error: {e}")
            self.connected = False
            raise

    def _setup_websocket_handlers(self):
        """Setup WebSocket event handlers"""

        @self.sio.event
        async def connect():
            logger.info("WebSocket connected successfully")

        @self.sio.event
        async def disconnect():
            logger.warning("WebSocket disconnected")
            self.connected = False

        @self.sio.event
        async def connection_ack(data):
            logger.info(f"Connection acknowledged: {data}")

        @self.sio.event
        async def agent_authenticated(data):
            logger.info(f"Agent authenticated: {data}")

        @self.sio.event
        async def heartbeat_request(data):
            await self._handle_heartbeat_request(data)

        @self.sio.event
        async def stream_request(data):
            await self._handle_stream_request(data)

        @self.sio.event
        async def logs_batch_ack(data):
            logger.debug(f"Logs batch acknowledged: {data}")

    async def _send_agent_identification(self):
        """Send agent identification to server"""
        identification_data = {
            "agent_id": self.agent_id,
            "agent_domain": settings.platform_url,
            "capabilities": [
                "log_streaming",
                "system_monitoring",
                "docker_monitoring",
                "heartbeat",
            ],
            "version": settings.version,
            "environment": settings.environment,
        }

        await self.sio.emit("agent:identify", identification_data)
        logger.info("Agent identification sent")

    async def _start_background_tasks(self):
        """Start background monitoring and processing tasks"""
        logger.info("Starting log streaming tasks")

        # Start log processor
        self.log_processor_task = asyncio.create_task(self._log_processor())

        # Start system monitoring
        self.system_monitor_task = asyncio.create_task(self._system_log_monitor())

        # Start Docker monitoring if available
        if self.docker_client:
            self.docker_monitor_task = asyncio.create_task(self._docker_log_monitor())

        # Start heartbeat
        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())

        logger.info("Background tasks started successfully")

    async def _setup_log_handler(self):
        """Setup log handler to capture application logs"""
        self.log_handler = LogBridgeHandler(self)
        self.log_handler.setLevel(logging.INFO)

        # Format logs appropriately
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        self.log_handler.setFormatter(formatter)

        # Add to root logger
        root_logger = logging.getLogger()
        root_logger.addHandler(self.log_handler)

        # Add to specific important loggers
        important_loggers = [
            "uvicorn",
            "uvicorn.access",
            "uvicorn.error",
            "fastapi",
            "__main__",
            "app",
        ]

        for logger_name in important_loggers:
            logger_instance = logging.getLogger(logger_name)
            if self.log_handler not in logger_instance.handlers:
                logger_instance.addHandler(self.log_handler)

        logger.info("Log handler configured for Python logging")

        # Test log to verify it's working
        logger.info("Log bridge integration test - this should appear in admin UI")

    async def queue_log(self, log_entry: Dict[str, Any]):
        """Queue a log entry for batch processing"""
        self.log_buffer.append(log_entry)

        # Send batch if buffer is full
        if len(self.log_buffer) >= self.batch_size:
            await self._send_log_batch()

    async def _send_log_batch(self):
        """Send batch of logs to server"""
        if not self.log_buffer or not self.connected:
            return

        batch = self.log_buffer[: self.batch_size]
        self.log_buffer = self.log_buffer[self.batch_size :]

        try:
            await self.sio.emit(
                "agent:logs_batch",
                {
                    "agent_id": self.agent_id,
                    "logs": batch,
                    "timestamp": datetime.now().isoformat(),
                },
            )
            logger.debug(f"Sent batch of {len(batch)} logs")

        except Exception as e:
            logger.error(f"Failed to send log batch: {e}")
            # Re-queue logs for retry
            self.log_buffer = batch + self.log_buffer

    async def _log_processor(self):
        """Background task to process log buffer"""
        while True:
            try:
                await asyncio.sleep(self.flush_interval)
                if self.log_buffer and self.connected:
                    await self._send_log_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Log processor error: {e}")

    async def _system_log_monitor(self):
        """Monitor system logs"""
        logger.info("Starting system log streaming")

        while True:
            try:
                # Collect system metrics and logs
                system_info = {
                    "source": "system",
                    "level": "info",
                    "message": f"System status - CPU: {psutil.cpu_percent()}%, Memory: {psutil.virtual_memory().percent}%",
                    "timestamp": datetime.now().isoformat(),
                    "agent_id": self.agent_id,
                    "metrics": {
                        "cpu_percent": psutil.cpu_percent(),
                        "memory_percent": psutil.virtual_memory().percent,
                        "disk_percent": psutil.disk_usage("/").percent,
                        "load_avg": (
                            psutil.getloadavg()
                            if hasattr(psutil, "getloadavg")
                            else None
                        ),
                    },
                }

                await self.queue_log(system_info)
                await asyncio.sleep(30)  # Every 30 seconds

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"System monitor error: {e}")
                await asyncio.sleep(60)

    async def _docker_log_monitor(self):
        """Monitor Docker container logs"""
        if not self.docker_client:
            return

        logger.info("Starting Docker log streaming")

        while True:
            try:
                # Monitor containers
                containers = self.docker_client.containers.list()

                for container in containers:
                    try:
                        # Get recent logs
                        logs = container.logs(tail=10, timestamps=True).decode("utf-8")

                        if logs.strip():
                            log_entry = {
                                "source": "docker",
                                "level": "info",
                                "message": f"Container {container.name}: {logs.strip()[-200:]}",  # Last 200 chars
                                "timestamp": datetime.now().isoformat(),
                                "agent_id": self.agent_id,
                                "container_id": container.id,
                                "container_name": container.name,
                                "image": (
                                    container.image.tags[0]
                                    if container.image.tags
                                    else "unknown"
                                ),
                            }

                            await self.queue_log(log_entry)

                    except Exception as e:
                        logger.debug(
                            f"Error reading container {container.name} logs: {e}"
                        )

                await asyncio.sleep(30)  # Every 30 seconds

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Docker monitor error: {e}")
                await asyncio.sleep(60)

    async def _heartbeat_loop(self):
        """Send periodic heartbeat to server"""
        while True:
            try:
                await asyncio.sleep(settings.heartbeat_interval)

                if self.connected:
                    heartbeat_data = {
                        "agent_id": self.agent_id,
                        "timestamp": datetime.now().isoformat(),
                        "status": "healthy",
                        "version": settings.version,
                    }

                    await self.sio.emit("agent:status", heartbeat_data)
                    logger.debug("Heartbeat sent")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")

    async def _handle_heartbeat_request(self, data):
        """Handle heartbeat request from server"""
        response = {
            "agent_id": self.agent_id,
            "timestamp": datetime.now().isoformat(),
            "server_timestamp": data.get("timestamp"),
            "status": "healthy",
        }

        await self.sio.emit("heartbeat_response", response)
        logger.debug("Heartbeat response sent")

    async def _handle_stream_request(self, data):
        """Handle stream request from server"""
        stream_type = data.get("type")
        stream_id = data.get("stream_id")

        logger.info(f"Stream request received: {stream_type} (ID: {stream_id})")

        # Acknowledge stream start
        await self.sio.emit(
            "stream_started",
            {
                "stream_id": stream_id,
                "type": stream_type,
                "agent_id": self.agent_id,
                "status": "active",
            },
        )


# Global service instance
log_bridge_service = LogBridgeService()
