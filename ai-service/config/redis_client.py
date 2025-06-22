"""
Redis configuration and connection management for FastAPI service
"""

import os
import logging
import redis.asyncio as redis
from typing import Optional

logger = logging.getLogger(__name__)

# Global Redis client
redis_client: Optional[redis.Redis] = None
redis_connection_status = "initializing"


def get_redis_url() -> str:
    """
    Determines the Redis connection URL.
    Uses REDIS_URL from environment if available.
    Defaults to 'redis://redis:6379' if NODE_ENV is 'production' (Docker context).
    Defaults to 'redis://localhost:6379' otherwise (local development context).
    """
    if os.getenv("REDIS_URL"):
        return os.getenv("REDIS_URL")

    environment = os.getenv("NODE_ENV", "development")
    return (
        "redis://redis:6379"
        if environment == "production"
        else "redis://localhost:6379"
    )


async def init_redis_client() -> Optional[redis.Redis]:
    """Initialize async Redis client (singleton)"""
    global redis_client, redis_connection_status

    if redis_client:
        return redis_client

    redis_url = get_redis_url()
    logger.info(f"Attempting to connect to Redis at: {redis_url}")

    try:
        redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        await redis_client.ping()
        redis_connection_status = "connected"
        logger.info(f"Redis Connected: {redis_url}")
        return redis_client

    except Exception as error:
        logger.warning(f"Redis connection failed at {redis_url}: {error}")
        logger.warning("Continuing without Redis - caching will be disabled")
        redis_client = None
        redis_connection_status = "disconnected"
        return None


async def get_redis_client() -> Optional[redis.Redis]:
    """Get the async Redis client instance"""
    if redis_client:
        return redis_client
    return await init_redis_client()


def get_redis_connection_status() -> str:
    """Get current Redis connection status"""
    return redis_connection_status


def close_redis_client():
    """Close Redis connection"""
    global redis_client, redis_connection_status

    if redis_client:
        try:
            redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
        finally:
            redis_client = None
            redis_connection_status = "disconnected"
