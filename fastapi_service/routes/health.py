"""
Health and utility routes for FastAPI service
"""

import time
import logging
from fastapi import APIRouter, HTTPException
from models.response import HealthResponse, HelloResponse
from config.redis_client import get_redis_client

router = APIRouter()
logger = logging.getLogger(__name__)

# Server start time for uptime calculation
server_start = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        redis_client = get_redis_client()
        try:
            redis_status = (
                "connected"
                if (redis_client and redis_client.ping())
                else "disconnected"
            )
        except Exception:
            redis_status = "disconnected"

        uptime = time.time() - server_start

        return HealthResponse(
            service_name="FastAPI AI Service",
            status="ok",
            redis_status=redis_status,
            uptime=uptime,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


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
