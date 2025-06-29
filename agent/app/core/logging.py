"""
Logging configuration for DeployIO Agent
"""

import logging
import logging.config
from pathlib import Path
from app.core.config import settings


def get_logging_config(debug: bool = False):
    """Get logging configuration dictionary for DeployIO Agent"""
    log_level = "DEBUG" if debug else settings.log_level.upper()
    logs_dir = Path(__file__).parent.parent.parent / "logs"
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
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
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
                "filename": str(logs_dir / "agent.log"),
                "maxBytes": 10 * 1024 * 1024,  # 10MB
                "backupCount": 5,
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "file",
                "filename": str(logs_dir / "error.log"),
                "maxBytes": 5 * 1024 * 1024,  # 5MB
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
            "docker": {
                "level": "INFO",
                "handlers": ["default", "file"],
                "propagate": False,
            },
            "socketio": {
                "level": "INFO",
                "handlers": ["default", "file"],
                "propagate": False,
            },
            "engineio": {
                "level": "INFO",
                "handlers": ["default", "file"],
                "propagate": False,
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["default", "file", "error_file"],
        },
    }


def setup_logging(debug: bool = False):
    """Setup logging configuration for DeployIO Agent"""

    config = get_logging_config(debug=debug or settings.debug)
    logging.config.dictConfig(config)
    logger = logging.getLogger(__name__)
    logger.info(
        f"Logging configured - Level: {'DEBUG' if debug or settings.debug else settings.log_level.upper()}"
    )
    logger.info("Docker, socketio, engineio loggers set to INFO")


def get_logger(name: str = None):
    """Get a logger with the given name, using the global logging config."""
    return logging.getLogger(name)
