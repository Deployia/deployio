"""
Health and utility routes for FastAPI service
"""

import time
import logging
import asyncio
import psutil  # For system metrics
import os
from fastapi import APIRouter, HTTPException
from models.response import HealthResponse, HelloResponse
from config.redis_client import get_redis_client

router = APIRouter()
logger = logging.getLogger(__name__)

# Server start time for uptime calculation
server_start = time.time()


def get_system_metrics():
    """Get detailed system metrics"""
    try:
        # Get memory info
        memory = psutil.virtual_memory()
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()

        # Get CPU usage
        cpu_usage = psutil.cpu_percent(interval=0.1)

        # Get process-specific metrics
        process_cpu = process.cpu_percent(interval=0.1)

        return {
            "memory": {
                "usage": round((memory.used / memory.total) * 100, 2),
                "used": round(memory.used / 1024 / 1024, 2),  # MB
                "total": round(memory.total / 1024 / 1024, 2),  # MB
                "available": round(memory.available / 1024 / 1024, 2),  # MB
                "process_used": round(process_memory.rss / 1024 / 1024, 2),  # MB
            },
            "cpu": {
                "usage": round(cpu_usage, 2),
                "process_usage": round(process_cpu, 2),
                "cores": psutil.cpu_count(),
            },
            "disk": {
                "usage": round(psutil.disk_usage("/").percent, 2),
                "free": round(
                    psutil.disk_usage("/").free / 1024 / 1024 / 1024, 2
                ),  # GB
                "total": round(
                    psutil.disk_usage("/").total / 1024 / 1024 / 1024, 2
                ),  # GB
            },
        }
    except Exception as e:
        logger.warning(f"Failed to get system metrics: {e}")
        return {
            "memory": {"usage": 0, "used": 0, "total": 0},
            "cpu": {"usage": 0, "process_usage": 0},
            "disk": {"usage": 0, "free": 0, "total": 0},
        }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check endpoint with detailed metrics"""
    try:
        start_time = time.time()

        # Get system metrics
        system_metrics = get_system_metrics()

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
            memory=system_metrics["memory"],
            cpu=system_metrics["cpu"],
            disk=system_metrics["disk"],
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
