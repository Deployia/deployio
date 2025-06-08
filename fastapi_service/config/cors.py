"""
CORS configuration for FastAPI service
"""

import os
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app):
    """Configure CORS middleware for the FastAPI app"""

    # Get allowed origins from environment
    client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")

    # Define allowed origins
    allowed_origins = [
        client_url,
        backend_url,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "https://localhost:3000",
        "https://localhost:5173",
        "https://localhost:8000",
    ]

    # Add production origins if specified
    production_origin = os.getenv("PRODUCTION_URL")
    if production_origin:
        allowed_origins.append(production_origin)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )

    return app
