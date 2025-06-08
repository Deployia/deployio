"""
Initialization module for setting up FastAPI app with middleware and configurations
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .cors import setup_cors
from .settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=settings.description,
        debug=settings.debug,
        docs_url="/service/v1/docs" if settings.debug else None,
        redoc_url="/service/v1/redoc" if settings.debug else None,
    )

    # Add security middleware
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["*"]  # Configure as needed for production
    )

    # Add compression middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Setup CORS
    setup_cors(app)

    logger.info(f"FastAPI app created: {settings.app_name} v{settings.version}")

    return app
