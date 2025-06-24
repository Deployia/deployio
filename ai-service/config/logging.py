"""
Logging configuration for FastAPI service
"""

import logging
import logging.config
from pathlib import Path
from typing import Dict, Any


def get_logging_config(debug: bool = False) -> Dict[str, Any]:
    """Get logging configuration dictionary"""
    log_level = "DEBUG" if debug else "INFO"

    # Ensure logs directory exists
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": "colorlog.ColoredFormatter",
                "format": "%(asctime)s - %(name)s - %(log_color)s%(levelname)s%(reset)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
                "log_colors": {
                    "DEBUG": "cyan",
                    "INFO": "green",
                    "WARNING": "yellow",
                    "ERROR": "red",
                    "CRITICAL": "bold_red,bg_white",
                },
            },
            "file": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "()": "colorlog.ColoredFormatter",
                "format": "%(asctime)s - %(name)s - %(log_color)s%(levelname)s%(reset)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
                "log_colors": {
                    "DEBUG": "cyan",
                    "INFO": "green",
                    "WARNING": "yellow",
                    "ERROR": "red",
                    "CRITICAL": "bold_red,bg_white",
                },
            },
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "file",
                "filename": str(logs_dir / "ai-service.log"),
                "maxBytes": 5242880,  # 5MB
                "backupCount": 3,
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "file",
                "filename": str(logs_dir / "error.log"),
                "maxBytes": 5242880,  # 5MB
                "backupCount": 3,
                "level": "ERROR",
            },
            "access": {
                "class": "logging.StreamHandler",
                "formatter": "access",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            # FastAPI app logger
            "fastapi": {
                "level": log_level,
                "handlers": ["default", "file", "error_file"],
                "propagate": False,
            },
            # Uvicorn loggers
            "uvicorn": {
                "level": "INFO",
                "handlers": ["default", "file"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["access", "file"],
                "propagate": False,
            },
            # Database loggers - silenced
            "pymongo": {
                "level": "ERROR",
                "handlers": ["default", "error_file"],
                "propagate": False,
            },
            "pymongo.topology": {
                "level": "ERROR",
                "handlers": ["default", "error_file"],
                "propagate": False,
            },
            "pymongo.connection": {
                "level": "ERROR",
                "handlers": ["default", "error_file"],
                "propagate": False,
            },
            "pymongo.serverSelection": {
                "level": "ERROR",
                "handlers": ["default", "error_file"],
                "propagate": False,
            },
            "pymongo.command": {
                "level": "ERROR",
                "handlers": ["default", "error_file"],
                "propagate": False,
            },
            "motor": {
                "level": "ERROR",
                "handlers": ["default", "error_file"],
                "propagate": False,
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["default", "file", "error_file"],
        },
    }


def setup_logging(debug: bool = False) -> None:
    """Setup logging configuration for FastAPI service"""
    config = get_logging_config(debug=debug)
    logging.config.dictConfig(config)

    # Log configuration status
    logger = logging.getLogger(__name__)
    log_level = "DEBUG" if debug else "INFO"
    logger.info(f"Logging configured - Level: {log_level}")
    logger.info("Database loggers silenced to reduce noise")


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name"""
    return logging.getLogger(name)
