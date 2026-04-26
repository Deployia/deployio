"""
Health check routes for DeployIO Agent
"""

import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import psutil
import os
import docker
import httpx

from app.core.config import settings
from app.core.logging import get_logger

router = APIRouter()

# Server start time for uptime calculation
server_start = time.time()


class HealthResponse(BaseModel):
    """Health check response model"""

    status: str
    uptime: float
    timestamp: str
    version: str
    agent_id: str
    services: Dict[str, Any]


@router.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "service": settings.app_name,
        "version": settings.version,
        "status": "running",
    }


async def check_mongodb_connection():
    """Check MongoDB connection and log status"""
    logger = get_logger("mongodb-health")
    if not settings.health_check_mongodb_enabled:
        return "disabled"
    if not settings.mongodb_uri:
        return "not_configured"
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(settings.mongodb_uri)
        result = await client.admin.command("ping")
        client.close()
        if result and result.get("ok") == 1.0:
            return "connected"
        else:
            logger.warning("MongoDB connection: disconnected (ping failed)")
            return "disconnected"
    except Exception as e:
        logger.error(f"MongoDB connection: disconnected (error: {e})")
        return "disconnected"


def check_docker_connection():
    logger = get_logger("docker-health")
    try:
        client = docker.from_env()
        client.ping()
        return "connected"
    except Exception as e:
        logger.error(f"Docker connection: disconnected (error: {e})")
        return "disconnected"


async def check_traefik_connection():
    try:
        traefik_url = settings.traefik_api_url or "http://localhost:8080/api/overview"
        async with httpx.AsyncClient() as client:
            response = await client.get(traefik_url, timeout=2.0)
            if response.status_code == 200:
                return "connected"
            else:
                return "unreachable"
    except Exception:
        return "not_configured"


# --- Backend-compatible health check ---
@router.get(
    "/health",
    tags=["Health"],
    summary="Backend-compatible health check",
    response_model=None,
    # No auth dependencies for health
)
async def health_check():
    """
    Public health check endpoint for the DeployIO Agent with detailed metrics, log bridge status, and service checks.
    """
    uptime = time.time() - server_start
    try:
        memory = psutil.virtual_memory()
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()
        cpu_usage = psutil.cpu_percent(interval=0.1)
        process_cpu = process.cpu_percent(interval=0.1)
        docker_containers = 0
        try:
            client = docker.from_env()
            docker_containers = len(client.containers.list())
        except Exception:
            pass
        system_metrics = {
            "memory": {
                "usage": round((memory.used / memory.total) * 100, 2),
                "used": round(memory.used / 1024 / 1024, 2),
                "total": round(memory.total / 1024 / 1024, 2),
                "available": round(memory.available / 1024 / 1024, 2),
                "process_used": round(process_memory.rss / 1024 / 1024, 2),
            },
            "cpu": {
                "usage": round(cpu_usage, 2),
                "process_usage": round(process_cpu, 2),
                "cores": psutil.cpu_count(),
            },
            "disk": {
                "usage": round(psutil.disk_usage("/").percent, 2),
                "free": round(psutil.disk_usage("/").free / 1024 / 1024 / 1024, 2),
                "total": round(psutil.disk_usage("/").total / 1024 / 1024 / 1024, 2),
            },
            "docker": {"containers": docker_containers},
        }
    except Exception:
        system_metrics = {"memory": {}, "cpu": {}, "disk": {}, "docker": {}}
    # Service checks
    mongodb_status = await check_mongodb_connection()
    docker_status = check_docker_connection()
    traefik_status = await check_traefik_connection()
    services_status = {
        "mongodb": {"status": mongodb_status},
        "docker": {"status": docker_status},
        "traefik": {"status": traefik_status},
    }
    # Determine overall status with optional dependencies.
    docker_healthy = docker_status == "connected"
    mongodb_healthy_or_optional = mongodb_status in (
        "connected",
        "disabled",
        "not_configured",
    )

    if settings.health_check_docker_required:
        overall_status = (
            "healthy" if docker_healthy and mongodb_healthy_or_optional else "degraded"
        )
    else:
        overall_status = "healthy" if mongodb_healthy_or_optional else "degraded"
    return {
        "service": "DeployIO Agent",
        "status": overall_status,
        "timestamp": time.time(),
        "uptime": uptime,
        "version": "1.0.0",
        "environment": settings.environment,
        "base_domain": getattr(settings, "base_domain", None),
        "memory": system_metrics["memory"],
        "cpu": system_metrics["cpu"],
        "disk": system_metrics["disk"],
        "docker": system_metrics["docker"],
        "services": services_status,
        "responseTime": 0,
    }


