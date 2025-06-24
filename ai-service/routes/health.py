"""
Health and utility routes for FastAPI service
"""

import time
import logging
import asyncio
from fastapi import APIRouter, HTTPException
from models.response import HealthResponse, HelloResponse
from config.redis_client import get_redis_client

router = APIRouter()
logger = logging.getLogger(__name__)

# Server start time for uptime calculation
server_start = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        start_time = time.time()

        # Check Redis connection
        redis_client = get_redis_client()
        if asyncio.iscoroutine(redis_client):
            redis_client = await redis_client
        redis_health = {"status": "disconnected", "responseTime": None, "error": None}

        try:
            redis_start = time.time()
            if redis_client:
                # Await ping if redis_client is async
                ping_result = await redis_client.ping()
                if ping_result:
                    redis_health = {
                        "status": "connected",
                        "responseTime": round((time.time() - redis_start) * 1000, 2),
                        "error": None,
                    }
                else:
                    redis_health["error"] = "Redis ping failed"
            else:
                redis_health["error"] = "Redis client unavailable"
        except Exception as redis_error:
            redis_health["status"] = "error"
            redis_health["error"] = str(redis_error)

        uptime = time.time() - server_start
        response_time = round((time.time() - start_time) * 1000, 2)

        # Determine overall status
        overall_status = (
            "healthy" if redis_health["status"] == "connected" else "degraded"
        )

        return HealthResponse(
            service="FastAPI AI Service",
            status=overall_status,
            timestamp=time.time(),
            version="1.0.0",
            uptime=uptime,
            responseTime=response_time,
            memory={
                "usage": "N/A",  # Python memory usage would require psutil
                "limit": "N/A",
            },
            services={"redis": redis_health},
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "service": "FastAPI AI Service",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time(),
            },
        )


@router.get("/hello", response_model=HelloResponse)
async def hello():
    """Hello endpoint"""
    uptime = time.time() - server_start
    return HelloResponse(message="Hello from FastAPI Service", uptime=uptime)


@router.get("/test-logging")
async def test_logging():
    """Test endpoint to demonstrate config-based FastAPI logging"""
    logger.info("Test logging endpoint called - using config-based logging setup")
    logger.debug("This is a debug message (only visible when DEBUG=true)")

    return {
        "message": "This endpoint demonstrates config-based FastAPI logging",
        "tip": "Check the console for clean, formatted logs. Logging is configured via config.logging module.",
        "logging_info": {
            "access_logs": "Handled by uvicorn.access logger",
            "app_logs": "Using config.logging module with structured configuration",
            "format": "timestamp - logger - level - message",
            "configuration": "Centralized in config/logging.py",
        },
        "timestamp": time.time(),
    }
