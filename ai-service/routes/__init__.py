"""
API Routes Package

Clean, focused API routes for repository analysis with integrated configuration generation.
Provides comprehensive endpoints with proper error handling.
"""

from fastapi import APIRouter
from .health import router as health_router
from .analysis_routes import create_analysis_routes
from .dev import router as dev_router  # noqa: F401
import os


def create_routes() -> APIRouter:
    """
    Create and configure all API routes

    Unified structure:
    - /service/v1/health - Health checks
    - /service/v1/analysis - All analysis operations with integrated config generation
    """
    api_router = APIRouter()

    # Health endpoints
    api_router.include_router(
        health_router,
        prefix="/service/v1",
        tags=["Health"],
    )

    # Analysis endpoints (with integrated configuration generation)
    api_router.include_router(
        create_analysis_routes(),
        prefix="/service/v1/analysis",
        tags=["Analysis"],
    )

    # Dev endpoints (only in non-production)
    if os.getenv("ENVIRONMENT", "development") != "production":
        api_router.include_router(
            dev_router,
            prefix="",
            tags=["Dev"],
        )

    return api_router


__all__ = ["create_routes"]
