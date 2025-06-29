"""
Agent Logs Namespace
Handles system logs and Docker container logs streaming to server
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.websockets.namespaces.base import BaseAgentNamespace
from app.core.config import settings
from app.services.log_collector import log_collector_service

logger = logging.getLogger(__name__)


class AgentLogsNamespace(BaseAgentNamespace):
    """
    Agent Logs Namespace - connects to /agent-bridge
    Streams system logs and Docker container logs to DeployIO Server
    """

    def __init__(self):
        super().__init__(
            "/agent-bridge"
        )  # Connect to agent bridge, not direct logs namespace
        self.system_log_stream_task: Optional[asyncio.Task] = None
        self.docker_log_stream_task: Optional[asyncio.Task] = None
        self.active_containers: Dict[str, str] = {}  # container_id -> user_id mapping

    async def _register_event_handlers(self):
        """Register logs namespace-specific event handlers - ONLY server-to-agent events"""
        self.event_handlers = {
            # Legacy system log requests
            "request_system_logs": self._handle_system_logs_request,
            "request_container_logs": self._handle_container_logs_request,
            # Core streaming events (server sends these to agent)
            "start_log_stream": self._handle_start_log_stream,
            "stop_log_stream": self._handle_stop_log_stream,
            # Alternative event names server might use
            "start_stream": self._handle_start_log_stream,
            "stop_stream": self._handle_stop_log_stream,
            "stream_start": self._handle_start_log_stream,
            "stream_stop": self._handle_stop_log_stream,
            # Bridge integration
            "request_logs": self._handle_log_request,
            "join_admin_logs": self._handle_join_admin_logs,
            "server_response": self._handle_server_response,
            # NO FRONTEND EVENTS - Client never connects to agent directly
        }

    async def _on_connected(self):
        """Handle connection established - ready for streaming requests"""
        # Don't auto-join rooms or start streaming - wait for client request
        logger.info("Agent bridge connected and ready for log streaming requests")

    async def start_streaming(self):
        """
        Start log streaming tasks - integrate with unified collector system
        This is called when a client requests realtime streaming via /api/v1/logs/streams
        """
        # Set is_active to True to enable streaming loops
        self.is_active = True

        logger.info(f"Starting unified log streaming for {self.namespace_path}")

        # Start system log streaming with file watching (like Node.js collectors)
        if not self.system_log_stream_task or self.system_log_stream_task.done():
            self.system_log_stream_task = asyncio.create_task(
                self._stream_system_logs_realtime()
            )

        # Also start live file watching for immediate log detection
        await self.start_live_file_watching()

        # Start Docker log monitoring
        if not self.docker_log_stream_task or self.docker_log_stream_task.done():
            self.docker_log_stream_task = asyncio.create_task(
                self._monitor_docker_logs()
            )

        logger.info("SUCCESS: Unified log streaming started with file watching")

    async def stop_streaming(self):
        """Stop log streaming tasks"""
        logger.info("🛑 STOP STREAMING: Stopping unified log streaming...")
        logger.debug(
            f"🛑 CURRENT STATE: is_active={self.is_active}, system_task_running={self.system_log_stream_task and not self.system_log_stream_task.done()}, docker_task_running={self.docker_log_stream_task and not self.docker_log_stream_task.done()}"
        )

        # Set is_active to False to stop all streaming loops immediately
        was_active = self.is_active
        self.is_active = False
        logger.info(f"🛑 STATE CHANGED: is_active set to False (was: {was_active})")

        # Stop system log streaming
        if self.system_log_stream_task and not self.system_log_stream_task.done():
            logger.info("🛑 CANCELLING: System log stream task...")
            self.system_log_stream_task.cancel()
            try:
                await self.system_log_stream_task
                logger.info(
                    "✅ CANCELLED: System log stream task cancelled successfully"
                )
            except asyncio.CancelledError:
                logger.info(
                    "✅ CANCELLED: System log stream task cancelled (CancelledError)"
                )

        # Stop live file watching
        logger.info("🛑 STOPPING: Live file watching...")
        await self.stop_live_file_watching()

        # Stop Docker log streaming
        if self.docker_log_stream_task and not self.docker_log_stream_task.done():
            logger.info("🛑 CANCELLING: Docker log stream task...")
            self.docker_log_stream_task.cancel()
            try:
                await self.docker_log_stream_task
                logger.info(
                    "✅ CANCELLED: Docker log stream task cancelled successfully"
                )
            except asyncio.CancelledError:
                logger.info(
                    "✅ CANCELLED: Docker log stream task cancelled (CancelledError)"
                )

        logger.info(
            f"✅ STOP COMPLETE: Unified log streaming stopped (was_active: {was_active})"
        )

    async def cleanup(self):
        """Cleanup logs namespace"""
        await self.stop_streaming()
        await super().cleanup()

    # Event Handlers
    async def _handle_system_logs_request(self, data: Dict[str, Any]):
        """Handle request for system logs"""
        try:
            # Get recent system logs
            logs = await self._get_recent_system_logs(data.get("lines", 100))

            await self.emit_to_server(
                "/agent-logs:system_logs_response",  # Use namespaced event format
                {
                    "logs": logs,
                    "agent_id": settings.agent_id,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room="admin-system-logs",
            )

        except Exception as e:
            logger.error(f"Error handling system logs request: {e}")

    async def _handle_container_logs_request(self, data: Dict[str, Any]):
        """Handle request for container logs"""
        try:
            container_id = data.get("container_id")
            user_id = data.get("user_id")
            lines = data.get("lines", 100)

            if not container_id:
                return

            # Get container logs
            logs = await self._get_container_logs(container_id, lines)

            # Send to user-specific room
            room = f"user-{user_id}-logs" if user_id else "admin-system-logs"

            await self.emit_to_server(
                "/agent-logs:container_logs_response",  # Use namespaced event format
                {
                    "container_id": container_id,
                    "logs": logs,
                    "user_id": user_id,
                    "agent_id": settings.agent_id,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room=room,
            )

        except Exception as e:
            logger.error(f"Error handling container logs request: {e}")

    async def _handle_start_log_stream(self, data: Dict[str, Any]):
        """Handle start log streaming request"""
        stream_type = data.get("type", "system")
        auto_start = data.get("autoStart", True)

        logger.info(
            f"🎯 START REQUEST: Starting log stream - type: {stream_type}, autoStart: {auto_start}"
        )
        logger.debug(f"🎯 START DATA: {data}")

        if stream_type == "system":
            await self.start_streaming()
        elif stream_type == "container":
            container_id = data.get("container_id")
            user_id = data.get("user_id")
            if container_id and user_id:
                self.active_containers[container_id] = user_id
                await self._start_container_log_stream(container_id, user_id)

        # Send confirmation back to server
        confirmation_data = {
            "agent_id": settings.agent_id,
            "stream_type": stream_type,
            "status": "started",
            "timestamp": datetime.utcnow().isoformat(),
        }

        logger.info("📤 SENDING CONFIRMATION: log_stream_started event")
        logger.debug(f"📤 CONFIRMATION DATA: {confirmation_data}")

        await self.emit_to_server("log_stream_started", confirmation_data)

    async def _handle_stop_log_stream(self, data: Dict[str, Any]):
        """Handle stop log streaming request"""
        stream_type = data.get("type", "system")

        logger.info(
            f"🛑 STOP REQUEST: Received stop stream request - type: {stream_type}"
        )
        logger.debug(f"🛑 STOP DATA: {data}")

        if stream_type == "system":
            logger.info("🛑 STOPPING: System log streaming...")
            await self.stop_streaming()
            logger.info("✅ STOPPED: System log streaming stopped successfully")
        elif stream_type == "container":
            container_id = data.get("container_id")
            if container_id in self.active_containers:
                logger.info(f"🛑 STOPPING: Container logs for {container_id}")
                del self.active_containers[container_id]
                logger.info(f"✅ STOPPED: Container logs for {container_id}")

        # Send confirmation back to server
        confirmation_data = {
            "agent_id": settings.agent_id,
            "stream_type": stream_type,
            "status": "stopped",
            "timestamp": datetime.utcnow().isoformat(),
        }

        logger.info("📤 SENDING CONFIRMATION: log_stream_stopped event")
        logger.debug(f"📤 CONFIRMATION DATA: {confirmation_data}")

        await self.emit_to_server("log_stream_stopped", confirmation_data)

    async def _handle_join_admin_logs(self, data: Dict[str, Any]):
        """Handle admin joining system logs room"""
        await self.join_room("admin-system-logs")

    async def _handle_server_response(self, data: Dict[str, Any]):
        """Handle general server responses"""
        logger.debug(f"Server response: {data}")

    async def _handle_log_request(self, data: Dict[str, Any]):
        """Handle log request from server (for bridge integration)"""
        try:
            request_id = data.get("requestId")
            log_type = data.get("type", "system")
            lines = data.get("lines", 50)
            auto_start = data.get("autoStart", False)

            logger.info(
                f"Received log request: {request_id}, type: {log_type}, lines: {lines}, autoStart: {auto_start}"
            )

            if log_type == "system":
                # Get system logs
                logs = await self._get_recent_system_logs(lines)

                # Send response with the correct event format for bridge
                await self.emit_to_server(
                    "system_logs_response",  # Direct event name for bridge
                    {
                        "requestId": request_id,
                        "logs": logs,
                        "agent_id": settings.agent_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "log_type": "system",
                        "room": "admin-system-logs",  # Include room in data
                    },
                )

                logger.info(f"Sent system logs response for request: {request_id}")

                # If autoStart is enabled, start live streaming
                if auto_start:
                    logger.info("Auto-starting live log stream as requested")
                    await self.start_streaming()

            elif log_type == "container":
                container_id = data.get("container_id")
                if container_id:
                    # Get container logs
                    logs = await self._get_container_logs(container_id, lines)

                    await self.emit_to_server(
                        "container_logs_response",  # Direct event name for bridge
                        {
                            "requestId": request_id,
                            "container_id": container_id,
                            "logs": logs,
                            "agent_id": settings.agent_id,
                            "timestamp": datetime.utcnow().isoformat(),
                            "log_type": "container",
                            "room": "admin-system-logs",
                        },
                    )

                    logger.info(
                        f"Sent container logs response for request: {request_id}"
                    )
                else:
                    logger.error(
                        f"Container ID required for container log request: {request_id}"
                    )
            else:
                logger.error(f"Unknown log type in request: {log_type}")

        except Exception as e:
            logger.error(
                f"Error handling log request: {e}"
            )  # Log Streaming Implementation - Integrated with Unified Collector System

    async def _stream_system_logs_realtime(self):
        """
        Stream system logs continuously - focused on WebSocket transmission
        The key difference: Agent streams logs via WebSocket, not file-only reading
        """
        try:
            logger.info(
                "🎯 STARTING: realtime system log streaming via WebSocket bridge"
            )
            last_log_time = datetime.utcnow()
            loop_count = 0

            while self.is_active:
                loop_count += 1
                logger.debug(
                    f"📊 STREAM LOOP #{loop_count}: Checking for new logs (is_active: {self.is_active})"
                )

                # Get recent logs for incremental streaming
                logs = await self._get_recent_system_logs(5, since=last_log_time)

                if logs:
                    logger.info(f"📝 FOUND LOGS: {len(logs)} new system logs to stream")
                    logger.debug(f"📄 LOG SAMPLE: {logs[0] if logs else 'None'}")

                    # **CRITICAL**: Send logs via WebSocket bridge to backend
                    # This is what the AgentLogCollector.handleBridgeLogData() expects
                    await self.emit_to_server(
                        "live_system_logs",  # Event that AgentLogCollector listens for
                        {
                            "logs": logs,
                            "agent_id": settings.agent_id,
                            "timestamp": datetime.utcnow().isoformat(),
                            "log_type": "system",
                            "room": "admin-system-logs",
                            "stream_type": "realtime",
                            "collector_type": "agent",
                            "source": "agent-websocket-stream",  # WebSocket-based, not file-only
                        },
                    )

                    logger.info(
                        f"✅ SENT TO BACKEND: {len(logs)} logs via WebSocket bridge"
                    )
                    # Update timestamp to prevent duplicates
                    last_log_time = datetime.utcnow()
                else:
                    logger.debug(f"⏳ NO NEW LOGS: Loop #{loop_count}")

                # Stream every 2 seconds for responsive WebSocket transmission
                logger.debug(
                    f"😴 SLEEPING: 2 seconds before next check (loop #{loop_count})"
                )
                await asyncio.sleep(2)

        except asyncio.CancelledError:
            logger.info(
                f"🛑 STREAM CANCELLED: Realtime system log streaming cancelled after {loop_count} loops"
            )
        except Exception as e:
            logger.error(
                f"💥 STREAM ERROR: Error in realtime system log streaming: {e}"
            )
            logger.exception("Full traceback:")  # This will log the full stack trace

    async def _monitor_docker_logs(self):
        """Monitor Docker container logs with unified collector integration"""
        try:
            logger.info("Starting Docker container log monitoring (unified collector)")

            while self.is_active:
                # Check active containers for new logs
                for container_id, user_id in list(self.active_containers.items()):
                    try:
                        logs = await self._get_container_logs(container_id, 5)

                        if logs:
                            room = f"user-{user_id}-logs"

                            # Send live container logs to unified system
                            await self.emit_to_server(
                                "live_container_logs",
                                {
                                    "container_id": container_id,
                                    "logs": logs,
                                    "user_id": user_id,
                                    "agent_id": settings.agent_id,
                                    "timestamp": datetime.utcnow().isoformat(),
                                    "log_type": "container",
                                    "room": room,
                                    "stream_type": "realtime",
                                    "collector_type": "agent",
                                    "source": "agent-container-stream",
                                },
                            )

                    except Exception as e:
                        logger.error(
                            f"Error streaming logs for container {container_id}: {e}"
                        )

                await asyncio.sleep(3)  # Check every 3 seconds

        except asyncio.CancelledError:
            logger.debug("Docker log monitoring cancelled")
        except Exception as e:
            logger.error(f"Error in Docker log monitoring: {e}")

    async def _start_container_log_stream(self, container_id: str, user_id: str):
        """Start streaming logs for a specific container"""
        logger.info(
            f"Starting log stream for container {container_id} (user: {user_id})"
        )

        # Join user-specific room
        room = f"user-{user_id}-logs"
        await self.join_room(room)

    # Log Collection Methods (using service)
    async def _get_recent_system_logs(
        self, lines: int = 100, since: datetime = None
    ) -> List[Dict[str, Any]]:
        """Get recent system logs using the log collector service"""
        return await log_collector_service.get_recent_system_logs(lines, since)

    async def start_live_file_watching(self):
        """
        Start live file watching using the log collector service
        """
        import os

        log_paths = log_collector_service._get_system_log_paths()
        active_log_path = None

        # Find existing log file
        for path in log_paths:
            if os.path.exists(path):
                active_log_path = path
                break

        if not active_log_path:
            logger.warning(
                "⚠️ NO LOG FILES: No log files found for realtime file watching"
            )
            return

        # Define callback for new logs detected by file watcher
        async def file_watcher_callback(new_logs):
            """Handle new logs detected by file watcher"""
            if new_logs:
                logger.info(f"🔄 FILE WATCHER: Detected {len(new_logs)} new logs")

                # **CRITICAL**: Emit live logs immediately via WebSocket bridge
                await self.emit_to_server(
                    "live_system_logs",  # Same event as periodic streaming
                    {
                        "logs": new_logs,
                        "agent_id": settings.agent_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "log_type": "system",
                        "room": "admin-system-logs",
                        "stream_type": "file-watch-realtime",  # Immediate file detection
                        "collector_type": "agent",
                        "source": "agent-file-watcher-websocket",  # WebSocket + file watch
                    },
                )
                logger.info(
                    f"✅ FILE WATCHER: Streamed {len(new_logs)} logs via WebSocket"
                )

        # Start file watching using the service
        success = await log_collector_service.start_file_watching(
            active_log_path, file_watcher_callback
        )

        if success:
            logger.info(f"✅ FILE WATCHING: Started for {active_log_path}")
        else:
            logger.warning("⚠️ FILE WATCHING: Failed to start, using polling only")

    async def stop_live_file_watching(self):
        """Stop live file watching using the service"""
        await log_collector_service.stop_file_watching()

    def _get_system_log_paths(self) -> List[str]:
        """Get potential system log file paths based on environment"""
        import os

        # Get absolute path to agent logs directory
        # This points to the actual agent log files, not backend files
        agent_root = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        )
        agent_logs_dir = os.path.join(agent_root, "logs")

        # Define agent-specific log paths
        if os.getenv("NODE_ENV") == "production" or os.path.exists("/app"):
            # Docker/production environment
            base_paths = [
                "/app/logs/agent.log",
                "/app/logs/fastapi.log",
                "/shared-logs/agent.log",
            ]
        else:
            # Development environment - use actual agent logs directory
            base_paths = [
                os.path.join(agent_logs_dir, "agent.log"),
                os.path.join(agent_logs_dir, "combined.log"),
                "logs/agent.log",  # Relative fallback
                "/var/log/deployio-agent.log",  # System-wide logs
            ]

        # Convert all to absolute paths and verify they exist
        absolute_paths = []
        for path in base_paths:
            if os.path.isabs(path):
                absolute_paths.append(path)
            else:
                # Convert relative to absolute from current working directory
                abs_path = os.path.abspath(path)
                absolute_paths.append(abs_path)

        # Log the paths for debugging
        logger.debug(f"Agent log paths searched: {absolute_paths}")
        existing_paths = [p for p in absolute_paths if os.path.exists(p)]
        logger.info(f"Found existing agent log files: {existing_paths}")

        return absolute_paths

    async def _tail_log_file(
        self, log_path: str, lines: int, since: datetime = None
    ) -> List[Dict[str, Any]]:
        """
        Efficiently tail log file using pure Python for all environments
        """
        try:
            # Use Python file reading for all environments (Windows, Unix, Linux)
            try:
                with open(log_path, "r", encoding="utf-8") as f:
                    all_lines = f.readlines()
                    recent_lines = (
                        all_lines[-lines:] if len(all_lines) > lines else all_lines
                    )
                    log_lines = [line.strip() for line in recent_lines if line.strip()]

                if log_lines:
                    parsed_logs = []

                    for idx, line in enumerate(log_lines):
                        if line.strip():
                            parsed_log = self._parse_log_line(line, idx, log_path)
                            if parsed_log:
                                # Filter by timestamp if 'since' is provided
                                if since:
                                    try:
                                        log_time = datetime.fromisoformat(
                                            parsed_log["timestamp"].replace(
                                                "Z", "+00:00"
                                            )
                                        )
                                        if log_time <= since:
                                            continue
                                    except Exception:
                                        pass  # If timestamp parsing fails, include the log

                                parsed_logs.append(parsed_log)

                    return (
                        parsed_logs[-lines:]
                        if len(parsed_logs) > lines
                        else parsed_logs
                    )
                else:
                    logger.warning(f"No log lines found in {log_path}")
                    return []

            except Exception as e:
                logger.warning(f"Failed to read log file {log_path}: {e}")
                return []

        except Exception as e:
            logger.error(f"Error reading log file {log_path}: {e}")
            return []

    def _parse_log_line(
        self, line: str, index: int, file_path: str = None
    ) -> Dict[str, Any]:
        """
        Parse a log line into standardized format (similar to Node.js parseLogLine)
        """
        try:
            # Try to parse as structured log (JSON) - like Node.js version
            import json

            log_data = json.loads(line)
            return {
                "id": f"agent_log_{int(datetime.utcnow().timestamp())}_{index}",
                "timestamp": log_data.get("timestamp", datetime.utcnow().isoformat()),
                "level": log_data.get("level", "INFO").upper(),
                "message": log_data.get("message", line),
                "source": "agent-file-watch",  # Similar to Node.js source naming
                "agent_id": settings.agent_id,
                "raw": line,
                "metadata": {"filePath": file_path, **log_data},
            }
        except (json.JSONDecodeError, TypeError):
            # Parse as plain text log (similar to Node.js fallback)
            import re

            # Common log patterns (matching Node.js approach)
            timestamp_pattern = r"^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}[^\s]*)"
            level_pattern = r"\b(DEBUG|INFO|WARN|WARNING|ERROR|CRITICAL|FATAL)\b"

            timestamp_match = re.search(timestamp_pattern, line)
            level_match = re.search(level_pattern, line, re.IGNORECASE)

            timestamp = (
                timestamp_match.group(1)
                if timestamp_match
                else datetime.utcnow().isoformat()
            )
            level = level_match.group(1).upper() if level_match else "INFO"

            return {
                "id": f"agent_log_{int(datetime.utcnow().timestamp())}_{index}",
                "timestamp": timestamp,
                "level": level,
                "message": line,
                "source": "agent-file-watch",
                "agent_id": settings.agent_id,
                "raw": line,
                "metadata": {"filePath": file_path},
            }

    # Delegated methods (now using service)
    async def _get_container_logs(
        self, container_id: str, lines: int = 100
    ) -> List[Dict[str, Any]]:
        """Get logs from specific Docker container using the service"""
        return await log_collector_service.get_container_logs(container_id, lines)

    def get_namespace_status(self) -> Dict[str, Any]:
        """Get logs namespace status"""
        base_status = self.get_status()
        base_status.update(
            {
                "active_containers": len(self.active_containers),
                "container_mappings": self.active_containers.copy(),
                "system_streaming": self.system_log_stream_task is not None
                and not self.system_log_stream_task.done(),
                "docker_monitoring": self.docker_log_stream_task is not None
                and not self.docker_log_stream_task.done(),
            }
        )
        return base_status

    async def emit_to_server(self, event: str, data: Any, room: str = None):
        """Emit data to server with detailed logging for debugging"""
        try:
            logger.info(f"🚀 AGENT EMIT: Sending event '{event}' to server")
            logger.debug(f"📦 AGENT EMIT DATA: {data}")
            if room:
                logger.debug(f"🏠 AGENT EMIT ROOM: {room}")

            # Call the base class emit method
            result = await super().emit_to_server(event, data, room)

            logger.info(f"✅ AGENT EMIT SUCCESS: Event '{event}' sent successfully")
            return result

        except Exception as e:
            logger.error(f"❌ AGENT EMIT FAILED: Error sending event '{event}': {e}")
            raise


# Global logs namespace instance
agent_logs_namespace = AgentLogsNamespace()
