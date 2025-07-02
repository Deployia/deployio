"""
API Routes Package

Clean, focused API routes for repository analysis and configuration generation.
Provides comprehensive endpoints with proper error handling.
"""

from fastapi import APIRouter
from .health import router as health_router
from .analysis_routes import create_analysis_routes
from .generator_routes import create_generator_routes
from .dev import router as dev_router  # noqa: F401
import os


def create_routes() -> APIRouter:
    """
    Create and configure all API routes

    New clean structure:
    - /service/v1/health - Health checks
    - /service/v1/analyze - All analysis operations
    - /service/v1/generators - Configuration generation and optimization
    """
    api_router = APIRouter()

    # Health endpoints
    api_router.include_router(
        health_router,
        prefix="/service/v1",
        tags=["Health"],
    )

    # Analysis endpoints
    api_router.include_router(
        create_analysis_routes(),
        prefix="/service/v1/analyze",
        tags=["Analysis"],
    )

    # Generator/Optimization endpoints
    api_router.include_router(
        create_generator_routes(),
        prefix="/service/v1/generators",
        tags=["Generators"],
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
