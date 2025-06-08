"""
Database configuration and connection management for FastAPI service
"""

import os
import asyncio
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)


# Database configuration
class DatabaseConfig:
    def __init__(self):
        self.MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/deployio")
        self.MAX_RETRIES = 5
        self.RETRY_DELAY = 5
        self.CONNECTION_TIMEOUT = 5000

    def get_database_name(self):
        """Extract database name from MongoDB URI"""
        try:
            client = MongoClient(self.MONGO_URI)
            return client.get_database().name
        except Exception:
            return "deployio"  # fallback database name


# Global database connection
db_config = DatabaseConfig()
db = None
mongodb_connection_status = "initializing"


def get_sync_db_connection():
    """Get synchronous MongoDB connection for health checks"""
    try:
        client = MongoClient(
            db_config.MONGO_URI, serverSelectionTimeoutMS=db_config.CONNECTION_TIMEOUT
        )
        # Test connection
        client.admin.command("ismaster")
        logger.info(f"MongoDB connection successful to {db_config.MONGO_URI}")

        db_name = db_config.get_database_name()
        return client[db_name], "connected"
    except ConnectionFailure as e:
        logger.error(f"MongoDB connection failed to {db_config.MONGO_URI}: {e}")
        return None, "disconnected"
    except Exception as e:
        logger.error(
            f"An error occurred with MongoDB client for {db_config.MONGO_URI}: {e}"
        )
        return None, "disconnected"


async def get_async_db_connection():
    """Get async MongoDB connection"""
    try:
        client = AsyncIOMotorClient(
            db_config.MONGO_URI, serverSelectionTimeoutMS=db_config.CONNECTION_TIMEOUT
        )
        # Test connection
        await client.admin.command("ismaster")
        logger.info(f"Async MongoDB connection successful to {db_config.MONGO_URI}")

        db_name = db_config.get_database_name()
        return client[db_name], "connected"
    except Exception as e:
        logger.error(f"Async MongoDB connection failed: {e}")
        return None, "disconnected"


async def initialize_database():
    """Initialize database connection with retries"""
    global db, mongodb_connection_status

    for attempt in range(1, db_config.MAX_RETRIES + 1):
        logger.info(f"MongoDB connection attempt {attempt}/{db_config.MAX_RETRIES}...")

        db_conn, status = await get_async_db_connection()
        if status == "connected":
            db = db_conn
            mongodb_connection_status = status
            logger.info("Database initialized successfully")
            return db_conn, status

        if attempt < db_config.MAX_RETRIES:
            logger.info(f"Retrying in {db_config.RETRY_DELAY} seconds...")
            await asyncio.sleep(db_config.RETRY_DELAY)

    logger.error("Failed to connect to MongoDB after multiple attempts")
    mongodb_connection_status = "disconnected"
    return None, "disconnected"


def get_database():
    """Get the current database connection"""
    return db


def get_connection_status():
    """Get current MongoDB connection status"""
    return mongodb_connection_status
