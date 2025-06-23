"""
Clean Route Registration
Simplified route structure with clear separation of concerns
"""

from fastapi import APIRouter
from .health import router as health_router
from .analysis import router as analysis_router
from .optimization import router as optimization_router
from engines.core.models import ConfidenceLevel  # noqa: F401


def create_routes() -> APIRouter:
    """
    Create and configure all API routes

    New clean structure:
    - /service/v1/health - Health checks
    - /service/v1/analysis - All analysis operations
    - /service/v1/optimization - Configuration generation and optimization
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
        analysis_router,
        prefix="/service/v1/analysis",
        tags=["Analysis"],
    )

    # Optimization endpoints
    api_router.include_router(
        optimization_router,
        prefix="/service/v1/optimization",
        tags=["Optimization"],
    )

    return api_router
