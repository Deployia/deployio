"""
Deployment Service for DeployIO Agent
Handles Docker container lifecycle: pull, run, stop, restart, remove, logs.
Configures Traefik labels for automatic subdomain routing with SSL.
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

import docker
from docker.errors import (
    ContainerError,
    ImageNotFound,
    APIError,
    NotFound,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

# Container name prefix for deployio-managed containers
CONTAINER_PREFIX = "deploy-"


class DeploymentService:
    """
    Manages the full container lifecycle for deployed applications.
    Uses Docker SDK via the mounted socket to create, manage, and remove
    containers with Traefik labels for automatic routing.
    """

    def __init__(self):
        self.client: Optional[docker.DockerClient] = None
        self.active_deployments: Dict[str, Dict[str, Any]] = {}
        self.max_concurrent = settings.max_concurrent_deployments
        self.deployment_timeout = settings.deployment_timeout
        self.docker_network = settings.docker_network
        self.base_domain = settings.base_domain or "deployio.tech"

    def _get_client(self) -> docker.DockerClient:
        """Get or create Docker client."""
        if self.client is None:
            self.client = docker.from_env()
        return self.client

    def _container_name(self, deployment_id: str) -> str:
        """Generate container name from deployment ID."""
        # Sanitize — Docker container names must match [a-zA-Z0-9][a-zA-Z0-9_.-]
        safe_id = deployment_id.replace("dep_", "").replace("_", "-")[:40]
        return f"{CONTAINER_PREFIX}{safe_id}"

    def _resolve_container(self, deployment_id: str, container_id: Optional[str] = None):
        """
        Resolve the Docker container for a platform deployment.

        Order (first match wins):
        1. ``container_id`` — full Docker id when the platform stored it
           (e.g. Mongo ``runtime.containerId`` from inspect).
        2. Literal name ``deployment_id`` — legacy / human-named containers.
        3. Prefixed name ``deploy-{sanitized_id}`` — default naming from
           :meth:`_container_name`.

        Returns ``(container, resolved_name)``. Used by ``get_logs``,
        ``get_metrics``, ``get_status``, stop/restart, etc.
        """
        client = self._get_client()
        # 0) Try explicit container id first when provided by platform
        if container_id:
            try:
                c = client.containers.get(container_id)
                return c, c.name
            except NotFound:
                pass
        # 1) Try literal container name
        try:
            c = client.containers.get(deployment_id)
            return c, deployment_id
        except NotFound:
            pass
        # 2) Try the deploy-prefixed name
        prefixed = self._container_name(deployment_id)
        c = client.containers.get(prefixed)  # may raise NotFound
        return c, prefixed

    def _build_traefik_labels(
        self, deployment_id: str, subdomain: str, port: int
    ) -> Dict[str, str]:
        """
        Generate Traefik Docker labels for automatic routing.
        Priority 5 to beat the landing page catch-all (priority 1).
        """
        router_name = deployment_id.replace("_", "-")
        domain = f"{subdomain}.{self.base_domain}"

        return {
            "traefik.enable": "true",
            # Root traefik is behind nginx TLS; route on internal web entrypoint.
            f"traefik.http.routers.{router_name}.rule": f"Host(`{domain}`)",
            f"traefik.http.routers.{router_name}.entrypoints": "web",
            f"traefik.http.routers.{router_name}.priority": "5",
            "traefik.docker.network": self.docker_network,
            # Service (load balancer)
            f"traefik.http.services.{router_name}.loadbalancer.server.port": str(
                port
            ),
            # Metadata
            "deployio.managed": "true",
            "deployio.deployment_id": deployment_id,
            "deployio.subdomain": subdomain,
        }

    def _resolve_runtime_port(
        self, client: docker.DockerClient, image: str, fallback_port: int
    ) -> int:
        """
        Prefer the first EXPOSEd container port from image metadata.
        Falls back to provided port when metadata is unavailable.
        """
        try:
            img = client.images.get(image)
            exposed = (img.attrs.get("Config") or {}).get("ExposedPorts") or {}
            if not exposed:
                return fallback_port

            first = next(iter(exposed.keys()), "")
            maybe_port = int(str(first).split("/")[0])
            if maybe_port > 0:
                return maybe_port
        except Exception as e:
            logger.debug(f"Unable to resolve runtime port from image {image}: {e}")

        return fallback_port

    async def deploy(
        self,
        deployment_id: str,
        image: str,
        subdomain: str,
        port: int = 3000,
        env_vars: Optional[Dict[str, str]] = None,
        status_callback=None,
        log_callback=None,
    ) -> Dict[str, Any]:
        """
        Deploy a Docker container with Traefik routing.

        Args:
            deployment_id: Unique deployment identifier (e.g., dep_abc123)
            image: Docker image name (e.g., deployio-mern-example:latest)
            subdomain: Subdomain for routing (e.g., deployio-mern-app-production)
            port: Container port to expose (default: 3000)
            env_vars: Environment variables to inject
            status_callback: async fn(deployment_id, status, message) for status updates
            log_callback: async fn(deployment_id, level, message) for build logs

        Returns:
            Dict with container_id, status, url, etc.
        """
        container_name = self._container_name(deployment_id)

        async def _log(level: str, message: str):
            logger.log(getattr(logging, level.upper(), logging.INFO), message)
            if log_callback:
                try:
                    await log_callback(deployment_id, level, message)
                except Exception as e:
                    logger.error(f"Log callback error: {e}")

        async def _status(status: str, message: str = "", **kwargs):
            if status_callback:
                try:
                    await status_callback(deployment_id, status, message, **kwargs)
                except Exception as e:
                    logger.error(f"Status callback error: {e}")

        try:
            # Check concurrent deployments limit
            running_count = len(
                [d for d in self.active_deployments.values() if d.get("status") == "running"]
            )
            if running_count >= self.max_concurrent:
                await _log("error", f"Max concurrent deployments ({self.max_concurrent}) reached")
                await _status("failed", f"Max concurrent deployments limit reached ({self.max_concurrent})")
                return {"status": "failed", "error": "Max concurrent deployments reached"}

            client = self._get_client()

            # --- Phase 1: Building ---
            await _status("building", "Starting deployment process...")
            await _log("info", f"🔧 Starting deployment: {deployment_id}")
            await _log("info", f"📦 Image: {image}")
            await _log("info", f"🌐 Subdomain: {subdomain}.{self.base_domain}")

            # Remove existing container if any
            try:
                existing = client.containers.get(container_name)
                await _log("info", f"Removing existing container: {container_name}")
                existing.stop(timeout=10)
                existing.remove(force=True)
                await _log("info", "Previous container removed")
            except NotFound:
                pass
            except Exception as e:
                await _log("warning", f"Error removing old container: {e}")

            # Pull / verify image
            await _log("info", f"Checking Docker image: {image}")
            try:
                client.images.get(image)
                await _log("info", f"✅ Image found locally: {image}")
            except ImageNotFound:
                await _log("info", f"Pulling image: {image} ...")
                try:
                    client.images.pull(image)
                    await _log("info", f"✅ Image pulled successfully: {image}")
                except Exception as pull_err:
                    await _log("error", f"Failed to pull image: {pull_err}")
                    await _status("failed", f"Image not found: {image}")
                    return {"status": "failed", "error": f"Image not found: {image}"}

            # --- Phase 2: Deploying ---
            await _status("deploying", "Starting container...")
            await _log("info", "Generating Traefik labels for routing...")

            runtime_port = self._resolve_runtime_port(client, image, port)
            labels = self._build_traefik_labels(
                deployment_id, subdomain, runtime_port
            )
            environment = env_vars or {}

            await _log("info", f"Container name: {container_name}")
            await _log("info", f"Network: {self.docker_network}")
            await _log("info", f"Port: {runtime_port}")
            await _log("info", f"Memory limit: {settings.max_memory}")
            await _log("info", f"CPU limit: {settings.max_cpu}")

            # Ensure network exists
            try:
                client.networks.get(self.docker_network)
            except NotFound:
                await _log("info", f"Creating network: {self.docker_network}")
                client.networks.create(self.docker_network, driver="bridge")

            run_kwargs = {
                "image": image,
                "name": container_name,
                "detach": True,
                "labels": labels,
                "environment": environment,
                "network": self.docker_network,
                "mem_limit": settings.max_memory,
                # cpu_quota is in microseconds per cpu_period (100000 = 1 CPU)
                # 0.25 CPU = 25000 microseconds
                "cpu_quota": int(float(settings.max_cpu) * 100000),
                "restart_policy": {"Name": "unless-stopped"},
            }

            if settings.enable_container_healthcheck:
                # Optional. Some app images fail generic checks and get
                # filtered out by Traefik as unhealthy.
                run_kwargs["healthcheck"] = {
                    "Test": [
                        "CMD-SHELL",
                        (
                            f"wget -qO- http://127.0.0.1:{runtime_port}/health "
                            f"|| wget -qO- http://127.0.0.1:{runtime_port}/api/health "
                            f"|| wget -qO- http://127.0.0.1:{runtime_port}/ "
                            "|| exit 1"
                        ),
                    ],
                    "Interval": 30_000_000_000,  # 30s in nanoseconds
                    "Timeout": 5_000_000_000,
                    "Retries": 3,
                    "StartPeriod": 15_000_000_000,
                }

            # Run the container
            await _log("info", "🚀 Starting container...")
            container = client.containers.run(**run_kwargs)

            container_id = container.id[:12]
            full_url = f"https://{subdomain}.{self.base_domain}"

            await _log("info", f"✅ Container started: {container_id}")
            await _log("info", f"🌐 URL: {full_url}")

            # Wait briefly and verify container is running
            await asyncio.sleep(3)
            container.reload()
            container_status = container.status

            if container_status == "running":
                await _log("info", f"✅ Container is running (status: {container_status})")
                await _status(
                    "running",
                    "Deployment successful!",
                    container_id=container_id,
                    url=full_url,
                )

                # Track active deployment
                self.active_deployments[deployment_id] = {
                    "container_id": container_id,
                    "container_name": container_name,
                    "image": image,
                    "subdomain": subdomain,
                    "port": port,
                    "runtime_port": runtime_port,
                    "url": full_url,
                    "status": "running",
                    "started_at": datetime.utcnow().isoformat(),
                }

                return {
                    "status": "running",
                    "container_id": container_id,
                    "container_name": container_name,
                    "url": full_url,
                    "subdomain": subdomain,
                    "port": runtime_port,
                }
            else:
                # Container started but isn't running — check logs
                try:
                    logs = container.logs(tail=50).decode("utf-8", errors="replace")
                    await _log("error", f"Container exited with status: {container_status}")
                    await _log("error", f"Last logs:\n{logs}")
                except Exception:
                    pass
                await _status("failed", f"Container exited with status: {container_status}")
                return {"status": "failed", "error": f"Container status: {container_status}"}

        except ContainerError as e:
            error_msg = f"Container error: {e}"
            await _log("error", error_msg)
            await _status("failed", error_msg)
            return {"status": "failed", "error": error_msg}
        except APIError as e:
            error_msg = f"Docker API error: {e}"
            await _log("error", error_msg)
            await _status("failed", error_msg)
            return {"status": "failed", "error": error_msg}
        except Exception as e:
            error_msg = f"Unexpected deployment error: {e}"
            await _log("error", error_msg)
            await _status("failed", error_msg)
            return {"status": "failed", "error": error_msg}

    async def stop(self, deployment_id: str) -> Dict[str, Any]:
        """Stop a deployed container. Does NOT remove compose-managed containers."""
        try:
            client = self._get_client()
            container, container_name = self._resolve_container(deployment_id)
            container.stop(timeout=15)

            # Only remove non-compose containers (those with the deploy- prefix)
            if container_name.startswith(CONTAINER_PREFIX):
                container.remove()

            # Remove from active tracking
            self.active_deployments.pop(deployment_id, None)

            logger.info(f"Container stopped: {container_name}")
            return {"status": "stopped", "container_name": container_name}
        except NotFound:
            self.active_deployments.pop(deployment_id, None)
            return {"status": "stopped", "message": "Container not found (already removed)"}
        except Exception as e:
            logger.error(f"Error stopping container {deployment_id}: {e}")
            return {"status": "error", "error": str(e)}

    async def start(self, deployment_id: str) -> Dict[str, Any]:
        """Start a stopped container (compose-managed or previously stopped)."""
        try:
            client = self._get_client()
            container, container_name = self._resolve_container(deployment_id)
            container.start()

            # Wait briefly and verify
            await asyncio.sleep(2)
            container.reload()

            logger.info(f"Container started: {container_name} ({container.status})")
            return {"status": container.status, "container_name": container_name}
        except NotFound:
            return {"status": "not_found", "error": f"Container not found: {deployment_id}"}
        except Exception as e:
            logger.error(f"Error starting container {deployment_id}: {e}")
            return {"status": "error", "error": str(e)}

    async def restart(self, deployment_id: str) -> Dict[str, Any]:
        """Restart a deployed container."""
        try:
            client = self._get_client()
            container, container_name = self._resolve_container(deployment_id)
            container.restart(timeout=15)

            # Update tracking
            if deployment_id in self.active_deployments:
                self.active_deployments[deployment_id]["status"] = "running"

            logger.info(f"Container restarted: {container_name}")
            return {"status": "running", "container_name": container_name}
        except NotFound:
            return {"status": "error", "error": f"Container not found: {deployment_id}"}
        except Exception as e:
            logger.error(f"Error restarting container {deployment_id}: {e}")
            return {"status": "error", "error": str(e)}

    async def get_status(
        self, deployment_id: str, container_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get status of a deployed container."""
        try:
            client = self._get_client()
            container, container_name = self._resolve_container(deployment_id, container_id)
            container.reload()

            info = {
                "deployment_id": deployment_id,
                "container_id": container.id[:12],
                "container_name": container_name,
                "status": container.status,
                "image": container.image.tags[0] if container.image.tags else "unknown",
                "created": container.attrs.get("Created", ""),
                "started_at": container.attrs.get("State", {}).get("StartedAt", ""),
            }

            # Get health if available
            health = container.attrs.get("State", {}).get("Health", {})
            if health:
                info["health"] = {
                    "status": health.get("Status", "unknown"),
                    "failing_streak": health.get("FailingStreak", 0),
                }

            return info
        except NotFound:
            return {
                "deployment_id": deployment_id,
                "status": "not_found",
                "container_name": deployment_id,
            }
        except Exception as e:
            return {
                "deployment_id": deployment_id,
                "status": "error",
                "error": str(e),
            }

    async def get_logs(
        self, deployment_id: str, tail: int = 200, container_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get container logs."""
        try:
            client = self._get_client()
            container, container_name = self._resolve_container(deployment_id, container_id)
            logs = container.logs(tail=tail, timestamps=True).decode(
                "utf-8", errors="replace"
            )
            return {
                "deployment_id": deployment_id,
                "logs": logs,
                "lines": len(logs.splitlines()),
            }
        except NotFound:
            return {"deployment_id": deployment_id, "logs": "", "error": "Container not found"}
        except Exception as e:
            return {"deployment_id": deployment_id, "logs": "", "error": str(e)}

    async def get_metrics(
        self, deployment_id: str, container_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get one-shot runtime metrics for a deployment container."""
        try:
            client = self._get_client()
            container, container_name = self._resolve_container(deployment_id, container_id)
            container.reload()
            stats = container.stats(stream=False) or {}

            cpu_total = (
                (((stats.get("cpu_stats") or {}).get("cpu_usage") or {}).get("total_usage"))
                or 0
            )
            precpu_total = (
                (((stats.get("precpu_stats") or {}).get("cpu_usage") or {}).get("total_usage"))
                or 0
            )
            cpu_delta = cpu_total - precpu_total
            system_delta = (
                ((stats.get("cpu_stats") or {}).get("system_cpu_usage") or 0)
                - ((stats.get("precpu_stats") or {}).get("system_cpu_usage") or 0)
            )
            online_cpus = (
                (stats.get("cpu_stats") or {}).get("online_cpus")
                or len((((stats.get("cpu_stats") or {}).get("cpu_usage") or {}).get("percpu_usage")) or [])
                or 1
            )
            cpu_percent = (
                (cpu_delta / system_delta) * online_cpus * 100.0 if system_delta > 0 else 0.0
            )

            memory_usage = ((stats.get("memory_stats") or {}).get("usage")) or 0
            memory_limit = ((stats.get("memory_stats") or {}).get("limit")) or 0
            memory_percent = (
                (memory_usage / memory_limit) * 100.0 if memory_limit > 0 else 0.0
            )

            started_at = (container.attrs.get("State") or {}).get("StartedAt")
            uptime_seconds = 0
            if started_at and started_at != "0001-01-01T00:00:00Z":
                normalized = started_at.replace("Z", "+00:00")
                started = datetime.fromisoformat(normalized)
                uptime_seconds = max(
                    0, int((datetime.utcnow() - started.replace(tzinfo=None)).total_seconds())
                )

            return {
                "deployment_id": deployment_id,
                "container_id": container.id[:12],
                "container_name": container_name,
                "metrics": {
                    "cpu": {
                        "usagePercent": round(cpu_percent, 2),
                        "usage": round(cpu_percent, 2),
                    },
                    "memory": {
                        "usageBytes": memory_usage,
                        "limitBytes": memory_limit,
                        "usagePercent": round(memory_percent, 2),
                        "usage": round(memory_percent, 2),
                    },
                    "uptime": {
                        "seconds": uptime_seconds,
                        "percentage": 100,
                    },
                    "resources": {
                        "cpu": {"usagePercent": round(cpu_percent, 2)},
                        "memory": {"usagePercent": round(memory_percent, 2)},
                    },
                },
            }
        except NotFound:
            return {
                "deployment_id": deployment_id,
                "metrics": {
                    "unavailable": True,
                    "reason": "container_not_found",
                    "cpu": {"usagePercent": 0, "usage": 0},
                    "memory": {
                        "usageBytes": 0,
                        "limitBytes": 0,
                        "usagePercent": 0,
                        "usage": 0,
                    },
                    "uptime": {"seconds": 0, "percentage": 0},
                    "resources": {
                        "cpu": {"usagePercent": 0},
                        "memory": {"usagePercent": 0},
                    },
                },
                "error": "Container not found",
            }
        except Exception as e:
            return {"deployment_id": deployment_id, "metrics": {}, "error": str(e)}

    async def list_deployments(self) -> List[Dict[str, Any]]:
        """List all deployio-managed containers."""
        try:
            client = self._get_client()
            containers = client.containers.list(
                all=True,
                filters={"label": "deployio.managed=true"},
            )

            result = []
            for container in containers:
                labels = container.labels
                result.append({
                    "deployment_id": labels.get("deployio.deployment_id", "unknown"),
                    "subdomain": labels.get("deployio.subdomain", "unknown"),
                    "container_id": container.id[:12],
                    "container_name": container.name,
                    "status": container.status,
                    "image": container.image.tags[0] if container.image.tags else "unknown",
                })

            return result
        except Exception as e:
            logger.error(f"Error listing deployments: {e}")
            return []

    async def cleanup(self):
        """Cleanup resources."""
        self.active_deployments.clear()
        if self.client:
            try:
                self.client.close()
            except Exception:
                pass
            self.client = None


# Global instance
deployment_service = DeploymentService()
