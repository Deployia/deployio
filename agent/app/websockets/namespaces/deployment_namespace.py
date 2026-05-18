"""
Agent Deployment Namespace — **all deployment-scoped Docker I/O**

How we find the container
-------------------------
`DeploymentService._resolve_container(deployment_id, container_id)` (see service docstring):
  1. Optional `containerId` from the platform (Mongo `runtime.containerId`) — full Docker id.
  2. Else literal name == `deployment_id` (legacy).
  3. Else prefixed name `deploy-{sanitized(dep_…)}` — how DeployIO names containers.

How logs reach the Analytics / Deployments UI
-----------------------------------------------
**One-shot** (e.g. manual refresh): server → `deployment_logs_request` → `_handle_logs_request`
→ `deployment:logs_response` → `deploymentOrchestrator.handleRuntimeLogsResponse`
→ Socket.IO room `deployment:{deploymentId}` → `deployment:runtime_log_update` events.

**Live tail** (realtime subscribe): server → `start_deployment_container_logs` → background loop here
→ `deployment_live_container_logs` (same payload shape as one-shot) → orchestrator
→ same room / same client events. Client `useDeploymentStream` + `ProjectAnalytics` / `ProjectDeployments`
listen on `/logs` with `deployment:subscribe` { deploymentId, realtime: true }.

Build / pipeline logs use `deployment:build_log` + `deployment:status_update` (separate from container stdout).
"""

import asyncio
import logging
from typing import Any, Dict, Optional
from datetime import datetime

from app.websockets.namespaces.base import BaseAgentNamespace
from app.services.deployment_service import deployment_service
from app.services.build_service import BuildService
from app.core.config import settings

logger = logging.getLogger(__name__)

_DOCKER_STATUS_MAP = {
    "running": "running",
    "created": "deploying",
    "restarting": "deploying",
    "removing": "stopping",
    "paused": "stopped",
    "exited": "stopped",
    "dead": "failed",
    "not_found": "stopped",
}


def _normalize_runtime_status(raw: Optional[str]) -> str:
    if not raw or not isinstance(raw, str):
        return "deploying"
    s = raw.lower().strip()
    platform = {
        "pending",
        "queued",
        "cloning",
        "detecting",
        "building",
        "deploying",
        "running",
        "stopping",
        "failed",
        "stopped",
        "cancelled",
        "deleted",
        "error",
    }
    if s in platform:
        return s
    return _DOCKER_STATUS_MAP.get(s, "deploying")


