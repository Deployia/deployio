"""
Routes package for DeployIO Agent
"""

from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.logs import router as logs_router
from app.routes.system import router as system_router
from app.routes.deploy import router as deploy_router
from app.routes.build import router as build_router


def include_routes(app: FastAPI):
    """Include all route modules"""

    # Health check routes
    app.include_router(health_router, prefix="/agent/v1", tags=["Health"])

    # Log management routes
    app.include_router(logs_router, prefix="/agent/v1", tags=["Logs"])

    # System information routes
    app.include_router(system_router, prefix="/agent/v1", tags=["System"])

    # Deployment management routes
    app.include_router(deploy_router, prefix="/agent/v1", tags=["Deployments"])

    # Build and analysis routes
    app.include_router(build_router, prefix="/agent/v1", tags=["Build"])
