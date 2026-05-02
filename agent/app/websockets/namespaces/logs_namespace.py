"""
Agent logs namespace (bridge) — **host / admin system logs only**

End-to-end (admin):
  Server (AgentLogCollector) → `start_log_stream` / `request_logs` on this namespace
  → `log_collector_service` tails agent log files → emits `live_system_logs` / `system_logs_response`
  → AgentBridgeService → StreamRouter → admin clients.

**Runtime container logs for a deployment** are not handled here. They live entirely in
`deployment_namespace` (`start_deployment_container_logs`, `deployment_logs_request`, …)
so there is a single code path to Docker via `DeploymentService._resolve_container`.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.websockets.namespaces.base import BaseAgentNamespace
from app.core.config import settings
from app.services.log_collector import log_collector_service

logger = logging.getLogger(__name__)


class AgentLogsNamespace(BaseAgentNamespace):
    def __init__(self):
        super().__init__("/agent-bridge")
        self.current_stream_id: Optional[str] = None

    async def _register_event_handlers(self):
        self.event_handlers = {
            "start_log_stream": self._handle_start_log_stream,
            "stop_log_stream": self._handle_stop_log_stream,
            "request_logs": self._handle_request_logs,
        }

    async def _on_connected(self):
        logger.info("Agent logs namespace ready (system log streaming)")

    async def start_streaming(self):
        self.is_active = True
        await self.start_realtime_collection()

    async def start_realtime_collection(self):
        async def emit_log_callback(log_entry: Dict[str, Any]):
            if not self.is_active:
                return
            payload = {
                "logs": [log_entry],
                "agent_id": settings.agent_id,
                "timestamp": datetime.utcnow().isoformat(),
                "log_type": "system",
                "stream_type": "file-watch-realtime",
                "collector_type": "agent",
                "streamId": self.current_stream_id,
            }
            await self.emit_to_server("live_system_logs", payload)

        await log_collector_service.start(emit_log_callback, {"realtime": True})

    async def stop_streaming(self):
        self.is_active = False
        self.current_stream_id = None
        await log_collector_service.stop()

    async def _handle_request_logs(self, data: Dict[str, Any]):
        request_id = data.get("requestId")
        lines = int(data.get("lines") or 50)
        auto_start = bool(data.get("autoStart"))

        logs = await self._get_recent_system_logs(lines)
        await self.emit_to_server(
            "system_logs_response",
            {
                "requestId": request_id,
                "logs": logs,
                "agent_id": settings.agent_id,
                "timestamp": datetime.utcnow().isoformat(),
                "log_type": "system",
            },
        )
        if auto_start:
            await self.start_streaming()

    async def _handle_start_log_stream(self, data: Dict[str, Any]):
        stream_type = (data.get("type") or "system").lower()
        self.current_stream_id = data.get("clientStreamId") or data.get("streamId")

        if stream_type != "system":
            logger.info(
                "start_log_stream type=%s is not supported on logs namespace (use deployment namespace)",
                stream_type,
            )
            await self.emit_to_server(
                "log_stream_started",
                {
                    "agent_id": settings.agent_id,
                    "stream_type": stream_type,
                    "status": "ignored",
                    "reason": "system_logs_only_use_deployment_namespace_for_container",
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )
            return

        logger.info("Starting system log stream streamId=%s", self.current_stream_id)
        await self.start_streaming()
        await self.emit_to_server(
            "log_stream_started",
            {
                "agent_id": settings.agent_id,
                "stream_type": "system",
                "status": "started",
                "timestamp": datetime.utcnow().isoformat(),
                "streamId": self.current_stream_id,
            },
        )

    async def _handle_stop_log_stream(self, data: Dict[str, Any]):
        stream_type = (data.get("type") or "system").lower()
        if stream_type == "system":
            await self.stop_streaming()
        await self.emit_to_server(
            "log_stream_stopped",
            {
                "agent_id": settings.agent_id,
                "stream_type": stream_type,
                "status": "stopped",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def _get_recent_system_logs(
        self, lines: int = 100, since: datetime = None
    ) -> List[Dict[str, Any]]:
        result = await log_collector_service.get_recent_logs(
            {"lines": lines, "level": "all"}
        )
        logs = result.get("logs", [])
        if since and logs:
            filtered: List[Dict[str, Any]] = []
            for log in logs:
                try:
                    log_time = datetime.fromisoformat(
                        str(log["timestamp"]).replace("Z", "+00:00")
                    )
                    if log_time > since:
                        filtered.append(log)
                except Exception:
                    filtered.append(log)
            return filtered
        return logs

    async def cleanup(self):
        await self.stop_streaming()
        await super().cleanup()


agent_logs_namespace = AgentLogsNamespace()
