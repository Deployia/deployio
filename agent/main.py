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
from services.log_bridge import agent_log_bridge, LogBridgeHandler

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


def setup_log_bridge_handler():
    """Set up the log bridge handler to capture all Python logs"""
    try:
        # Create the bridge handler
        bridge_handler = LogBridgeHandler(agent_log_bridge)
        bridge_handler.setLevel(logging.INFO)

        # Format logs appropriately
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        bridge_handler.setFormatter(formatter)

        # Add to root logger to capture all logs
        root_logger = logging.getLogger()
        root_logger.addHandler(bridge_handler)

        # Also add to specific loggers we care about
        important_loggers = [
            "uvicorn",
            "uvicorn.access",
            "uvicorn.error",
            "fastapi",
            "__main__",
            "config",
            "routes",
            "services",
            "middleware",
        ]

        for logger_name in important_loggers:
            logger_instance = logging.getLogger(logger_name)
            if bridge_handler not in logger_instance.handlers:
                logger_instance.addHandler(bridge_handler)

        logger.info("Log bridge handler configured for Python logging")

    except Exception as e:
        logger.error(f"Failed to setup log bridge handler: {e}")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting DeployIO Agent services...")

    # Start the log bridge
    try:
        log_bridge_started = await start_log_bridge()
        if log_bridge_started:
            logger.info("Log bridge started successfully")

            # Set up the log handler after bridge is running
            setup_log_bridge_handler()

            # Test log to verify it's working
            logger.info("Log bridge integration test - this should appear in admin UI")

        else:
            logger.warning("Log bridge failed to start")
    except Exception as e:
        logger.error(f"Log bridge startup error: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down DeployIO Agent services...")

    # Stop the log bridge
    try:
        from services.log_bridge_starter import stop_log_bridge

        await stop_log_bridge()
        logger.info("Log bridge stopped")
    except Exception as e:
        logger.error(f"Log bridge shutdown error: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