class AgentDeploymentNamespace(BaseAgentNamespace):
    def __init__(self):
        super().__init__("/agent-bridge")
        self._streaming = False
        self._live_container_log_tasks: Dict[str, asyncio.Task] = {}

    async def _register_event_handlers(self):
        self.event_handlers = {
            "deployment:trigger": self._handle_deploy_trigger,
            "deployment:stop": self._handle_deploy_stop,
            "deployment:restart": self._handle_deploy_restart,
            "deployment:status_request": self._handle_status_request,
            "deployment:logs_request": self._handle_logs_request,
            "deployment:metrics_request": self._handle_metrics_request,
            "start_deployment_container_logs": self._handle_start_deployment_container_logs,
            "stop_deployment_container_logs": self._handle_stop_deployment_container_logs,
        }

    async def _on_connected(self):
        logger.info("Deployment namespace connected — deployment + runtime log streaming")

    async def start_streaming(self):
        self._streaming = True
        logger.debug("Deployment namespace streaming enabled")

    async def stop_streaming(self):
        self._streaming = False
        logger.debug("Deployment namespace streaming disabled")

    async def cleanup(self):
        for dep_id in list(self._live_container_log_tasks.keys()):
            await self._stop_live_container_logs(dep_id)
        await super().cleanup()

    async def _emit_status_update(
        self,
        deployment_id: str,
        status: str,
        message: str = "",
        **extra,
    ):
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
        payload = {
            "deploymentId": deployment_id,
            "level": level,
            "message": message,
            "agentId": settings.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.emit_to_server("deployment:build_log", payload)

    async def _handle_deploy_trigger(self, data: Dict[str, Any]):
        deployment_id = data.get("deploymentId")
        image = data.get("image")
        subdomain = data.get("subdomain")
        port = data.get("port", 3000)
        env_vars = data.get("envVars") or {}

        if not deployment_id or not subdomain:
            logger.error(f"deployment:trigger missing required fields: {data}")
            await self._emit_status_update(
                deployment_id or "unknown",
                "failed",
                "Missing required fields (deploymentId, subdomain)",
            )
            return

        env_keys = sorted((env_vars or {}).keys())
        logger.info(
            "Received deployment trigger: %s image=%s repo=%s branch=%s subdomain=%s port=%s env_keys=%s",
            deployment_id,
            image,
            data.get("repoUrl"),
            data.get("branch"),
            subdomain,
            port,
            env_keys[:25],
        )

        async def status_cb(dep_id, status, message, **kwargs):
            await self._emit_status_update(dep_id, status, message, **kwargs)

        async def log_cb(dep_id, level, message):
            await self._emit_build_log(dep_id, level, message)

        branch_name = data.get("branch") or "main"
        commit_sha = data.get("commitSha") or data.get("commit_sha")
        dockerfile_path = data.get("dockerfilePath") or "Dockerfile"
        repo_url = data.get("repoUrl")
        build_if_missing = data.get("buildIfMissing", True)

        if not image and build_if_missing and not repo_url:
            await self._emit_status_update(
                deployment_id,
                "failed",
                "Missing repository URL for build",
            )
            return

        if image:
            result = await deployment_service.deploy(
                deployment_id=deployment_id,
                image=image,
                subdomain=subdomain,
                port=port,
                env_vars=env_vars,
                status_callback=status_cb,
                log_callback=log_cb,
            )
        else:
            try:
                build_service = BuildService()
                result = await build_service.build_and_deploy(
                    git_url=repo_url,
                    github_token=data.get("gitToken")
                    or data.get("githubToken"),
                    branch=branch_name,
                    commit_sha=commit_sha,
                    subdomain=subdomain,
                    logs_callback=log_cb,
                    deployment_id=deployment_id,
                    status_callback=status_cb,
                    env_vars=env_vars,
                    dockerfile_path=dockerfile_path,
                )
            except Exception as e:
                logger.error(f"Agent build_and_deploy failed: {e}")
                result = {"status": "failed", "error": str(e)}

        final_status = result.get("status", "unknown")
        if final_status == "error":
            final_status = "failed"
        # Pipeline callbacks already emit terminal "running"; only re-emit failures
        # to avoid duplicate success notifications and DB races.
        if final_status != "running":
            await self._emit_status_update(
                deployment_id,
                final_status,
                result.get("error", f"Deployment {final_status}"),
                container_id=result.get("container_id"),
                url=result.get("url"),
            )

    async def _handle_deploy_stop(self, data: Dict[str, Any]):
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
        deployment_id = data.get("deploymentId")
        container_id = data.get("containerId")
        if not deployment_id:
            return

        result = await deployment_service.get_status(deployment_id, container_id=container_id)
        raw_status = result.get("status", "unknown")
        # No container yet during clone/build — do not report as "stopped".
        if raw_status in ("not_found", "unknown"):
            return
        mapped = _normalize_runtime_status(raw_status)
        await self._emit_status_update(
            deployment_id,
            mapped,
            "",
            **{k: v for k, v in result.items() if k not in ("deployment_id", "status")},
        )

    async def _handle_logs_request(self, data: Dict[str, Any]):
        deployment_id = data.get("deploymentId")
        container_id = data.get("containerId")
        tail = data.get("tail", 200)
        if not deployment_id:
            return

        result = await deployment_service.get_logs(
            deployment_id, tail=tail, container_id=container_id
        )
        payload = {
            "deploymentId": deployment_id,
            "logs": result.get("logs", ""),
            "lines": result.get("lines", 0),
            "error": result.get("error"),
            "agentId": settings.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.emit_to_server("deployment:logs_response", payload)

    async def _handle_metrics_request(self, data: Dict[str, Any]):
        deployment_id = data.get("deploymentId")
        container_id = data.get("containerId")
        if not deployment_id:
            return

        result = await deployment_service.get_metrics(
            deployment_id, container_id=container_id
        )
        payload = {
            "deploymentId": deployment_id,
            "metrics": result.get("metrics", {}),
            "containerId": result.get("container_id"),
            "error": result.get("error"),
            "agentId": settings.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.emit_to_server("deployment:metrics", payload)

    async def _handle_start_deployment_container_logs(self, data: Dict[str, Any]):
        deployment_id = data.get("deploymentId")
        if not deployment_id:
            logger.warning("start_deployment_container_logs missing deploymentId")
            return
        await self._start_live_container_logs(
            deployment_id,
            data.get("containerId"),
            int(data.get("tail") or 200),
            float(data.get("intervalMs") or 2500) / 1000.0,
        )

    async def _handle_stop_deployment_container_logs(self, data: Dict[str, Any]):
        deployment_id = data.get("deploymentId")
        if deployment_id:
            await self._stop_live_container_logs(deployment_id)

    async def _start_live_container_logs(
        self,
        deployment_id: str,
        container_id: Optional[str],
        tail: int,
        interval_sec: float,
    ) -> None:
        if deployment_id in self._live_container_log_tasks:
            t = self._live_container_log_tasks[deployment_id]
            if t and not t.done():
                logger.debug("Live container log stream already running: %s", deployment_id)
                return

        async def loop():
            logger.info(
                "Live container log stream started dep=%s interval=%ss",
                deployment_id,
                interval_sec,
            )
            missing_streak = 0

            def _is_container_missing(err: Optional[str]) -> bool:
                if not err:
                    return False
                e = err.lower()
                return "not found" in e or "no such container" in e

            try:
                while True:
                    try:
                        result = await deployment_service.get_logs(
                            deployment_id,
                            tail=tail,
                            container_id=container_id,
                        )
                        err = result.get("error")
                        if _is_container_missing(err):
                            missing_streak += 1
                            await self.emit_to_server(
                                "deployment_live_container_logs",
                                {
                                    "deploymentId": deployment_id,
                                    "logs": result.get("logs") or "",
                                    "error": err,
                                    "agentId": settings.agent_id,
                                    "timestamp": datetime.utcnow().isoformat(),
                                },
                            )
                            if missing_streak >= 2:
                                logger.info(
                                    "Stopping live container log stream (no container): %s",
                                    deployment_id,
                                )
                                break
                        else:
                            missing_streak = 0
                            await self.emit_to_server(
                                "deployment_live_container_logs",
                                {
                                    "deploymentId": deployment_id,
                                    "logs": result.get("logs") or "",
                                    "error": err,
                                    "agentId": settings.agent_id,
                                    "timestamp": datetime.utcnow().isoformat(),
                                },
                            )
                    except asyncio.CancelledError:
                        logger.info(
                            "Live container log stream cancelled: %s", deployment_id
                        )
                        raise
                    except Exception as e:
                        logger.warning(
                            "Live container log tick failed %s: %s", deployment_id, e
                        )
                        try:
                            await self.emit_to_server(
                                "deployment_live_container_logs",
                                {
                                    "deploymentId": deployment_id,
                                    "logs": "",
                                    "error": str(e),
                                    "agentId": settings.agent_id,
                                    "timestamp": datetime.utcnow().isoformat(),
                                },
                            )
                        except Exception:
                            pass
                    await asyncio.sleep(max(1.0, interval_sec))
            finally:
                self._live_container_log_tasks.pop(deployment_id, None)

        self._live_container_log_tasks[deployment_id] = asyncio.create_task(loop())

    async def _stop_live_container_logs(self, deployment_id: str) -> None:
        task = self._live_container_log_tasks.pop(deployment_id, None)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("Live container log stream stopped: %s", deployment_id)


agent_deployment_namespace = AgentDeploymentNamespace()
