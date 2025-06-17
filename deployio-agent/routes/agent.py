"""
Agent API routes for DeployIO Agent
"""

import time
import logging
import docker
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Server start time for uptime calculation
server_start = time.time()


async def check_mongodb_connection():
    """Check MongoDB connection"""
    try:
        client = AsyncIOMotorClient(settings.mongodb_url)
        # Try to ping the database
        await client.admin.command('ping')
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
    """Public health check endpoint for the DeployIO Agent"""
    try:
        uptime = time.time() - server_start
        
        # Check service connections
        mongodb_status = await check_mongodb_connection()
        docker_status = check_docker_connection()
        
        services_status = {
            "mongodb": mongodb_status,
            "docker": docker_status,
            "traefik": "checking..."  # TODO: Add Traefik check
        }
        
        # Determine overall status
        overall_status = "ok" if all(
            status == "connected" for status in [mongodb_status, docker_status]
        ) else "degraded"
        
        return {
            "service_name": "DeployIO Agent",
            "status": overall_status,
            "uptime": uptime,
            "services": services_status,
            "version": "1.0.0",
            "purpose": "Container deployment management",
            "environment": settings.environment,
            "base_domain": settings.base_domain
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "service_name": "DeployIO Agent",
            "status": "error",
            "error": str(e),
            "uptime": time.time() - server_start,
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
            "base_domain": settings.base_domain
        },
        "services": {
            "mongodb": mongodb_status,
            "docker": docker_status,
            "traefik": "checking..."
        },
        "deployments": {
            "active": 0,
            "total": 0,
            "failed": 0
        },
        "resources": {
            "cpu_usage": "0%",
            "memory_usage": "0%",
            "disk_usage": "0%"
        },
        "capabilities": [
            "container_deployment",
            "mongodb_management", 
            "traefik_routing",
            "aws_ecr_integration"
        ]
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
    return {"deployment_id": deployment_id, "action": "deleted", "status": "placeholder"}


@router.get("/containers")
async def list_containers():
    """List running containers - placeholder"""
    return {"containers": [], "total": 0}


@router.get("/traefik/routes")
async def list_traefik_routes():
    """List Traefik routes - placeholder"""
    return {"routes": [], "total": 0}
