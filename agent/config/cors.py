"""
CORS config        # Production - specific origins only
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings


def setup_cors(app: FastAPI) -> None:
    """Setup CORS middleware with environment-specific settings"""

    # Development - allow all origins
    if settings.debug:
        origins = ["*"]
    else:  # Production - specific origins only
        origins = [
            "https://deployio.tech",
            "https://www.deployio.tech",
            "https://api.deployio.tech",
            "https://service.deployio.tech",
            "https://agent.deployio.tech",
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
