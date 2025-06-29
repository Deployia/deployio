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

    except Exception as e:
        logger.error(f"Failed to start services: {e}")
        logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
        # Don't raise - let the application continue even if some services fail
        logger.warning("Some services failed to start, but application will continue")


async def shutdown_events():
    """Handle application shutdown events"""
    logger.info("Shutting down DeployIO Agent services...")

    try:
        # Stop health monitoring
        await health_monitor.stop()
        logger.info("Health monitoring stopped")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
        raise
