"""
Deployment management routes for DeployIO Agent.
REST endpoints to trigger, stop, restart deployments and query status.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from app.core.logging import get_logger
from app.services.deployment_service import deployment_service

router = APIRouter()
logger = get_logger("deploy-routes")


# --- Request / Response Models ---

class DeployRequest(BaseModel):
    """Request to deploy a container."""
    deployment_id: str = Field(..., description="Unique deployment identifier")
    image: str = Field(..., description="Docker image to deploy")
    subdomain: str = Field(..., description="Subdomain for routing")
    port: int = Field(default=3000, description="Container port")
    env_vars: Optional[Dict[str, str]] = Field(default=None, description="Environment variables")


class StopRequest(BaseModel):
    """Request to stop a deployment."""
    deployment_id: str


class RestartRequest(BaseModel):
    """Request to restart a deployment."""
    deployment_id: str


class DeployResponse(BaseModel):
    """Deployment operation response."""
    status: str
    deployment_id: str
    message: str = ""
    data: Optional[Dict[str, Any]] = None


# --- Routes ---

@router.post("/deploy", response_model=DeployResponse)
async def trigger_deploy(req: DeployRequest):
    """
    Trigger a new deployment.
    Creates a Docker container with Traefik labels for automatic routing.
    """
    logger.info(f"Deploy request received: {req.deployment_id} image={req.image} subdomain={req.subdomain}")

    result = await deployment_service.deploy(
        deployment_id=req.deployment_id,
        image=req.image,
        subdomain=req.subdomain,
        port=req.port,
        env_vars=req.env_vars,
    )

    status = result.get("status", "unknown")
    if status == "failed":
        return DeployResponse(
            status="failed",
            deployment_id=req.deployment_id,
            message=result.get("error", "Deployment failed"),
            data=result,
        )

    return DeployResponse(
        status=status,
        deployment_id=req.deployment_id,
        message=f"Container is {status}",
        data=result,
    )


@router.post("/stop", response_model=DeployResponse)
async def stop_deployment(req: StopRequest):
    """Stop and remove a deployed container."""
    logger.info(f"Stop request received: {req.deployment_id}")

    result = await deployment_service.stop(req.deployment_id)

    return DeployResponse(
        status=result.get("status", "unknown"),
        deployment_id=req.deployment_id,
        message=result.get("message", "Container stopped"),
        data=result,
    )


@router.post("/restart", response_model=DeployResponse)
async def restart_deployment(req: RestartRequest):
    """Restart a deployed container."""
    logger.info(f"Restart request received: {req.deployment_id}")

    result = await deployment_service.restart(req.deployment_id)

    return DeployResponse(
        status=result.get("status", "unknown"),
        deployment_id=req.deployment_id,
        message=f"Container {result.get('status', 'unknown')}",
        data=result,
    )


@router.get("/status/{deployment_id}")
async def get_deployment_status(deployment_id: str):
    """Get status of a specific deployment."""
    result = await deployment_service.get_status(deployment_id)
    return result


@router.get("/logs/{deployment_id}")
async def get_deployment_logs(deployment_id: str, tail: int = 200):
    """Get logs from a deployed container."""
    result = await deployment_service.get_logs(deployment_id, tail=tail)
    return result


@router.get("/deployments")
async def list_all_deployments():
    """List all deployio-managed containers."""
    deployments = await deployment_service.list_deployments()
    return {
        "count": len(deployments),
        "deployments": deployments,
    }
