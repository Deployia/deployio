"""
Routes package initialization
"""

from fastapi import APIRouter
from routes.health import router as health_router
from routes.protected import router as protected_router


def create_routes() -> APIRouter:
    """Create and configure all routes"""
    api_router = APIRouter()

    # Health and utility routes (unprotected)
    api_router.include_router(health_router, prefix="/service/v1", tags=["Health"])

    # Protected routes
    api_router.include_router(
        protected_router, prefix="/service/v1/protected", tags=["Protected"]
    )

    return api_router
