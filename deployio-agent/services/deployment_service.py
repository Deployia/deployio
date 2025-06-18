"""
Deployment Service - Manages container deployments and subdomain routing
"""

import docker
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from config.settings import settings
from services.mongodb_service import MongoDBService
from services.traefik_service import TraefikService

logger = logging.getLogger(__name__)


class DeploymentService:
    def __init__(self):
        self.docker_client = docker.from_env()
        self.mongodb_service = MongoDBService()
        self.traefik_service = TraefikService()

    async def create_deployment(
        self,
        image_url: str,
        subdomain: str,
        user_id: str,
        project_id: str,
        environment_vars: Dict[str, str] = None,
        port: int = 3000,
    ) -> Dict[str, Any]:
        """Create a new deployment"""
        try:
            # Initialize services
            await self.mongodb_service.connect()

            # Validate subdomain
            if not self._is_valid_subdomain(subdomain):
                raise ValueError(f"Invalid subdomain: {subdomain}")

            # Check if subdomain is available
            existing_deployments = (
                await self.mongodb_service.get_deployments_by_subdomain(subdomain)
            )
            active_deployments = [
                d
                for d in existing_deployments
                if d["status"] in ["running", "deploying"]
            ]
            if active_deployments:
                raise ValueError(f"Subdomain {subdomain} is already in use")

            # Create deployment record
            deployment_data = {
                "image_url": image_url,
                "subdomain": subdomain,
                "user_id": user_id,
                "project_id": project_id,
                "port": port,
                "status": "deploying",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "environment_vars": environment_vars or {},
            }

            deployment_id = await self.mongodb_service.create_deployment(
                deployment_data
            )
            logger.info(f"Created deployment record: {deployment_id}")

            # Start deployment in background
            asyncio.create_task(self._deploy_container(deployment_id, deployment_data))

            return {
                "deployment_id": deployment_id,
                "subdomain": subdomain,
                "status": "deploying",
                "message": "Deployment started successfully",
            }

        except Exception as e:
            logger.error(f"Failed to create deployment: {e}")
            raise

    async def _deploy_container(
        self, deployment_id: str, deployment_data: Dict[str, Any]
    ):
        """Deploy container (runs in background)"""
        try:
            await self.mongodb_service.update_deployment_status(
                deployment_id, "deploying", "Pulling image and starting container"
            )

            # Setup Atlas database connection for the app
            app_database_url = self._setup_atlas_database(
                deployment_data["user_id"], deployment_data["project_id"]
            )

            # Prepare environment variables for the container
            container_env = deployment_data.get("environment_vars", {}).copy()

            # Add MongoDB Atlas connection for the deployed app
            container_env["DATABASE_URL"] = app_database_url
            container_env["MONGODB_URI"] = (
                app_database_url  # Alternative name some apps use
            )

            # Add other common environment variables
            container_env["PORT"] = str(deployment_data["port"])
            container_env["NODE_ENV"] = "production"

            # Pull and run container
            container_name = f"app-{deployment_data['subdomain']}"

            # Pull image
            logger.info(f"Pulling image: {deployment_data['image_url']}")
            image = self.docker_client.images.pull(deployment_data["image_url"])

            # Stop existing container if it exists
            try:
                existing_container = self.docker_client.containers.get(container_name)
                existing_container.stop()
                existing_container.remove()
                logger.info(f"Removed existing container: {container_name}")
            except docker.errors.NotFound:
                pass

            # Create and start container
            container = self.docker_client.containers.run(
                image.id,
                name=container_name,
                environment=container_env,
                ports={f"{deployment_data['port']}/tcp": None},
                network=settings.docker_network,
                restart_policy={"Name": "unless-stopped"},
                mem_limit=settings.max_memory,
                cpu_period=100000,
                cpu_quota=int(25000),  # 0.25 CPU
                detach=True,
                labels={
                    "deployio.subdomain": deployment_data["subdomain"],
                    "deployio.user_id": deployment_data["user_id"],
                    "deployio.project_id": deployment_data["project_id"],
                    "deployio.deployment_id": deployment_id,
                },
            )

            logger.info(f"Started container: {container_name}")

            # Wait for container to be healthy
            await self._wait_for_container_health(container, deployment_id)

            # Get container network info
            container.reload()
            port_info = container.ports.get(f"{deployment_data['port']}/tcp")
            if not port_info:
                raise Exception("Container port not exposed")

            container_ip = container.attrs["NetworkSettings"]["Networks"][
                settings.docker_network
            ]["IPAddress"]

            # Create Traefik route
            await self.traefik_service.create_route(
                deployment_data["subdomain"], container_ip, deployment_data["port"]
            )

            # Update deployment status
            await self.mongodb_service.update_deployment_status(
                deployment_id, "running", "Deployment completed successfully"
            )

            logger.info(f"Deployment {deployment_id} completed successfully")

        except Exception as e:
            logger.error(f"Deployment {deployment_id} failed: {e}")
            await self.mongodb_service.update_deployment_status(
                deployment_id, "failed", str(e)
            )

    def _setup_atlas_database(self, user_id: str, project_id: str) -> str:
        """Setup Atlas database connection for the deployed app"""
        if not settings.database_url:
            raise ValueError("DATABASE_URL not configured for Atlas")

        # Generate unique database name for this deployment
        app_db_name = f"app_{user_id}_{project_id}".replace("-", "_")

        # Construct new connection string with the app-specific database
        app_database_url = settings.database_url.replace(
            f"/{settings.mongodb_database}?", f"/{app_db_name}?"
        )

        logger.info(f"Generated Atlas database URL for app: {app_db_name}")
        return app_database_url

    async def _wait_for_container_health(self, container, deployment_id: str):
        """Wait for container to become healthy"""
        max_wait = 300  # 5 minutes
        wait_interval = 5
        waited = 0

        while waited < max_wait:
            try:
                container.reload()
                if container.status == "running":
                    # Additional health check - try to connect to the port
                    await asyncio.sleep(10)  # Give app time to start
                    return

                if container.status in ["exited", "dead"]:
                    logs = container.logs().decode("utf-8")
                    raise Exception(f"Container failed to start. Logs: {logs[-1000:]}")

                await asyncio.sleep(wait_interval)
                waited += wait_interval

                # Update status
                await self.mongodb_service.update_deployment_status(
                    deployment_id,
                    "deploying",
                    f"Waiting for container to start... ({waited}s)",
                )

            except Exception as e:
                raise Exception(f"Container health check failed: {e}")

        raise Exception(f"Container failed to become healthy within {max_wait} seconds")

    async def get_deployment_status(
        self, deployment_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get deployment status"""
        try:
            await self.mongodb_service.connect()
            return await self.mongodb_service.get_deployment(deployment_id)
        except Exception as e:
            logger.error(f"Failed to get deployment status: {e}")
            return None

    async def stop_deployment(self, deployment_id: str) -> bool:
        """Stop a deployment"""
        try:
            await self.mongodb_service.connect()

            # Get deployment info
            deployment = await self.mongodb_service.get_deployment(deployment_id)
            if not deployment:
                return False

            # Stop and remove container
            container_name = f"app-{deployment['subdomain']}"
            try:
                container = self.docker_client.containers.get(container_name)
                container.stop()
                container.remove()
                logger.info(f"Stopped container: {container_name}")
            except docker.errors.NotFound:
                logger.warning(f"Container not found: {container_name}")

            # Remove Traefik route
            await self.traefik_service.remove_route(deployment["subdomain"])

            # Update deployment status
            await self.mongodb_service.update_deployment_status(
                deployment_id, "stopped", "Deployment stopped"
            )

            return True

        except Exception as e:
            logger.error(f"Failed to stop deployment: {e}")
            return False

    def _is_valid_subdomain(self, subdomain: str) -> bool:
        """Validate subdomain format"""
        import re

        # Reserved subdomains
        reserved = {"www", "api", "admin", "app", "agent", "traefik", "mail", "ftp"}

        if subdomain.lower() in reserved:
            return False

        # Check format (alphanumeric and hyphens, 3-63 chars)
        pattern = r"^[a-zA-Z0-9]([a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$"
        return bool(re.match(pattern, subdomain))

    async def list_user_deployments(self, user_id: str) -> List[Dict[str, Any]]:
        """List all deployments for a user"""
        try:
            await self.mongodb_service.connect()
            return await self.mongodb_service.get_deployments_by_user(user_id)
        except Exception as e:
            logger.error(f"Failed to list user deployments: {e}")
            return []


# Global singleton instance
deployment_service = DeploymentService()
