"""
Application events - startup and shutdown handlers
"""

import logging
from app.core.config import settings
from app.services.health_monitor import health_monitor

logger = logging.getLogger(__name__)


async def startup_events():
    """Handle application startup events"""
    logger.info("Starting DeployIO Agent services...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Platform URL: {settings.platform_url}")
    logger.info(f"Agent ID: {settings.agent_id}")

    try:
        # Start health monitoring
        logger.info("Attempting to start health monitoring...")
        await health_monitor.start()
        logger.info("Health monitoring started successfully")

        # Initialize and connect WebSocket service
        if settings.log_bridge_enabled:
            logger.info("Initializing WebSocket bridge service...")
            try:
                from app.websockets import initialize_websockets, connect_websockets

                # Initialize WebSocket infrastructure
                ws_initialized = await initialize_websockets()
                if ws_initialized:
                    logger.info("WebSocket service initialized successfully")

                    # Connect to server
                    ws_connected = await connect_websockets()
                    if ws_connected:
                        logger.info("✅ WebSocket bridge connected to DeployIO Server")
                    else:
                        logger.warning(
                            "WebSocket bridge failed to connect - will retry automatically"
                        )
                else:
                    logger.error("Failed to initialize WebSocket service")

            except Exception as e:
                logger.error(f"WebSocket bridge initialization failed: {e}")
                logger.warning("Agent will continue without WebSocket bridge")
        else:
            logger.info("WebSocket bridge disabled in configuration")

    except Exception as e:
        logger.error(f"Failed to start services: {e}")
        logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
        # Don't raise - let the application continue even if some services fail
        logger.warning("Some services failed to start, but application will continue")


async def shutdown_events():
    """Handle application shutdown events"""
    logger.info("Shutting down DeployIO Agent services...")

    try:
        # Shutdown WebSocket service
        if settings.log_bridge_enabled:
            try:
                from app.websockets import cleanup_websockets

                logger.info("Shutting down WebSocket bridge...")
                await cleanup_websockets()
                logger.info("✅ WebSocket bridge shutdown completed")
            except Exception as e:
                logger.error(f"Error shutting down WebSocket bridge: {e}")

        # Stop health monitoring
        await health_monitor.stop()
        logger.info("Health monitoring stopped")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
        raise
