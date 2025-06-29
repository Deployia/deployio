"""
DeployIO Agent - Application Entry Point
Modular FastAPI service following microservice architecture
"""

import sys
import time
import logging
from contextlib import asynccontextmanager

# Fix Windows console encoding issues
if sys.platform.startswith("win"):
    import codecs

    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware import setup_exception_handlers, AuthMiddleware
from app.routes import include_routes
from app.core.events import startup_events, shutdown_events

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Server start time for uptime calculation
server_start = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await startup_events()
    yield
    # Shutdown
    await shutdown_events()


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    # Create FastAPI app with lifespan
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=settings.description,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/agent/v1/docs",
        redoc_url="/agent/v1/redoc",
        openapi_url="/agent/v1/openapi.json",
    )

    # Add CORS middleware
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins.split(","),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Setup exception handlers
    setup_exception_handlers(app)

    # Add authentication middleware
    app.add_middleware(AuthMiddleware, agent_secret=settings.agent_secret)

    # Include routes
    include_routes(app)

    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
