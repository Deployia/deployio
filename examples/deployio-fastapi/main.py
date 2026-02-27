"""
Deployio FastAPI Example — API Service
"""

import os
import time
import platform
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

start_time = time.time()

app = FastAPI(
    title="Deployio FastAPI Example",
    description="Example FastAPI application deployed via Deployio platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "Deployio FastAPI Example",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": round(time.time() - start_time, 2),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@app.get("/api/v1/info")
async def info():
    return {
        "name": "Deployio FastAPI Service",
        "version": "1.0.0",
        "description": "Example FastAPI backend deployed via Deployio platform",
        "stack": {
            "framework": "FastAPI",
            "language": f"Python {platform.python_version()}",
            "server": "Uvicorn",
        },
        "endpoints": [
            {"method": "GET", "path": "/health", "description": "Health check"},
            {"method": "GET", "path": "/api/v1/info", "description": "Service info"},
            {"method": "GET", "path": "/api/v1/stats", "description": "System stats"},
            {"method": "GET", "path": "/api/v1/services", "description": "Service registry"},
        ],
        "deployedBy": "Deployio Platform",
    }


@app.get("/api/v1/stats")
async def stats():
    import psutil

    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()

    return {
        "uptime": round(time.time() - start_time, 2),
        "cpu": {"usage_percent": cpu, "count": psutil.cpu_count()},
        "memory": {
            "total_mb": round(mem.total / 1024 / 1024, 1),
            "used_mb": round(mem.used / 1024 / 1024, 1),
            "percent": mem.percent,
        },
        "python": platform.python_version(),
        "platform": platform.platform(),
        "pid": os.getpid(),
    }


@app.get("/api/v1/services")
async def services():
    """Mock service registry showing Deployio microservices"""
    return {
        "services": [
            {"name": "deployio-server", "type": "Express.js", "status": "running", "port": 5000},
            {"name": "deployio-client", "type": "React (Vite)", "status": "running", "port": 5173},
            {"name": "deployio-ai", "type": "FastAPI", "status": "running", "port": 8000},
            {"name": "deployio-agent", "type": "FastAPI", "status": "running", "port": 8001},
        ],
        "total": 4,
        "healthy": 4,
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to Deployio FastAPI Example",
        "docs": "/docs",
        "health": "/health",
        "api": "/api/v1/info",
    }
