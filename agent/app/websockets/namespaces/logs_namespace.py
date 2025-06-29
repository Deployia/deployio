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
        """Register logs namespace-specific event handlers"""
        self.event_handlers = {
            "request_system_logs": self._handle_system_logs_request,
            "request_container_logs": self._handle_container_logs_request,
            "start_log_stream": self._handle_start_log_stream,
            "stop_log_stream": self._handle_stop_log_stream,
            "join_admin_logs": self._handle_join_admin_logs,
            "server_response": self._handle_server_response,
            "request_logs": self._handle_log_request,  # NEW: Handle server log requests
        }

    async def _on_connected(self):
        """Handle connection established - ready for streaming requests"""
        # Don't auto-join rooms or start streaming - wait for client request
        logger.info("Agent bridge connected and ready for log streaming requests")

    async def start_streaming(self):
        """Start log streaming tasks"""
        if not self.is_active:
            return

        logger.info(f"Starting log streaming for {self.namespace_path}")

        # Start system log streaming
        if not self.system_log_stream_task or self.system_log_stream_task.done():
            self.system_log_stream_task = asyncio.create_task(
                self._stream_system_logs()
            )

        # Start Docker log monitoring
        if not self.docker_log_stream_task or self.docker_log_stream_task.done():
            self.docker_log_stream_task = asyncio.create_task(
                self._monitor_docker_logs()
            )

        logger.info("SUCCESS: Log streaming started")

    async def stop_streaming(self):
        """Stop log streaming tasks"""
        logger.info("Stopping log streaming...")

        # Stop system log streaming
        if self.system_log_stream_task and not self.system_log_stream_task.done():
            self.system_log_stream_task.cancel()
            try:
                await self.system_log_stream_task
            except asyncio.CancelledError:
                pass

        # Stop Docker log streaming
        if self.docker_log_stream_task and not self.docker_log_stream_task.done():
            self.docker_log_stream_task.cancel()
            try:
                await self.docker_log_stream_task
            except asyncio.CancelledError:
                pass

        logger.info("SUCCESS: Log streaming stopped")

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

        if stream_type == "system":
            await self.start_streaming()
        elif stream_type == "container":
            container_id = data.get("container_id")
            user_id = data.get("user_id")
            if container_id and user_id:
                self.active_containers[container_id] = user_id
                await self._start_container_log_stream(container_id, user_id)

    async def _handle_stop_log_stream(self, data: Dict[str, Any]):
        """Handle stop log streaming request"""
        stream_type = data.get("type", "system")

        if stream_type == "system":
            await self.stop_streaming()
        elif stream_type == "container":
            container_id = data.get("container_id")
            if container_id in self.active_containers:
                del self.active_containers[container_id]

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

            logger.info(
                f"Received log request: {request_id}, type: {log_type}, lines: {lines}"
            )

            if log_type == "system":
                # Get system logs
                logs = await self._get_recent_system_logs(lines)

                # Send response with the correct event format
                await self.emit_to_server(
                    "/agent-logs:system_logs_response",
                    {
                        "requestId": request_id,
                        "logs": logs,
                        "agent_id": settings.agent_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "log_type": "system",
                    },
                    room="admin-system-logs",
                )

                logger.info(f"Sent system logs response for request: {request_id}")

            elif log_type == "container":
                container_id = data.get("container_id")
                if container_id:
                    # Get container logs
                    logs = await self._get_container_logs(container_id, lines)

                    await self.emit_to_server(
                        "/agent-logs:container_logs_response",
                        {
                            "requestId": request_id,
                            "container_id": container_id,
                            "logs": logs,
                            "agent_id": settings.agent_id,
                            "timestamp": datetime.utcnow().isoformat(),
                            "log_type": "container",
                        },
                        room="admin-system-logs",
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
            logger.error(f"Error handling log request: {e}")

    # Log Streaming Implementation
    async def _stream_system_logs(self):
        """Stream system logs continuously"""
        try:
            while self.is_active:
                # Get recent system logs
                logs = await self._get_recent_system_logs(10)

                if logs:
                    await self.emit_to_server(
                        "/agent-logs:system_logs",  # Use namespaced event format
                        {
                            "logs": logs,
                            "agent_id": settings.agent_id,
                            "timestamp": datetime.utcnow().isoformat(),
                            "log_type": "system",
                        },
                        room="admin-system-logs",
                    )

                await asyncio.sleep(5)  # Stream every 5 seconds

        except asyncio.CancelledError:
            logger.debug("System log streaming cancelled")
        except Exception as e:
            logger.error(f"Error in system log streaming: {e}")

    async def _monitor_docker_logs(self):
        """Monitor Docker container logs"""
        try:
            while self.is_active:
                # Check active containers for new logs
                for container_id, user_id in list(self.active_containers.items()):
                    try:
                        logs = await self._get_container_logs(container_id, 10)

                        if logs:
                            room = f"user-{user_id}-logs"
                            await self.emit_to_server(
                                "/agent-logs:container_logs",  # Use namespaced event format
                                {
                                    "container_id": container_id,
                                    "logs": logs,
                                    "user_id": user_id,
                                    "agent_id": settings.agent_id,
                                    "timestamp": datetime.utcnow().isoformat(),
                                    "log_type": "container",
                                },
                                room=room,
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

    # Log Collection Methods (Placeholder implementations)
    async def _get_recent_system_logs(self, lines: int = 100) -> List[Dict[str, Any]]:
        """
        Get recent system logs
        TODO: Implement actual system log collection
        """
        # Placeholder implementation
        return [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "level": "INFO",
                "message": f"System log entry {i}",
                "source": "system",
                "agent_id": settings.agent_id,
            }
            for i in range(min(lines, 5))  # Return max 5 placeholder logs
        ]

    async def _get_container_logs(
        self, container_id: str, lines: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get logs from specific Docker container
        TODO: Implement actual Docker log collection
        """
        # Placeholder implementation
        return [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "level": "INFO",
                "message": f"Container {container_id} log entry {i}",
                "source": "container",
                "container_id": container_id,
                "agent_id": settings.agent_id,
            }
            for i in range(min(lines, 3))  # Return max 3 placeholder logs
        ]

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


# Global logs namespace instance
agent_logs_namespace = AgentLogsNamespace()
