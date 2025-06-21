"""
Deployment Routes - API endpoints for container deployment management
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from services.deployment_service import deployment_service
from services.traefik_service import traefik_service
from services.mongodb_service import mongodb_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/deployments", tags=["deployments"])


# Request models
class DeploymentRequest(BaseModel):
    project_id: str
    subdomain: str
    images: Dict[str, str]  # {"frontend": "ecr-url", "backend": "ecr-url"}
    environment: Optional[Dict[str, str]] = {}


class DeploymentResponse(BaseModel):
    status: str
    message: str
    deployment_id: Optional[str] = None
    subdomain: Optional[str] = None
    url: Optional[str] = None


# Deployment endpoints
@router.post("/", response_model=DeploymentResponse)
async def create_deployment(request: DeploymentRequest):
    """Deploy a new MERN application"""
    try:
        result = await deployment_service.deploy_application(
            {
                "project_id": request.project_id,
                "subdomain": request.subdomain,
                "images": request.images,
                "environment": request.environment,
            }
        )

        if result["status"] == "success":
            return DeploymentResponse(
                status="success",
                message="Deployment created successfully",
                deployment_id=result["deployment_id"],
                subdomain=result["subdomain"],
                url=result["url"],
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"Deployment creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{deployment_id}")
async def get_deployment(deployment_id: str):
    """Get deployment details"""
    try:
        deployment = await mongodb_service.get_deployment(deployment_id)
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        return deployment

    except Exception as e:
        logger.error(f"Failed to get deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_deployments(status: Optional[str] = None):
    """List all deployments"""
    try:
        deployments = await mongodb_service.get_all_deployments(status)
        return {"deployments": deployments}

    except Exception as e:
        logger.error(f"Failed to list deployments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{deployment_id}/start")
async def start_deployment(deployment_id: str):
    """Start a stopped deployment"""
    try:
        # Get deployment info
        deployment = await mongodb_service.get_deployment(deployment_id)
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # Start containers
        containers = deployment_service.docker_client.containers.list(
            all=True, filters={"label": f"deployio.deployment_id={deployment_id}"}
        )

        for container in containers:
            if container.status != "running":
                container.start()

        # Recreate Traefik route
        await traefik_service.create_app_route(
            deployment["subdomain"], f"{deployment['subdomain']}-frontend", 3000
        )

        # Update status
        await mongodb_service.update_deployment_status(
            deployment_id, "running", "Deployment started"
        )

        return {"status": "success", "message": "Deployment started"}

    except Exception as e:
        logger.error(f"Failed to start deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{deployment_id}/stop")
async def stop_deployment(deployment_id: str):
    """Stop a running deployment"""
    try:
        result = await deployment_service.stop_deployment(deployment_id)

        if result["status"] == "success":
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"Failed to stop deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{deployment_id}/restart")
async def restart_deployment(deployment_id: str):
    """Restart a deployment"""
    try:
        # Stop first
        await stop_deployment(deployment_id)

        # Wait a moment
        import asyncio

        await asyncio.sleep(2)

        # Start again
        await start_deployment(deployment_id)

        return {"status": "success", "message": "Deployment restarted"}

    except Exception as e:
        logger.error(f"Failed to restart deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{deployment_id}")
async def delete_deployment(deployment_id: str):
    """Delete a deployment completely"""
    try:
        result = await deployment_service.delete_deployment(deployment_id)

        if result["status"] == "success":
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"Failed to delete deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{deployment_id}/logs")
async def get_deployment_logs(deployment_id: str):
    """Get deployment logs"""
    try:
        result = await deployment_service.get_deployment_logs(deployment_id)

        if result["status"] == "success":
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"Failed to get deployment logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{deployment_id}/status")
async def get_deployment_status(deployment_id: str):
    """Get deployment status and health"""
    try:
        deployment = await mongodb_service.get_deployment(deployment_id)
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # Get container status
        containers = deployment_service.docker_client.containers.list(
            all=True, filters={"label": f"deployio.deployment_id={deployment_id}"}
        )

        container_status = []
        for container in containers:
            container_status.append(
                {
                    "name": container.name,
                    "status": container.status,
                    "image": (
                        container.image.tags[0] if container.image.tags else "unknown"
                    ),
                }
            )

        return {
            "deployment": deployment,
            "containers": container_status,
            "url": f"https://{deployment['subdomain']}.deployio.tech",
        }

    except Exception as e:
        logger.error(f"Failed to get deployment status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Subdomain management
@router.get("/subdomains/available/{subdomain}")
async def check_subdomain_availability(subdomain: str):
    """Check if a subdomain is available"""
    try:
        available = await traefik_service.is_subdomain_available(subdomain)
        return {"subdomain": subdomain, "available": available}

    except Exception as e:
        logger.error(f"Failed to check subdomain availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subdomains/routes")
async def get_app_routes():
    """Get all application routes"""
    try:
        routes = await traefik_service.get_app_routes()
        return {"routes": routes}

    except Exception as e:
        logger.error(f"Failed to get app routes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Statistics
@router.get("/stats")
async def get_deployment_stats():
    """Get deployment statistics"""
    try:
        stats = await mongodb_service.get_deployment_stats()
        return {"stats": stats}

    except Exception as e:
        logger.error(f"Failed to get deployment stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
