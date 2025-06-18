#!/usr/bin/env python3
"""
DeployIO Agent - FastAPI Service for Container Deployment Management
"""

import time
import docker
import httpx
from config import create_app
from config.settings import settings
from config.database import db
from middleware import setup_exception_handlers, AuthMiddleware
from routes import create_routes

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app
app = create_app()


# Add public health check endpoint before middleware to avoid auth issues
@app.get("/agent/v1/health")
async def health_check_direct():
    """Direct public health check endpoint that bypasses authentication"""
    uptime = time.time() - server_start

    # Check database connection
    try:
        db_status = "ok" if await db.ping() else "error"
    except Exception:
        db_status = "error"

    # Check Docker socket connection
    try:
        docker_client = docker.from_env()
        docker_client.ping()
        docker_status = "ok"
    except Exception:
        docker_status = "error"

    # Check Traefik API connection
    try:
        async with httpx.AsyncClient() as client:
            # We query a traefik service that is always present
            response = await client.get("http://traefik:8080/api/rawdata")
            if response.status_code == 200:
                traefik_status = "ok"
            else:
                traefik_status = "error"
    except Exception:
        traefik_status = "error"

    services_status = {
        "mongodb": db_status,
        "docker": docker_status,
        "traefik": traefik_status,
    }

    overall_status = (
        "ok" if all(s == "ok" for s in services_status.values()) else "error"
    )

    return {
        "service_name": "DeployIO Agent",
        "status": overall_status,
        "uptime": uptime,
        "services": services_status,
        "version": "1.0.0",
        "purpose": "Container deployment management",
    }


# Setup exception handlers
setup_exception_handlers(app)

# Add authentication middleware
app.add_middleware(AuthMiddleware, agent_secret=settings.agent_secret)

# Include routes
app.include_router(create_routes())


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await db.connect()


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up services on shutdown"""
    await db.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
