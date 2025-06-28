"""
Routes package for DeployIO Agent
"""

from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.logs import router as logs_router
from app.routes.system import router as system_router


def include_routes(app: FastAPI):
    """Include all route modules"""

    # Health check routes
    app.include_router(health_router, tags=["Health"])

    # Log management routes
    app.include_router(logs_router, prefix="/agent/v1", tags=["Logs"])

    # System information routes
    app.include_router(system_router, prefix="/agent/v1", tags=["System"])
