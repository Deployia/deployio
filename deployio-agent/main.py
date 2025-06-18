#!/usr/bin/env python3
"""
DeployIO Agent - FastAPI Service for Container Deployment Management
"""

import time
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
    try:
        uptime = time.time() - server_start

        # Check database connection
        db_status = "ok" if await db.ping() else "error"

        # TODO: Add actual service checks (Docker, Traefik)
        services_status = {
            "mongodb": db_status,
            "docker": "checking...",
            "traefik": "checking...",
        }

        return {
            "service_name": "DeployIO Agent",
            "status": "ok",
            "uptime": uptime,
            "services": services_status,
            "version": "1.0.0",
            "purpose": "Container deployment management",
        }
    except Exception as e:
        return {
            "service_name": "DeployIO Agent",
            "status": "error",
            "error": str(e),
            "uptime": time.time() - server_start,
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
    # TODO: Initialize Docker client
    # TODO: Check Traefik connectivity


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
