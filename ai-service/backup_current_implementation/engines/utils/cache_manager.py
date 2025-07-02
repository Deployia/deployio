"""
Cache Manager - Clean Redis caching interface
Efficient caching for analysis results
"""

import json
import logging
from typing import Any, Optional
from config.redis_client import get_redis_client

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Clean cache management for analysis results

    Features:
    - JSON serialization/deserialization
    - TTL management
    - Error handling and fallback
    - Key namespacing
    """

    def __init__(self, namespace: str = "ai_analysis"):
        self.namespace = namespace
        self.redis_client = None

    async def _get_client(self):
        """Get async Redis client with error handling"""
        if not self.redis_client:
            try:
                self.redis_client = await get_redis_client()
            except Exception as e:
                logger.warning(f"Redis client unavailable: {e}")
                return None
        return self.redis_client

    def _make_key(self, key: str) -> str:
        """Create namespaced cache key"""
        return f"{self.namespace}:{key}"

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/error
        """
        try:
            client = await self._get_client()
            if not client:
                return None

            cached_data = await client.get(self._make_key(key))
            if cached_data:
                return json.loads(cached_data)

        except Exception as e:
            logger.debug(f"Cache get failed for key {key}: {e}")

        return None

    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """
        Set value in cache

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default: 1 hour)

        Returns:
            True if successful, False otherwise
        """
        try:
            client = await self._get_client()
            if not client:
                return False

            # Convert complex objects to serializable format
            serializable_value = self._make_serializable(value)
            json_data = json.dumps(serializable_value, default=str)

            await client.set(self._make_key(key), json_data, ex=ttl)
            logger.debug(f"Cached data for key {key} (TTL: {ttl}s)")
            return True

        except Exception as e:
            logger.warning(f"Cache set failed for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete value from cache

        Args:
            key: Cache key to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            client = await self._get_client()
            if not client:
                return False

            await client.delete(self._make_key(key))
            logger.debug(f"Deleted cache key {key}")
            return True

        except Exception as e:
            logger.warning(f"Cache delete failed for key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache

        Args:
            key: Cache key to check

        Returns:
            True if key exists, False otherwise
        """
        try:
            client = await self._get_client()
            if not client:
                return False

            exists = await client.exists(self._make_key(key))
            return bool(exists)

        except Exception as e:
            logger.debug(f"Cache exists check failed for key {key}: {e}")
            return False

    async def clear_namespace(self) -> int:
        """
        Clear all keys in this namespace

        Returns:
            Number of keys deleted
        """
        try:
            client = await self._get_client()
            if not client:
                return 0

            pattern = f"{self.namespace}:*"
            keys = await client.keys(pattern)

            if keys:
                deleted = await client.delete(*keys)
                logger.info(f"Cleared {deleted} keys from namespace {self.namespace}")
                return deleted

        except Exception as e:
            logger.warning(f"Cache namespace clear failed: {e}")

        return 0

    async def get_stats(self) -> dict:
        """
        Get cache statistics for this namespace

        Returns:
            Dictionary with cache stats
        """
        try:
            client = await self._get_client()
            if not client:
                return {"status": "unavailable"}

            pattern = f"{self.namespace}:*"
            keys = await client.keys(pattern)

            return {
                "status": "available",
                "namespace": self.namespace,
                "key_count": len(keys),
                "sample_keys": keys[:5] if keys else [],
            }

        except Exception as e:
            logger.warning(f"Cache stats failed: {e}")
            return {"status": "error", "error": str(e)}

    async def test_connection(self) -> bool:
        """
        Test cache connection

        Returns:
            True if cache is available, False otherwise
        """
        try:
            client = await self._get_client()
            if not client:
                return False

            # Test with a simple ping
            await client.ping()
            return True

        except Exception as e:
            logger.debug(f"Cache connection test failed: {e}")
            return False

    def _make_serializable(self, value: Any) -> Any:
        """
        Convert complex objects to JSON-serializable format

        Args:
            value: Value to make serializable

        Returns:
            JSON-serializable version of the value
        """
        if hasattr(value, "__dict__"):
            # Handle dataclass or custom objects
            if hasattr(value, "__dataclass_fields__"):
                # It's a dataclass
                from dataclasses import asdict

                return asdict(value)
            else:
                # Custom object - try to convert to dict
                return {
                    k: self._make_serializable(v) for k, v in value.__dict__.items()
                }
        elif isinstance(value, (list, tuple)):
            return [self._make_serializable(item) for item in value]
        elif isinstance(value, dict):
            return {k: self._make_serializable(v) for k, v in value.items()}
        elif hasattr(value, "value"):
            # Handle enums
            return value.value
        else:
            # Primitive type or already serializable
            return value


# Convenience functions for common cache operations
async def cache_analysis_result(
    repository_url: str, branch: str, analysis_type: str, result: Any, ttl: int = 3600
) -> bool:
    """Cache analysis result with standardized key format"""
    cache = CacheManager("analysis")
    key = f"{repository_url.replace('/', '_')}:{branch}:{analysis_type}"
    return await cache.set(key, result, ttl)


async def get_cached_analysis(
    repository_url: str, branch: str, analysis_type: str
) -> Optional[Any]:
    """Get cached analysis result with standardized key format"""
    cache = CacheManager("analysis")
    key = f"{repository_url.replace('/', '_')}:{branch}:{analysis_type}"
    return await cache.get(key)


async def cache_repository_data(
    repository_url: str, branch: str, data: Any, ttl: int = 1800  # 30 minutes
) -> bool:
    """Cache repository data (shorter TTL as it can change more frequently)"""
    cache = CacheManager("repo_data")
    key = f"{repository_url.replace('/', '_')}:{branch}"
    return await cache.set(key, data, ttl)


async def get_cached_repository_data(repository_url: str, branch: str) -> Optional[Any]:
    """Get cached repository data"""
    cache = CacheManager("repo_data")
    key = f"{repository_url.replace('/', '_')}:{branch}"
    return await cache.get(key)
