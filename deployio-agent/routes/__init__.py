"""
Routes module for DeployIO Agent
"""

from fastapi import APIRouter
from .agent import router as agent_router


def create_routes() -> APIRouter:
    """Create and configure all route handlers"""

    main_router = APIRouter()

    # Include agent API routes with /agent/v1 prefix
    main_router.include_router(agent_router, prefix="/agent/v1", tags=["agent"])

    return main_router
