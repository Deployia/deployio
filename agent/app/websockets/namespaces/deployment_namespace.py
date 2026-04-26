"""
Agent Deployment Namespace
Handles deployment lifecycle events via WebSocket bridge.
Server sends trigger/stop/restart, agent executes and reports back.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.websockets.namespaces.base import BaseAgentNamespace
from app.services.deployment_service import deployment_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentDeploymentNamespace(BaseAgentNamespace):
    """
    Deployment namespace — handles deployment:trigger, deployment:stop,
    deployment:restart events from the server, executes via DeploymentService,
    and emits status updates / build logs back to the server.
    """

    def __init__(self):
        super().__init__("/agent-bridge")
        self._streaming = False

    async def _register_event_handlers(self):
        """Register deployment event handlers."""
        self.event_handlers = {
            "deployment:trigger": self._handle_deploy_trigger,
            "deployment:stop": self._handle_deploy_stop,
            "deployment:restart": self._handle_deploy_restart,
            "deployment:status_request": self._handle_status_request,
            "deployment:logs_request": self._handle_logs_request,
        }

    async def _on_connected(self):
        """Handle connection established."""
        logger.info("Deployment namespace connected — ready for deployment commands")

    async def start_streaming(self):
        """Deployment namespace is event-driven, but implements streaming lifecycle for base compatibility."""
        self._streaming = True
        logger.debug("Deployment namespace streaming enabled")

    async def stop_streaming(self):
        """Stop deployment namespace streaming lifecycle hook."""
        self._streaming = False
        logger.debug("Deployment namespace streaming disabled")

    # ── Emit helpers ──────────────────────────────────────────────────

    async def _emit_status_update(
        self,
        deployment_id: str,
        status: str,
        message: str = "",
        **extra,
    ):
        """Emit deployment status update back to server."""
        payload = {
            "deploymentId": deployment_id,
            "status": status,
            "message": message,
            "agentId": settings.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
            **extra,
        }
        await self.emit_to_server("deployment:status_update", payload)

    async def _emit_build_log(
        self,
        deployment_id: str,
        level: str,
        message: str,
    ):
        """Emit a single build log line back to server."""
        payload = {
            "deploymentId": deployment_id,
            "level": level,
            "message": message,
            "agentId": settings.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.emit_to_server("deployment:build_log", payload)

    # ── Event handlers ────────────────────────────────────────────────

    async def _handle_deploy_trigger(self, data: Dict[str, Any]):
        """
        Handle deployment:trigger from server.
        Expected data: {deploymentId, image, subdomain, port, envVars}
        """
        deployment_id = data.get("deploymentId")
        image = data.get("image")
        subdomain = data.get("subdomain")
        port = data.get("port", 3000)
        env_vars = data.get("envVars") or {}

        if not deployment_id or not image or not subdomain:
            logger.error(f"deployment:trigger missing required fields: {data}")
            await self._emit_status_update(
                deployment_id or "unknown",
                "failed",
                "Missing required fields (deploymentId, image, subdomain)",
            )
            return

        logger.info(
            f"Received deployment trigger: {deployment_id} "
            f"image={image} subdomain={subdomain} port={port}"
        )

        # Status callback — relays every status change to server
        async def status_cb(dep_id, status, message, **kwargs):
            await self._emit_status_update(dep_id, status, message, **kwargs)

        # Log callback — relays every build log line to server
        async def log_cb(dep_id, level, message):
            await self._emit_build_log(dep_id, level, message)

        # Run deployment (async, may take several seconds)
        result = await deployment_service.deploy(
            deployment_id=deployment_id,
            image=image,
            subdomain=subdomain,
            port=port,
            env_vars=env_vars,
            status_callback=status_cb,
            log_callback=log_cb,
        )

        # Final status (deploy() already emits intermediate statuses via callbacks,
        # but we send a definitive "done" event as well)
        final_status = result.get("status", "unknown")
        await self._emit_status_update(
            deployment_id,
            final_status,
            result.get("error", f"Deployment {final_status}"),
            container_id=result.get("container_id"),
            url=result.get("url"),
        )

    async def _handle_deploy_stop(self, data: Dict[str, Any]):
        """Handle deployment:stop from server."""
        deployment_id = data.get("deploymentId")
        if not deployment_id:
            logger.error("deployment:stop missing deploymentId")
            return

        logger.info(f"Stopping deployment: {deployment_id}")
        result = await deployment_service.stop(deployment_id)
        await self._emit_status_update(
            deployment_id,
            result.get("status", "stopped"),
            result.get("message", "Container stopped"),
        )

    async def _handle_deploy_restart(self, data: Dict[str, Any]):
        """Handle deployment:restart from server."""
        deployment_id = data.get("deploymentId")
        if not deployment_id:
            logger.error("deployment:restart missing deploymentId")
            return

        logger.info(f"Restarting deployment: {deployment_id}")
        result = await deployment_service.restart(deployment_id)
        await self._emit_status_update(
            deployment_id,
            result.get("status", "running"),
            "Container restarted",
        )

    async def _handle_status_request(self, data: Dict[str, Any]):
        """Handle deployment:status_request from server."""
        deployment_id = data.get("deploymentId")
        if not deployment_id:
            return

        result = await deployment_service.get_status(deployment_id)
        await self._emit_status_update(
            deployment_id,
            result.get("status", "unknown"),
            "",
            **{k: v for k, v in result.items() if k not in ("deployment_id", "status")},
        )

    async def _handle_logs_request(self, data: Dict[str, Any]):
        """Handle deployment:logs_request from server."""
        deployment_id = data.get("deploymentId")
        tail = data.get("tail", 200)
        if not deployment_id:
            return

        result = await deployment_service.get_logs(deployment_id, tail=tail)
        payload = {
            "deploymentId": deployment_id,
            "logs": result.get("logs", ""),
            "lines": result.get("lines", 0),
            "agentId": settings.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.emit_to_server("deployment:logs_response", payload)


# Global instance
agent_deployment_namespace = AgentDeploymentNamespace()