# --- System metrics only ---
@router.get(
    "/system-metrics",
    tags=["Health"],
    summary="System metrics (no auth required)",
)
async def system_metrics():
    """
    Get detailed system metrics. No authentication required.
    """
    try:
        memory = psutil.virtual_memory()
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()
        cpu_usage = psutil.cpu_percent(interval=0.1)
        process_cpu = process.cpu_percent(interval=0.1)
        docker_containers = 0
        try:
            client = docker.from_env()
            docker_containers = len(client.containers.list())
        except Exception:
            pass
        return {
            "memory": {
                "usage": round((memory.used / memory.total) * 100, 2),
                "used": round(memory.used / 1024 / 1024, 2),
                "total": round(memory.total / 1024 / 1024, 2),
                "available": round(memory.available / 1024 / 1024, 2),
                "process_used": round(process_memory.rss / 1024 / 1024, 2),
            },
            "cpu": {
                "usage": round(cpu_usage, 2),
                "process_usage": round(process_cpu, 2),
                "cores": psutil.cpu_count(),
            },
            "disk": {
                "usage": round(psutil.disk_usage("/").percent, 2),
                "free": round(psutil.disk_usage("/").free / 1024 / 1024 / 1024, 2),
                "total": round(psutil.disk_usage("/").total / 1024 / 1024 / 1024, 2),
            },
            "docker": {"containers": docker_containers},
        }
    except Exception:
        return {"error": "Failed to collect system metrics"}


@router.get(
    "/websocket-status",
    tags=["Health"],
    summary="WebSocket service status",
)
async def websocket_status():
    """
    Get WebSocket service status and health information
    """
    try:
        from app.websockets import websocket_health_check

        return await websocket_health_check()
    except ImportError:
        return {
            "error": "WebSocket service not available",
            "health": {
                "overall": "unavailable",
                "websocket_connection": "not_implemented",
            },
        }
    except Exception as e:
        return {
            "error": f"Failed to get WebSocket status: {str(e)}",
            "health": {"overall": "error", "websocket_connection": "error"},
        }


@router.get(
    "/bridge-status",
    tags=["Health"],
    summary="Agent bridge connection status",
)
async def bridge_status():
    """
    Get agent bridge connection status for monitoring
    """
    try:
        from app.websockets import get_websocket_status

        status = get_websocket_status()

        # Simplified status for monitoring
        return {
            "bridge_enabled": settings.log_bridge_enabled,
            "connected": status.get("connected", False),
            "initialized": status.get("initialized", False),
            "agent_id": settings.agent_id,
            "platform_url": settings.platform_url,
            "enabled_features": status.get("enabled_features", {}),
            "namespaces_active": len(
                status.get("registry_stats", {}).get("namespace_paths", [])
            ),
            "health": status.get("health", {}).get("overall", "unknown"),
        }

    except ImportError:
        return {
            "bridge_enabled": settings.log_bridge_enabled,
            "connected": False,
            "initialized": False,
            "error": "WebSocket bridge not available",
            "health": "unavailable",
        }
    except Exception as e:
        return {
            "bridge_enabled": settings.log_bridge_enabled,
            "connected": False,
            "initialized": False,
            "error": f"Failed to get bridge status: {str(e)}",
            "health": "error",
        }
