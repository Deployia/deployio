"""
Routes module for DeployIO Agent
"""

from fastapi import APIRouter
from .agent import router as agent_router
from .wildcard import router as wildcard_router


def create_routes() -> APIRouter:
    """Create and configure all route handlers"""

    main_router = APIRouter()

    # Include agent API routes
    main_router.include_router(agent_router, prefix="/agent/v1", tags=["agent"])

    # Include wildcard routes (for subdomain HTML responses)
    main_router.include_router(wildcard_router, tags=["wildcard"])

    return main_router
