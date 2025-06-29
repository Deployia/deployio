"""
Agent Logs Namespace
Simplified to match SystemLogCollector.js architecture
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.websockets.namespaces.base import BaseAgentNamespace
from app.core.config import settings
from app.services.log_collector import log_collector_service

logger = logging.getLogger(__name__)


class AgentLogsNamespace(BaseAgentNamespace):
    """
    Agent Logs Namespace - simplified architecture matching SystemLogCollector.js
    """

    def __init__(self):
        super().__init__("/agent-bridge")
        self.active_containers: Dict[str, str] = {}
        self.current_stream_id: Optional[str] = None

    async def _register_event_handlers(self):
        """Register event handlers - simplified and consistent"""
        self.event_handlers = {
            # Core streaming events (server -> agent)
            "start_log_stream": self._handle_start_log_stream,
            "stop_log_stream": self._handle_stop_log_stream,
            # Legacy support
            "request_system_logs": self._handle_system_logs_request,
            "request_container_logs": self._handle_container_logs_request,
            "request_logs": self._handle_log_request,
            "join_admin_logs": self._handle_join_admin_logs,
            "server_response": self._handle_server_response,
        }

    async def _on_connected(self):
        """Handle connection established"""
        logger.info("Agent bridge connected and ready for log streaming requests")

    async def start_streaming(self):
        """Start log streaming - simplified to match SystemLogCollector architecture"""
        self.is_active = True
        logger.info("Starting agent log streaming")

        # Only start real-time file watching (no duplicate periodic streaming)
        await self.start_realtime_collection()

        logger.info("Agent log streaming started successfully")

    async def start_realtime_collection(self):
        """Start real-time collection using simplified collector (like SystemLogCollector)"""

        # Define emit callback for logs
        async def emit_log_callback(log_entry: Dict[str, Any]):
            """Emit log via WebSocket to backend"""
            if not self.is_active:
                return

            # Convert to agent format and emit
            agent_log = {
                "logs": [log_entry],
                "agent_id": settings.agent_id,
                "timestamp": datetime.utcnow().isoformat(),
                "log_type": "system",
                "room": "admin-system-logs",
                "stream_type": "file-watch-realtime",
                "collector_type": "agent",
                "source": "agent-file-watcher",
                "streamId": self.current_stream_id,
            }

            await self.emit_to_server("live_system_logs", agent_log)

        # Start the simplified collector with real-time option
        await log_collector_service.start(emit_log_callback, {"realtime": True})

    async def stop_streaming(self):
        """Stop log streaming - simplified"""
        logger.info("Stopping agent log streaming...")

        # Set is_active to False first
        was_active = self.is_active
        self.is_active = False
        self.current_stream_id = None

        # Stop the simplified collector
        await log_collector_service.stop()

        logger.info(f"Agent log streaming stopped (was_active: {was_active})")

    async def cleanup(self):
        """Cleanup logs namespace"""
        await self.stop_streaming()
        await super().cleanup()

    # Event Handlers
    async def _handle_system_logs_request(self, data: Dict[str, Any]):
        """Handle request for system logs"""
        try:
            logs = await self._get_recent_system_logs(data.get("lines", 100))
            await self.emit_to_server(
                "/agent-logs:system_logs_response",
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

            logs = await self._get_container_logs(container_id, lines)
            room = f"user-{user_id}-logs" if user_id else "admin-system-logs"

            await self.emit_to_server(
                "/agent-logs:container_logs_response",
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
        # Use clientStreamId for consistency with backend
        self.current_stream_id = data.get("clientStreamId") or data.get("streamId")

        logger.info(
            f"Starting log stream - type: {stream_type}, autoStart: {auto_start}, streamId: {self.current_stream_id}"
        )

        if stream_type == "system":
            await self.start_streaming()
        elif stream_type == "container":
            container_id = data.get("container_id")
            user_id = data.get("user_id")
            if container_id and user_id:
                self.active_containers[container_id] = user_id
                await self._start_container_log_stream(container_id, user_id)

        # Send confirmation
        confirmation_data = {
            "agent_id": settings.agent_id,
            "stream_type": stream_type,
            "status": "started",
            "timestamp": datetime.utcnow().isoformat(),
            "streamId": self.current_stream_id,
        }

        await self.emit_to_server("log_stream_started", confirmation_data)

    async def _handle_stop_log_stream(self, data: Dict[str, Any]):
        """Handle stop log streaming request"""
        stream_type = data.get("type", "system")

        logger.info(f"Received stop stream request - type: {stream_type}")

        if stream_type == "system":
            await self.stop_streaming()
        elif stream_type == "container":
            container_id = data.get("container_id")
            if container_id in self.active_containers:
                del self.active_containers[container_id]

        # Send confirmation
        confirmation_data = {
            "agent_id": settings.agent_id,
            "stream_type": stream_type,
            "status": "stopped",
            "timestamp": datetime.utcnow().isoformat(),
        }

        await self.emit_to_server("log_stream_stopped", confirmation_data)

    async def _handle_join_admin_logs(self, data: Dict[str, Any]):
        """Handle admin joining system logs room"""
        await self.join_room("admin-system-logs")

    async def _handle_server_response(self, data: Dict[str, Any]):
        """Handle general server responses"""
        logger.debug(f"Server response: {data}")

    async def _handle_log_request(self, data: Dict[str, Any]):
        """Handle log request from server"""
        try:
            request_id = data.get("requestId")
            log_type = data.get("type", "system")
            lines = data.get("lines", 50)
            auto_start = data.get("autoStart", False)

            if log_type == "system":
                logs = await self._get_recent_system_logs(lines)
                await self.emit_to_server(
                    "system_logs_response",
                    {
                        "requestId": request_id,
                        "logs": logs,
                        "agent_id": settings.agent_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "log_type": "system",
                        "room": "admin-system-logs",
                    },
                )

                if auto_start:
                    await self.start_streaming()

            elif log_type == "container":
                container_id = data.get("container_id")
                if container_id:
                    logs = await self._get_container_logs(container_id, lines)
                    await self.emit_to_server(
                        "container_logs_response",
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

        except Exception as e:
            logger.error(f"Error handling log request: {e}")

    # Log Collection Methods (simplified)
    async def _get_recent_system_logs(
        self, lines: int = 100, since: datetime = None
    ) -> List[Dict[str, Any]]:
        """Get recent system logs using simplified collector"""
        result = await log_collector_service.get_recent_logs(
            {"lines": lines, "level": "all"}
        )
        logs = result.get("logs", [])

        # Filter by since timestamp if provided
        if since and logs:
            filtered_logs = []
            for log in logs:
                try:
                    log_time = datetime.fromisoformat(
                        log["timestamp"].replace("Z", "+00:00")
                    )
                    if log_time > since:
                        filtered_logs.append(log)
                except Exception:
                    filtered_logs.append(log)  # Include if timestamp parsing fails
            return filtered_logs

        return logs

    async def _get_container_logs(
        self, container_id: str, lines: int = 100
    ) -> List[Dict[str, Any]]:
        """Get logs from specific Docker container - simplified"""
        # For now, return empty array - container logs can be added later
        return []

    async def _start_container_log_stream(self, container_id: str, user_id: str):
        """Start streaming logs for a specific container"""
        logger.info(
            f"Starting log stream for container {container_id} (user: {user_id})"
        )
        room = f"user-{user_id}-logs"
        await self.join_room(room)

    def get_namespace_status(self) -> Dict[str, Any]:
        """Get logs namespace status"""
        base_status = self.get_status()
        base_status.update(
            {
                "active_containers": len(self.active_containers),
                "container_mappings": self.active_containers.copy(),
                "is_streaming": self.is_active,
                "current_stream_id": self.current_stream_id,
            }
        )
        return base_status

    async def emit_to_server(self, event: str, data: Any, room: str = None):
        """Emit data to server with minimal logging for performance"""
        try:
            # Only log non-live events to reduce spam
            if not event.startswith("live_"):
                logger.info(f"Sending event '{event}' to server")

            # Call the base class emit method
            result = await super().emit_to_server(event, data, room)

            # Only log success for non-live events
            if not event.startswith("live_"):
                logger.info(f"Event '{event}' sent successfully")

            return result

        except Exception as e:
            logger.error(f"Error sending event '{event}': {e}")
            raise


# Global logs namespace instance
agent_logs_namespace = AgentLogsNamespace()
