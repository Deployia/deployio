"""
Initialization module for setting up FastAPI app with middleware and configurations
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .cors import setup_cors
from .redis_client import get_redis_client
from .settings import settings
from .logging import setup_logging, get_logger
from websockets.manager import ai_websocket_manager

# Setup logging configuration
setup_logging(debug=settings.debug)

logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application with custom lifespan"""

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup
        await get_redis_client()  # Only Redis for caching AI results
        if settings.websocket_enabled:
            try:
                success = await ai_websocket_manager.initialize()
                if success:
                    logger.info("WebSocket connection to server established")
                else:
                    logger.error("Failed to connect to server WebSocket")
            except Exception as e:
                logger.error(f"WebSocket initialization error: {e}")
        yield
        # Shutdown
        if settings.websocket_enabled:
            await ai_websocket_manager.disconnect()

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=settings.description,
        debug=settings.debug,
        docs_url="/service/v1/docs",
        redoc_url="/service/v1/redoc",
        openapi_url="/service/v1/openapi.json",
        openapi_version="3.0.3",
        lifespan=lifespan,
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
