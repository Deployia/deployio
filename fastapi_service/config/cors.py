"""
CORS configuration for FastAPI service
"""

import os
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app):
    """Configure CORS middleware for the FastAPI app"""

    # Get environment
    environment = os.getenv("NODE_ENV", "development")

    # Get allowed origins from environment
    client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
    production_url = os.getenv("PRODUCTION_URL", "")

    # Environment-specific CORS configuration
    if environment == "production":
        # PRODUCTION: Only allow the actual production domains
        allowed_origins = []
        if production_url:
            allowed_origins.append(production_url)
            # Also allow https version if not already specified
            if production_url.startswith("http://"):
                allowed_origins.append(production_url.replace("http://", "https://"))

        # In production, we might also need to allow the backend service for internal communication
        # but NEVER localhost
        if (
            backend_url
            and not backend_url.startswith("http://localhost")
            and not backend_url.startswith("https://localhost")
        ):
            allowed_origins.append(backend_url)

    else:
        # DEVELOPMENT: Allow localhost for development
        allowed_origins = [
            client_url,
            backend_url,
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8000",
            "https://localhost:3000",
            "https://localhost:5173",
            "https://localhost:8000",
        ]  # Add production origins for testing
        if production_url:
            allowed_origins.append(production_url)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )

    return app
