"""
Build routes for DeployIO Agent
Handles: repository analysis, Dockerfile generation, build + deploy pipeline
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.services.build_service import BuildService

router = APIRouter()
build_service = BuildService()
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    """Request to analyze a repository"""

    git_url: str
    github_token: Optional[str] = None
    branch: str = "main"


class GenerateDockerfileRequest(BaseModel):
    """Request to generate Dockerfile"""

    git_url: str
    github_token: Optional[str] = None
    branch: str = "main"


class DeployFromGitRequest(BaseModel):
    """Request to deploy from GitHub"""

    git_url: str
    github_token: Optional[str] = None
    branch: str = "main"
    subdomain: Optional[str] = None


@router.post("/api/analyze")
async def analyze_repository(request: AnalyzeRequest):
    """
    Analyze a GitHub repository to detect its tech stack.

    Returns: { stack, language, framework, port, build_command, start_command }
    """
    try:
        logger.info(f"Analyzing repository: {request.git_url}")

        result = await build_service.analyze_repository(
            request.git_url,
            request.github_token,
            request.branch,
        )

        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error"])

        return result

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/generate-dockerfile")
async def generate_dockerfile(request: GenerateDockerfileRequest):
    """
    Generate a Dockerfile for a GitHub repository.

    Returns: { dockerfile, dockerfile_path, port, stack }
    """
    try:
        logger.info(f"Generating Dockerfile for: {request.git_url}")

        result = await build_service.generate_dockerfile(
            request.git_url,
            request.github_token,
            request.branch,
        )

        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error"])

        return result

    except Exception as e:
        logger.error(f"Dockerfile generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/deploy-from-git")
async def deploy_from_git(
    request: DeployFromGitRequest, background_tasks: BackgroundTasks
):
    """
    Full deployment pipeline: clone → analyze → build → deploy.

    Returns: { deployment_id, subdomain, url, status, port, stack }
    """
    try:
        logger.info(f"Starting deployment from: {request.git_url}")

        # Run deployment (can be async/background if needed)
        result = await build_service.build_and_deploy(
            request.git_url,
            request.github_token,
            request.branch,
            request.subdomain,
        )

        if result["status"] == "error":
            raise HTTPException(
                status_code=400, detail=result.get("error", "Deployment failed")
            )

        return result

    except Exception as e:
        logger.error(f"Deployment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
