"""
Logging configuration for DeployIO Agent
"""

import logging
import sys
import os
from logging.handlers import RotatingFileHandler
from app.core.config import settings


def setup_logging():
    """Setup logging configuration"""

    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)

    # Create handlers
    handlers = [logging.StreamHandler(sys.stdout)]

    # Add file handlers for persistent logging (fallback for HTTP polling)
    file_handler = RotatingFileHandler(
        "logs/agent.log", maxBytes=10 * 1024 * 1024, backupCount=5  # 10MB
    )
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    handlers.append(file_handler)

    # Error-specific log file
    error_handler = RotatingFileHandler(
        "logs/error.log", maxBytes=5 * 1024 * 1024, backupCount=3  # 5MB
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    handlers.append(error_handler)

    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
        force=True,  # Override any existing configuration
    )

    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    # Suppress overly verbose loggers
    logging.getLogger("docker").setLevel(logging.WARNING)
    logging.getLogger("socketio").setLevel(logging.WARNING)
    logging.getLogger("engineio").setLevel(logging.WARNING)


def get_logger(name: str = None):
    """Get a logger with the given name, using the global logging config."""
    return logging.getLogger(name)
