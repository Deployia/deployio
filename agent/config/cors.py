"""
CORS config        # Production - specific origins only
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings


def setup_cors(app: FastAPI) -> None:
    """Setup CORS middleware with environment-specific settings"""

    # Development - allow common development origins
    if settings.debug:
        origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8000",
            "https://localhost:3000",
            "https://localhost:5173",
            "https://localhost:8000",
            "https://deployio.tech",
            "https://www.deployio.tech",
            "https://api.deployio.tech",
            "https://service.deployio.tech",
            "https://agent.deployio.tech",
        ]
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
        additional_origins = [
            origin.strip()
            for origin in settings.cors_origins.split(",")
            if origin.strip()
        ]
        origins.extend(additional_origins)

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
