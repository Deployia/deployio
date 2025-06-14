"""
Routes package initialization
"""

from fastapi import APIRouter
from routes.health import router as health_router
from routes.protected import router as protected_router
from routes.ai import router as ai_router


def create_routes() -> APIRouter:
    """Create and configure all routes"""
    api_router = APIRouter()

    # Health and utility routes (unprotected)
    api_router.include_router(health_router, prefix="/service/v1", tags=["Health"])

    # Protected routes
    api_router.include_router(
        protected_router, prefix="/service/v1/protected", tags=["Protected"]
    )
    
    # AI-powered project analysis routes
    api_router.include_router(
        ai_router, prefix="/service/v1/ai", tags=["AI Analysis"]
    )

    return api_router
