"""
CORS configuration for the DeployIO Agent
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings


def setup_cors(app: FastAPI) -> None:
    """Setup CORS middleware with environment-specific settings"""

    # Development - allow all origins
    if settings.debug:
        origins = ["*"]
    else:
        # Production - specific origins only
        origins = [
            "https://deployio.dev",
            "https://app.deployio.dev",
            "https://dashboard.deployio.dev",
            "http://localhost:3000",  # Local development
            "http://localhost:5173",  # Vite dev server
        ]

        # Add any additional origins from environment
        if settings.cors_origins:
            origins.extend(settings.cors_origins.split(","))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-API-Key",
            "X-Auth-Token",
            "X-Deployment-Key",
            "X-Agent-Secret",
        ],
    )
