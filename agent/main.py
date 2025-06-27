#!/usr/bin/env python3
"""
DeployIO Agent - FastAPI Service for Container Deployment Management
"""

import time
import logging
from config import create_app
from config.settings import settings
from middleware import setup_exception_handlers, AuthMiddleware
from routes import create_routes
from services.log_bridge_starter import start_log_bridge

logger = logging.getLogger(__name__)

# Server start time for uptime calculation
server_start = time.time()

# Create FastAPI app
app = create_app()

# Setup exception handlers
setup_exception_handlers(app)

# Add authentication middleware
app.add_middleware(AuthMiddleware, agent_secret=settings.agent_secret)

# Include routes
app.include_router(create_routes())


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting DeployIO Agent services...")

    # Start the log bridge
    try:
        log_bridge_started = await start_log_bridge()
        if log_bridge_started:
            logger.info("✓ Log bridge started successfully")
        else:
            logger.warning("✗ Log bridge failed to start")
    except Exception as e:
        logger.error(f"✗ Log bridge startup error: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down DeployIO Agent services...")

    # Stop the log bridge
    try:
        from services.log_bridge_starter import stop_log_bridge

        await stop_log_bridge()
        logger.info("✓ Log bridge stopped")
    except Exception as e:
        logger.error(f"✗ Log bridge shutdown error: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
