"""
System information routes for DeployIO Agent
"""

import logging
import psutil
import docker
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.services.health_monitor import health_monitor
from app.routes.security import get_bearer_token, verify_internal_service

router = APIRouter()
logger = logging.getLogger(__name__)


class SystemInfo(BaseModel):
    """System information model"""

    agent_id: str
    timestamp: str
    cpu_count: int
    cpu_percent: float
    memory: Dict[str, Any]
    disk: Dict[str, Any]
    network: Dict[str, Any]
    uptime: float
    load_avg: Optional[List[float]]


class ContainerInfo(BaseModel):
    """Container information model"""

    id: str
    name: str
    image: str
    status: str
    created: str
    ports: Dict[str, Any]


@router.get(
    "/system",
    response_model=SystemInfo,
    dependencies=[Depends(get_bearer_token), Depends(verify_internal_service)],
)
async def get_system_info():
    """Get current system information"""

    try:
        # Get health data from health monitor
        health_data = health_monitor.get_current_health()
        system_data = health_data.get("data", {})

        if not system_data:
            # Fallback to direct collection if health monitor data is not available
            system_data = {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "percent": psutil.virtual_memory().percent,
                    "available": psutil.virtual_memory().available,
                    "used": psutil.virtual_memory().used,
                    "total": psutil.virtual_memory().total,
                },
                "disk": {
                    "percent": psutil.disk_usage("/").percent,
                    "free": psutil.disk_usage("/").free,
                    "used": psutil.disk_usage("/").used,
                    "total": psutil.disk_usage("/").total,
                },
                "network": {},
                "load_avg": (
                    psutil.getloadavg() if hasattr(psutil, "getloadavg") else None
                ),
                "uptime": psutil.boot_time(),
            }

        return SystemInfo(
            agent_id=settings.agent_id,
            timestamp=datetime.now().isoformat(),
            cpu_count=psutil.cpu_count(),
            cpu_percent=system_data.get("cpu_percent", 0),
            memory=system_data.get("memory", {}),
            disk=system_data.get("disk", {}),
            network=system_data.get("network", {}),
            uptime=system_data.get("uptime", 0),
            load_avg=system_data.get("load_avg"),
        )

    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system information: {str(e)}",
        )


@router.get(
    "/containers",
    dependencies=[Depends(get_bearer_token), Depends(verify_internal_service)],
)
async def get_containers():
    """Get Docker containers information"""

    try:
        docker_client = docker.from_env()
        containers = docker_client.containers.list(all=True)

        container_list = []
        for container in containers:
            try:
                container_info = ContainerInfo(
                    id=container.id,
                    name=container.name,
                    image=(
                        container.image.tags[0] if container.image.tags else "unknown"
                    ),
                    status=container.status,
                    created=container.attrs.get("Created", ""),
                    ports=container.attrs.get("NetworkSettings", {}).get("Ports", {}),
                )
                container_list.append(container_info)

            except Exception as e:
                logger.warning(
                    f"Error getting info for container {container.name}: {e}"
                )

        return {
            "containers": container_list,
            "total": len(container_list),
            "agent_id": settings.agent_id,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting containers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get containers information: {str(e)}",
        )


@router.get(
    "/processes",
    dependencies=[Depends(get_bearer_token), Depends(verify_internal_service)],
)
async def get_processes(limit: int = 10):
    """Get top processes by CPU usage"""

    try:
        processes = []
        for proc in psutil.process_iter(
            ["pid", "name", "cpu_percent", "memory_percent", "status"]
        ):
            try:
                pinfo = proc.info
                if pinfo["cpu_percent"] > 0:  # Only include processes using CPU
                    processes.append(pinfo)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # Sort by CPU usage and limit results
        processes.sort(key=lambda x: x["cpu_percent"], reverse=True)
        top_processes = processes[:limit]

        return {
            "processes": top_processes,
            "total_processes": len(psutil.pids()),
            "showing": len(top_processes),
            "agent_id": settings.agent_id,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting processes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get processes information: {str(e)}",
        )


@router.get(
    "/system-metrics",
    tags=["System"],
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
