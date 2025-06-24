#!/usr/bin/env python3
"""
DeployIO Agent - FastAPI Service for Container Deployment Management
"""

import time
import docker
import httpx
from config import create_app
from config.settings import settings
from services.mongodb_service import mongodb_service
from middleware import setup_exception_handlers, AuthMiddleware
from routes import create_routes
from middleware.auth import create_demo_routes  # Import demo route creator

# Import WebSocket logging
from services.websocket_logging import (
    setup_websocket_logging,
    start_websocket_logging,
    generate_test_logs,
)

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app
app = create_app()


# Add public health check endpoint before middleware to avoid auth issues
@app.get("/agent/v1/health")
async def health_check_direct():
    """Comprehensive health check endpoint that bypasses authentication"""
    start_time = time.time()
    uptime = time.time() - server_start

    # Quick service checks with timeouts
    services_status = {}

    # Check Docker socket connection (fast)
    try:
        docker_client = docker.from_env()
        docker_start = time.time()
        docker_client.ping()
        services_status["docker"] = {
            "status": "healthy",
            "responseTime": round((time.time() - docker_start) * 1000, 2),
        }
    except Exception as e:
        services_status["docker"] = {"status": "unhealthy", "error": str(e)}

    # Check MongoDB connection (with timeout)
    try:
        import asyncio

        mongo_start = time.time()
        db_status = await asyncio.wait_for(mongodb_service.ping(), timeout=3.0)
        services_status["mongodb"] = {
            "status": "healthy" if db_status else "unhealthy",
            "responseTime": round((time.time() - mongo_start) * 1000, 2),
        }
    except asyncio.TimeoutError:
        services_status["mongodb"] = {
            "status": "timeout",
            "error": "Connection timeout",
        }
    except Exception as e:
        services_status["mongodb"] = {"status": "unhealthy", "error": str(e)}

    # Determine overall status
    healthy_services = [s for s in services_status.values() if s["status"] == "healthy"]
    overall_status = (
        "healthy" if len(healthy_services) == len(services_status) else "degraded"
    )

    response_time = round((time.time() - start_time) * 1000, 2)

    return {
        "service": "DeployIO Agent",
        "status": overall_status,
        "timestamp": time.time(),
        "version": "1.0.0",
        "uptime": uptime,
        "responseTime": response_time,
        "memory": {
            "usage": "N/A",  # Would require psutil for detailed memory info
            "limit": "N/A",
        },
        "services": services_status,
        "purpose": "Container deployment management",
    }


# Add detailed health check with external services
@app.get("/agent/v1/health/detailed")
async def health_check_detailed():
    """Detailed health check that includes external services (may be slow)"""
    uptime = time.time() - server_start

    # Check database connection with timeout
    try:
        # Use asyncio.wait_for to timeout after 5 seconds
        import asyncio

        db_status = (
            "ok"
            if await asyncio.wait_for(mongodb_service.ping(), timeout=5.0)
            else "error"
        )
    except asyncio.TimeoutError:
        db_status = "timeout"
    except Exception:
        db_status = "error"

    # Check Docker socket connection
    try:
        docker_client = docker.from_env()
        docker_client.ping()
        docker_status = "ok"
    except Exception:
        docker_status = "error"

    # Check Traefik API connection with timeout
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://traefik:8080/api/rawdata")
            traefik_status = "ok" if response.status_code == 200 else "error"
    except Exception:
        traefik_status = "error"

    services_status = {
        "mongodb": db_status,
        "docker": docker_status,
        "traefik": traefik_status,
    }

    overall_status = (
        "ok" if all(s == "ok" for s in services_status.values()) else "degraded"
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

# Register demo/protected test routes
create_demo_routes(app)  # Register demo routes with the app


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await mongodb_service.connect()

    # Setup WebSocket logging
    setup_websocket_logging(
        backend_url="http://localhost:3000", service_name="deployio-agent"
    )
    await start_websocket_logging()

    # Log startup
    import logging

    logger = logging.getLogger("agent.startup")
    logger.info("DeployIO Agent started successfully")
    logger.info(f"Agent running on port {settings.port}")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up services on shutdown"""
    await mongodb_service.close()

    # Stop WebSocket logging
    from services.websocket_logging import stop_websocket_logging

    await stop_websocket_logging()

    # Log shutdown
    import logging

    logger = logging.getLogger("agent.shutdown")
    logger.info("DeployIO Agent shutting down")


@app.get("/agent/v1/hello")
async def hello():
    """Public hello endpoint for testing connectivity"""
    return {"message": "Hello from DeployIO Agent!"}


# Test log generation endpoint (for demonstration)
@app.get("/agent/v1/test/logs")
async def generate_test_logs_endpoint():
    """Generate test logs for WebSocket streaming demonstration"""
    return generate_test_logs()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
