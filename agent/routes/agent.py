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


async def check_traefik_connection():
    """Check Traefik connection using httpx for better performance"""
    try:
        import httpx

        # Try to connect to Traefik API endpoint
        traefik_url = "http://localhost:8080/api/overview"  # Default Traefik API port
        async with httpx.AsyncClient() as client:
            response = await client.get(traefik_url, timeout=2.0)
            if response.status_code == 200:
                return "connected"
            else:
                return "unreachable"
    except Exception as e:
        logger.debug(
            f"Traefik check failed (this is normal if Traefik is not configured): {str(e)}"
        )
        return "not_configured"


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
        traefik_status = await check_traefik_connection()

        services_status = {
            "mongodb": {"status": mongodb_status},
            "docker": {"status": docker_status},
            "traefik": {"status": traefik_status},
        }

        # Determine overall status - be more lenient with status determination
        # Core services: MongoDB and Docker must be connected
        # Traefik is optional and can be not_configured
        core_services_healthy = (
            mongodb_status == "connected" and docker_status == "connected"
        )

        if core_services_healthy:
            # If core services are healthy, overall status is healthy
            # even if Traefik is not configured
            overall_status = "healthy"
        else:
            # If core services are down, status is degraded
            overall_status = "degraded"

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
    traefik_status = await check_traefik_connection()

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
            "traefik": traefik_status,
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


@router.get("/logs")
async def get_logs(lines: int = 50, level: str = "all"):
    """Get recent logs from the agent service"""
    try:
        import os
        import subprocess
        from pathlib import Path

        # Path to agent log file
        log_file = Path(__file__).parent.parent / "logs" / "agent.log"

        if not log_file.exists():
            return {
                "success": False,
                "error": "Log file not found",
                "path": str(log_file),
                "logs": [],
                "totalLines": 0,
            }

        # Use tail command to get recent lines
        try:
            if os.name == "nt":  # Windows
                # Use PowerShell Get-Content for Windows
                result = subprocess.run(
                    [
                        "powershell",
                        "-Command",
                        f"Get-Content -Path '{log_file}' -Tail {lines}",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=10,
                )
            else:  # Unix/Linux
                result = subprocess.run(
                    ["tail", "-n", str(lines), str(log_file)],
                    capture_output=True,
                    text=True,
                    timeout=10,
                )

            if result.returncode == 0:
                log_lines = (
                    result.stdout.strip().split("\n") if result.stdout.strip() else []
                )

                # Filter by level if specified
                if level != "all":
                    log_lines = [
                        line for line in log_lines if level.upper() in line.upper()
                    ]

                logs = []
                for i, line in enumerate(log_lines):
                    if line.strip():
                        logs.append(
                            {
                                "id": f"agent_{int(time.time())}_{i}",
                                "timestamp": time.time(),
                                "level": extract_log_level(line),
                                "message": line.strip(),
                                "service": "agent",
                                "source": "remote",
                            }
                        )

                return {
                    "success": True,
                    "logs": logs,
                    "totalLines": len(logs),
                    "path": str(log_file),
                    "source": "agent_service",
                }
            else:
                return {
                    "success": False,
                    "error": f"Command failed: {result.stderr}",
                    "logs": [],
                    "totalLines": 0,
                }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Log reading timeout",
                "logs": [],
                "totalLines": 0,
            }

    except Exception as e:
        logger.error(f"Error reading logs: {str(e)}")
        return {"success": False, "error": str(e), "logs": [], "totalLines": 0}


def extract_log_level(log_line: str) -> str:
    """Extract log level from log line"""
    log_line_upper = log_line.upper()
    if "ERROR" in log_line_upper:
        return "ERROR"
    elif "WARN" in log_line_upper:
        return "WARN"
    elif "INFO" in log_line_upper:
        return "INFO"
    elif "DEBUG" in log_line_upper:
        return "DEBUG"
    else:
        return "INFO"
