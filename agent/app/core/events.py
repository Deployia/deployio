"""
Application events - startup and shutdown handlers
"""

import logging
from app.services.log_bridge import log_bridge_service
from app.services.health_monitor import health_monitor

logger = logging.getLogger(__name__)


async def startup_events():
    """Handle application startup events"""
    logger.info("Starting DeployIO Agent services...")

    try:
        # Start log bridge service
        await log_bridge_service.start()
        logger.info("Log bridge service started successfully")

        # Start health monitoring
        await health_monitor.start()
        logger.info("Health monitoring started successfully")

    except Exception as e:
        logger.error(f"Failed to start services: {e}")
        raise


async def shutdown_events():
    """Handle application shutdown events"""
    logger.info("Shutting down DeployIO Agent services...")

    try:
        # Stop health monitoring
        await health_monitor.stop()
        logger.info("Health monitoring stopped")

        # Stop log bridge service
        await log_bridge_service.stop()
        logger.info("Log bridge service stopped")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
        raise
