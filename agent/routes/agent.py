"""
Agent API routes for DeployIO Agent
"""

import time
import logging
import docker
import psutil
import os
from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()

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

        # Get Docker container metrics if possible
        docker_containers = 0
        try:
            client = docker.from_env()
            docker_containers = len(client.containers.list())
        except Exception:
            pass

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
            "docker": {"containers": docker_containers},
        }
    except Exception as e:
        logger.warning(f"Failed to get system metrics: {e}")
        return {
            "memory": {"usage": 0, "used": 0, "total": 0},
            "cpu": {"usage": 0, "process_usage": 0},
            "disk": {"usage": 0, "free": 0, "total": 0},
            "docker": {"containers": 0},
        }


async def check_mongodb_connection():
    """Check MongoDB connection"""
    try:
        client = AsyncIOMotorClient(settings.mongodb_uri)
        # Try to ping the database
        await client.admin.command("ping")
        await client.close()
        return "connected"
    except Exception as e:
        logger.warning(f"MongoDB check failed: {str(e)}")
        return "disconnected"


def check_docker_connection():
    """Check Docker connection"""
    try:
        client = docker.from_env()
        client.ping()
        return "connected"
    except Exception as e:
        logger.warning(f"Docker check failed: {str(e)}")
        return "disconnected"


@router.get("/health")
async def health_check():
    """Public health check endpoint for the DeployIO Agent with detailed metrics"""
    try:
        uptime = time.time() - server_start

        # Get system metrics
        system_metrics = get_system_metrics()

        # Check service connections
        mongodb_status = await check_mongodb_connection()
        docker_status = check_docker_connection()

        services_status = {
            "mongodb": {"status": mongodb_status},
            "docker": {"status": docker_status},
            "traefik": {"status": "checking..."},  # TODO: Add Traefik check
        }

        # Determine overall status
        overall_status = (
            "healthy"
            if all(
                s["status"] == "connected"
                for s in [services_status["mongodb"], services_status["docker"]]
            )
            else "degraded"
        )

        return {
            "service": "DeployIO Agent",
            "status": overall_status,
            "timestamp": time.time(),
            "uptime": uptime,
            "version": "1.0.0",
            "environment": settings.environment,
            "base_domain": settings.base_domain,
            "memory": system_metrics["memory"],
            "cpu": system_metrics["cpu"],
            "disk": system_metrics["disk"],
            "docker": system_metrics["docker"],
            "services": services_status,
            "responseTime": 0,  # Will be calculated by backend
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "service": "DeployIO Agent",
            "status": "error",
            "error": str(e),
            "uptime": time.time() - server_start,
            "timestamp": time.time(),
        }


@router.get("/status")
async def agent_status():
    """Get detailed agent status (authenticated endpoint)"""
    uptime = time.time() - server_start

    # Check service connections
    mongodb_status = await check_mongodb_connection()
    docker_status = check_docker_connection()

    return {
        "agent": {
            "status": "running",
            "uptime": uptime,
            "version": "1.0.0",
            "environment": settings.environment,
            "base_domain": settings.base_domain,
        },
        "services": {
            "mongodb": mongodb_status,
            "docker": docker_status,
            "traefik": "checking...",
        },
        "deployments": {"active": 0, "total": 0, "failed": 0},
        "resources": {"cpu_usage": "0%", "memory_usage": "0%", "disk_usage": "0%"},
        "capabilities": [
            "container_deployment",
            "mongodb_management",
            "traefik_routing",
            "aws_ecr_integration",
        ],
    }


# Placeholder routes for future implementation
@router.post("/deployments")
async def create_deployment():
    """Create new deployment - placeholder"""
    return {"message": "Deployment endpoint ready for implementation"}


@router.get("/deployments")
async def list_deployments():
    """List all deployments - placeholder"""
    return {"deployments": [], "total": 0}


@router.get("/deployments/{deployment_id}")
async def get_deployment(deployment_id: str):
    """Get deployment details - placeholder"""
    return {"deployment_id": deployment_id, "status": "placeholder"}


@router.delete("/deployments/{deployment_id}")
async def delete_deployment(deployment_id: str):
    """Delete deployment - placeholder"""
    return {
        "deployment_id": deployment_id,
        "action": "deleted",
        "status": "placeholder",
    }


@router.get("/containers")
async def list_containers():
    """List running containers - placeholder"""
    return {"containers": [], "total": 0}


@router.get("/traefik/routes")
async def list_traefik_routes():
    """List Traefik routes - placeholder"""
    return {"routes": [], "total": 0}
