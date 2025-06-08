"""
Health and utility routes for FastAPI service
"""

import time
from fastapi import APIRouter, HTTPException
from models.response import HealthResponse, HelloResponse
from config.database import get_sync_db_connection

router = APIRouter()

# Server start time for uptime calculation
server_start = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        _, db_status = get_sync_db_connection()
        uptime = time.time() - server_start

        return HealthResponse(
            service_name="FastAPI Service",
            status="ok",
            mongodb_status=db_status,
            uptime=uptime,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/hello", response_model=HelloResponse)
async def hello():
    """Hello endpoint"""
    uptime = time.time() - server_start
    return HelloResponse(message="Hello from FastAPI Service", uptime=uptime)
