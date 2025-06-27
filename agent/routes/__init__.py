"""
Routes module for DeployIO Agent
"""

from fastapi import APIRouter
from .agent import router as agent_router
from .deployments import router as deployments_router
from services.log_bridge import router as log_bridge_router


def create_routes() -> APIRouter:
    """Create and configure all route handlers"""

    main_router = APIRouter()

    # Include agent API routes with /agent/v1 prefix
    main_router.include_router(agent_router, prefix="/agent/v1", tags=["agent"])

    # Include deployment routes with /agent/v1 prefix
    main_router.include_router(
        deployments_router, prefix="/agent/v1", tags=["deployments"]
    )

    # Include log bridge routes with /agent/v1 prefix
    main_router.include_router(
        log_bridge_router, prefix="/agent/v1", tags=["log-bridge"]
    )

    return main_router
