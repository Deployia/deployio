"""
Initialization module for setting up FastAPI app with middleware and configurations
"""

from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .cors import setup_cors
from .settings import settings
from .logging import setup_logging, get_logger

# Setup logging configuration
setup_logging(debug=settings.debug)

logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=settings.description,
        debug=settings.debug,
        docs_url="/service/v1/docs",
        redoc_url="/service/v1/redoc",
        openapi_url="/service/v1/openapi.json",
        openapi_version="3.0.3",  # Explicitly set OpenAPI version
    )

    # Add security middleware
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["*"]  # Configure as needed for production
    )

    # Add compression middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)  # Setup CORS
    setup_cors(app)

    logger.info(f"FastAPI app created: {settings.app_name} v{settings.version}")
    logger.info("Logging configured via config.logging module")

    return app
