"""
Health check routes for DeployIO Agent
"""

import time
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

from app.core.config import settings
from app.services.health_monitor import health_monitor
from app.services.log_bridge import log_bridge_service

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


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check endpoint"""

    current_time = time.time()
    uptime = current_time - server_start

    # Get service statuses
    services = {
        "log_bridge": {
            "status": "connected" if log_bridge_service.connected else "disconnected",
            "last_heartbeat": log_bridge_service.last_heartbeat,
        },
        "health_monitor": {
            "status": (
                "running"
                if health_monitor.monitoring_task
                and not health_monitor.monitoring_task.done()
                else "stopped"
            ),
            "last_check": (
                health_monitor.last_check.isoformat()
                if health_monitor.last_check
                else None
            ),
        },
    }

    # Get overall health from health monitor
    health_data = health_monitor.get_current_health()
    overall_status = health_data.get("status", "unknown")

    return HealthResponse(
        status=overall_status,
        uptime=uptime,
        timestamp=datetime.now().isoformat(),
        version=settings.version,
        agent_id=settings.agent_id,
        services=services,
    )


@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with system metrics"""

    basic_health = await health_check()
    detailed_health = health_monitor.get_current_health()

    return {
        **basic_health.dict(),
        "system_metrics": detailed_health.get("data", {}),
        "environment": settings.environment,
        "platform_url": settings.platform_url,
    }
