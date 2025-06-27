"""
Agent-Side WebSocket Log Bridge
Real-time log streaming from agent to central server
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any
from queue import Queue

import socketio
import docker
import psutil
from fastapi import APIRouter
from config.settings import settings

logger = logging.getLogger(__name__)


class LogBridgeHandler(logging.Handler):
    """
    Custom logging handler that captures Python logs and sends them to the bridge
    """

    def __init__(self, log_bridge):
        super().__init__()
        self.log_bridge = log_bridge
        self.log_queue = Queue()
        self._background_task = None

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

            # Add to queue for async processing
            if self.log_bridge and self.log_bridge.connected:
                # Create the async task in the event loop
                import asyncio

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
        import asyncio

        while not self.log_queue.empty():
            try:
                log_entry = self.log_queue.get_nowait()
                if self.log_bridge and self.log_bridge.connected:
                    loop = asyncio.get_event_loop()
                    loop.create_task(self.log_bridge.queue_log(log_entry))
            except Exception:
                break


class AgentLogBridge:
    """
    WebSocket-based log bridge for streaming logs from agent to server
    """

    def __init__(self):
        self.sio = None
        self.connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = settings.log_bridge_reconnect_attempts
        self.reconnect_delay = settings.log_bridge_reconnect_delay
        self.last_heartbeat = None

        # Log sources
        self.docker_client = None
        self.active_streams = set()
        self.log_buffer = []
        self.buffer_size = settings.log_bridge_buffer_size

        # Configuration
        self.server_url = settings.platform_url.replace("https://", "wss://").replace(
            "http://", "ws://"
        )
        self.agent_secret = settings.agent_secret
        self.agent_id = settings.agent_id

        # Streaming configuration
        self.streaming_config = {
            "docker": True,
            "system": True,
            "deployments": True,
            "traefik": True,
            "batch_size": settings.log_bridge_batch_size,
            "flush_interval": settings.log_bridge_flush_interval,
        }

    async def initialize(self):
        """Initialize the log bridge"""
        logger.info("Initializing Agent Log Bridge")

        try:
            # Initialize Docker client
            self.docker_client = docker.from_env()

            # Initialize SocketIO client
            self.sio = socketio.AsyncClient(
                reconnection=True,
                reconnection_attempts=self.max_reconnect_attempts,
                reconnection_delay=self.reconnect_delay,
                logger=False,  # Disable socketio logging to prevent noise
                engineio_logger=False,
            )

            # Setup event handlers
            self.setup_event_handlers()

            # Connect to server
            await self.connect()

            # Start log streaming tasks
            if self.connected:
                await self.start_log_streaming()

        except Exception as e:
            logger.error(f"Failed to initialize Agent Log Bridge: {e}")
            raise

    def setup_event_handlers(self):
        """Setup SocketIO event handlers"""

        @self.sio.event
        async def connect():
            self.connected = True
            self.reconnect_attempts = 0
            self.last_heartbeat = time.time()

            logger.info("Connected to server log bridge")

            # Authenticate and identify agent
            await self.sio.emit(
                "agent:identify",
                {
                    "agent_id": self.agent_id,
                    "agent_secret": self.agent_secret,
                    "agent_domain": "agent.deployio.tech",
                    "capabilities": list(self.streaming_config.keys()),
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

            # Flush any queued logs from the Python handler
            self._flush_python_logs()

        @self.sio.event
        async def disconnect():
            self.connected = False
            logger.warning("Disconnected from server log bridge")

        @self.sio.event
        async def connect_error(data):
            logger.error(f"Connection error: {data}")
            self.connected = False

        @self.sio.event
        async def agent_authenticated(data):
            if data.get("success"):
                logger.info("Agent authenticated successfully")
                await self.send_agent_status()
            else:
                logger.error(f"Agent authentication failed: {data.get('message')}")

        @self.sio.event
        async def stream_request(data):
            """Handle log streaming requests from server"""
            stream_type = data.get("type")
            stream_id = data.get("stream_id")

            logger.info(f"Received stream request: {stream_type} (ID: {stream_id})")

            if (
                stream_type in self.streaming_config
                and self.streaming_config[stream_type]
            ):
                await self.start_specific_stream(
                    stream_type, stream_id, data.get("params", {})
                )
            else:
                await self.sio.emit(
                    "stream_error",
                    {
                        "stream_id": stream_id,
                        "error": f"Stream type {stream_type} not supported or disabled",
                    },
                )

        @self.sio.event
        async def stream_stop(data):
            """Handle stop streaming requests"""
            stream_id = data.get("stream_id")
            await self.stop_specific_stream(stream_id)

        @self.sio.event
        async def heartbeat_request():
            """Respond to heartbeat requests"""
            await self.sio.emit(
                "heartbeat_response",
                {
                    "timestamp": time.time(),
                    "agent_id": self.agent_id,
                    "status": "healthy",
                },
            )

    async def connect(self):
        """Connect to the server"""
        try:
            namespace_url = f"{self.server_url}/agent-bridge"
            logger.info(f"Connecting to {namespace_url}")

            await self.sio.connect(
                namespace_url,
                headers={
                    "X-Agent-Secret": self.agent_secret,
                    "X-Agent-ID": self.agent_id,
                    "X-Agent-Domain": "agent.deployio.tech",
                },
                wait_timeout=10,
            )

        except Exception as e:
            logger.error(f"Failed to connect to server: {e}")
            self.connected = False
            raise

    async def send_agent_status(self):
        """Send agent status to server"""
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")

            # Get Docker info
            docker_info = {}
            if self.docker_client:
                try:
                    containers = self.docker_client.containers.list(all=True)
                    docker_info = {
                        "total_containers": len(containers),
                        "running_containers": len(
                            [c for c in containers if c.status == "running"]
                        ),
                        "engine_version": self.docker_client.version().get(
                            "Version", "unknown"
                        ),
                    }
                except Exception:
                    docker_info = {"error": "Unable to get Docker info"}

            status_data = {
                "agent_id": self.agent_id,
                "timestamp": datetime.utcnow().isoformat(),
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "disk_percent": (disk.used / disk.total) * 100,
                    "uptime": time.time() - psutil.boot_time(),
                },
                "docker": docker_info,
                "streaming": {
                    "active_streams": len(self.active_streams),
                    "buffer_size": len(self.log_buffer),
                    "capabilities": self.streaming_config,
                },
            }

            await self.sio.emit("agent:status", status_data)

        except Exception as e:
            logger.error(f"Failed to send agent status: {e}")

    async def start_log_streaming(self):
        """Start background log streaming tasks"""
        logger.info("Starting log streaming tasks")

        # Start system log streaming
        if self.streaming_config.get("system"):
            asyncio.create_task(self.stream_system_logs())

        # Start Docker log streaming
        if self.streaming_config.get("docker"):
            asyncio.create_task(self.stream_docker_logs())

        # Start log buffer flushing
        asyncio.create_task(self.flush_log_buffer())

        # Start periodic status updates
        asyncio.create_task(self.periodic_status_updates())

    async def stream_system_logs(self):
        """Stream system logs (journalctl, syslog)"""
        logger.info("Starting system log streaming")

        try:
            import subprocess

            # Use journalctl to stream system logs
            proc = subprocess.Popen(
                ["journalctl", "-f", "--output=json", "--no-tail"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True,
            )

            while self.connected:
                line = proc.stdout.readline()
                if line:
                    try:
                        log_entry = json.loads(line.strip())

                        # Format log entry
                        formatted_log = {
                            "source": "system",
                            "timestamp": log_entry.get(
                                "__REALTIME_TIMESTAMP", time.time() * 1000000
                            ),
                            "level": log_entry.get("PRIORITY", "6"),
                            "service": log_entry.get("_SYSTEMD_UNIT", "unknown"),
                            "message": log_entry.get("MESSAGE", ""),
                            "host": log_entry.get("_HOSTNAME", self.agent_id),
                            "agent_id": self.agent_id,
                        }

                        await self.queue_log(formatted_log)

                    except json.JSONDecodeError:
                        continue

                await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"System log streaming error: {e}")

    async def stream_docker_logs(self):
        """Stream Docker container logs"""
        logger.info("Starting Docker log streaming")

        try:
            while self.connected:
                containers = self.docker_client.containers.list()

                for container in containers:
                    try:
                        # Get recent logs (last 10 lines)
                        logs = container.logs(tail=10, timestamps=True, stream=False)

                        for log_line in logs.decode("utf-8").split("\n"):
                            if log_line.strip():
                                # Parse timestamp and message
                                parts = log_line.split(" ", 1)
                                if len(parts) == 2:
                                    timestamp_str, message = parts

                                    formatted_log = {
                                        "source": "docker",
                                        "container_id": container.id[:12],
                                        "container_name": container.name,
                                        "image": (
                                            container.image.tags[0]
                                            if container.image.tags
                                            else "unknown"
                                        ),
                                        "timestamp": timestamp_str,
                                        "message": message,
                                        "agent_id": self.agent_id,
                                    }

                                    await self.queue_log(formatted_log)

                    except Exception as e:
                        logger.debug(
                            f"Error getting logs for container {container.name}: {e}"
                        )

                await asyncio.sleep(30)  # Check every 30 seconds

        except Exception as e:
            logger.error(f"Docker log streaming error: {e}")

    async def queue_log(self, log_entry: Dict[str, Any]):
        """Queue log entry for batch sending"""
        self.log_buffer.append(log_entry)

        # If buffer is full, flush immediately
        if len(self.log_buffer) >= self.buffer_size:
            await self.flush_log_buffer_now()

    async def flush_log_buffer(self):
        """Periodically flush the log buffer"""
        while self.connected:
            await asyncio.sleep(self.streaming_config["flush_interval"])
            if self.log_buffer:
                await self.flush_log_buffer_now()

    async def flush_log_buffer_now(self):
        """Flush the log buffer immediately"""
        if not self.log_buffer or not self.connected:
            return

        try:
            # Get batch of logs
            batch_size = self.streaming_config["batch_size"]
            batch = self.log_buffer[:batch_size]
            self.log_buffer = self.log_buffer[batch_size:]

            # Send to server
            await self.sio.emit(
                "agent:logs_batch",
                {
                    "agent_id": self.agent_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "logs": batch,
                    "batch_size": len(batch),
                },
            )

        except Exception as e:
            logger.error(f"Failed to flush log buffer: {e}")

    async def periodic_status_updates(self):
        """Send periodic status updates"""
        while self.connected:
            await asyncio.sleep(30)  # Every 30 seconds
            await self.send_agent_status()

    async def start_specific_stream(
        self, stream_type: str, stream_id: str, params: Dict[str, Any]
    ):
        """Start a specific log stream"""
        logger.info(f"Starting {stream_type} stream (ID: {stream_id})")

        self.active_streams.add(stream_id)

        # Send confirmation
        await self.sio.emit(
            "stream_started",
            {
                "stream_id": stream_id,
                "type": stream_type,
                "agent_id": self.agent_id,
                "params": params,
            },
        )

    async def stop_specific_stream(self, stream_id: str):
        """Stop a specific log stream"""
        logger.info(f"Stopping stream (ID: {stream_id})")

        self.active_streams.discard(stream_id)

        # Send confirmation
        await self.sio.emit(
            "stream_stopped", {"stream_id": stream_id, "agent_id": self.agent_id}
        )

    async def disconnect(self):
        """Disconnect from server"""
        if self.sio and self.connected:
            await self.sio.disconnect()
        self.connected = False

    def _flush_python_logs(self):
        """Flush any queued Python logs from the LogBridgeHandler"""
        # Find any LogBridgeHandler instances and flush their queues
        root_logger = logging.getLogger()
        for handler in root_logger.handlers:
            if isinstance(handler, LogBridgeHandler):
                handler.flush_queued_logs()

        # Also check other common loggers
        for logger_name in ["uvicorn", "fastapi", "__main__"]:
            logger_instance = logging.getLogger(logger_name)
            for handler in logger_instance.handlers:
                if isinstance(handler, LogBridgeHandler):
                    handler.flush_queued_logs()


# Global instance
agent_log_bridge = AgentLogBridge()


# FastAPI router for log bridge management
router = APIRouter(prefix="/log-bridge", tags=["log-bridge"])


@router.post("/start")
async def start_log_bridge():
    """Start the log bridge connection"""
    try:
        if not agent_log_bridge.connected:
            await agent_log_bridge.initialize()
            return {"success": True, "message": "Log bridge started successfully"}
        else:
            return {"success": True, "message": "Log bridge already running"}
    except Exception as e:
        logger.error(f"Failed to start log bridge: {e}")
        return {"success": False, "error": str(e)}


@router.post("/stop")
async def stop_log_bridge():
    """Stop the log bridge connection"""
    try:
        await agent_log_bridge.disconnect()
        return {"success": True, "message": "Log bridge stopped"}
    except Exception as e:
        logger.error(f"Failed to stop log bridge: {e}")
        return {"success": False, "error": str(e)}


@router.get("/status")
async def get_log_bridge_status():
    """Get log bridge status"""
    return {
        "connected": agent_log_bridge.connected,
        "server_url": agent_log_bridge.server_url,
        "agent_id": agent_log_bridge.agent_id,
        "active_streams": len(agent_log_bridge.active_streams),
        "buffer_size": len(agent_log_bridge.log_buffer),
        "last_heartbeat": agent_log_bridge.last_heartbeat,
        "streaming_config": agent_log_bridge.streaming_config,
    }
