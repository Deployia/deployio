"""Canonical deployment API routes for DeployIO Agent."""

from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.services.build_service import BuildService

router = APIRouter()
logger = get_logger("deploy-routes")
build_service = BuildService()


# --- Request / Response Models ---

class DeployRequest(BaseModel):
    repo_url: str = Field(..., description="Git repository URL")
    branch: str = Field(default="main", description="Git branch")
    subdomain: str = Field(..., description="Allocated subdomain from backend")
    env: Optional[Dict[str, str]] = Field(default=None, description="Optional environment variables")
    deployment_id: Optional[str] = Field(default=None, description="Optional external deployment id")
    github_token: Optional[str] = Field(default=None, description="Optional GitHub token")


class StopRequest(BaseModel):
    deployment_id: str


class DeployResponse(BaseModel):
    status: str
    deployment_id: Optional[str] = None
    message: str = ""
    data: Optional[Dict[str, Any]] = None


# --- Routes ---

@router.post("/deploy", response_model=DeployResponse)
async def trigger_deploy(req: DeployRequest):
    logger.info("Deploy request received for repo=%s subdomain=%s", req.repo_url, req.subdomain)
    result = await build_service.deploy_repository(
        repo_url=req.repo_url,
        branch=req.branch,
        subdomain=req.subdomain,
        env=req.env,
        deployment_id=req.deployment_id,
        github_token=req.github_token,
    )

    if result.get("status") in {"error", "failed"}:
        return DeployResponse(
            status="failed",
            deployment_id=result.get("deployment_id"),
            message=result.get("error", "Deployment failed"),
            data=result,
        )

    return DeployResponse(
        status=result.get("status", "unknown"),
        deployment_id=result.get("deployment_id"),
        message=f"Deployment is {result.get('status', 'unknown')}",
        data=result,
    )


@router.post("/deploy/{deployment_id}/stop", response_model=DeployResponse)
async def stop_deployment(deployment_id: str):
    logger.info("Stop request received: %s", deployment_id)
    result = await build_service.stop_deployment(deployment_id)

    return DeployResponse(
        status=result.get("status", "unknown"),
        deployment_id=deployment_id,
        message=result.get("message", "Container stopped"),
        data=result,
    )


@router.get("/deploy/{deployment_id}/status")
async def get_deployment_status(deployment_id: str):
    result = await build_service.get_deployment_status(deployment_id)
    return result


@router.get("/deploy/{deployment_id}/logs")
async def get_deployment_logs(deployment_id: str, tail: int = 200):
    result = await build_service.get_deployment_logs(deployment_id, tail=tail)
    return result


@router.get("/deployments")
async def list_all_deployments():
    deployments = await build_service.deployment_service.list_deployments()
    return {
        "count": len(deployments),
        "deployments": deployments,
    }


@router.post("/stop", response_model=DeployResponse, deprecated=True)
async def stop_deployment_legacy(req: StopRequest):
    result = await build_service.stop_deployment(req.deployment_id)
    return DeployResponse(
        status=result.get("status", "unknown"),
        deployment_id=req.deployment_id,
        message=result.get("message", "Container stopped"),
        data=result,
    )
