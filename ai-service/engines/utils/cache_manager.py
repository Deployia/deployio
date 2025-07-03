"""
Cache Manager

Redis-based caching system for analysis results and intermediate data.
Provides efficient caching with TTL support and cache invalidation.
"""

import os
import json
import hashlib
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logging.warning("Redis not available. Caching will be disabled.")

from models.analysis_models import AnalysisResult

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Redis-based cache manager for analysis results and repository data.
    Provides efficient caching with TTL support and automatic cleanup.
    """
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.cache_ttl = int(os.getenv('CACHE_TTL', 3600))  # 1 hour default
        self.enabled = REDIS_AVAILABLE and os.getenv('REDIS_URL') is not None
        
        if self.enabled:
            self._initialize_redis()
        else:
            logger.warning("Cache manager disabled - Redis not available or not configured")
    
    def _initialize_redis(self):
        """Initialize Redis connection."""
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            logger.info("Redis cache manager initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            self.enabled = False
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Generic cache retrieval method.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self.enabled:
            return None
            
        try:
            cached_data = await self.redis_client.get(key)
            
            if cached_data:
                logger.debug(f"Cache hit for key: {key}")
                return json.loads(cached_data)
            
            logger.debug(f"Cache miss for key: {key}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve from cache for key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Generic cache storage method.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
            
        try:
            ttl = ttl or self.cache_ttl
            serialized_data = json.dumps(value, default=str)
            
            await self.redis_client.setex(key, ttl, serialized_data)
            logger.debug(f"Cached data for key: {key} (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache data for key {key}: {e}")
            return False
    
    def _generate_cache_key(self, repository_url: str, analysis_type: str = "full") -> str:
        """Generate a unique cache key for repository analysis."""
        # Create hash from repository URL and analysis type
        key_string = f"{repository_url}:{analysis_type}"
        hash_key = hashlib.md5(key_string.encode()).hexdigest()
        return f"analysis:{hash_key}"
    
    async def get_analysis_result(
        self,
        repository_url: str,
        analysis_type: str = "full"
    ) -> Optional[AnalysisResult]:
        """
        Retrieve cached analysis result.
        
        Args:
            repository_url: Repository URL
            analysis_type: Type of analysis (full, stack, dependencies, code)
            
        Returns:
            Cached analysis result or None if not found
        """
        if not self.enabled:
            return None
            
        try:
            cache_key = self._generate_cache_key(repository_url, analysis_type)
            cached_data = await self.redis_client.get(cache_key)
            
            if cached_data:
                logger.info(f"Cache hit for {repository_url}")
                data = json.loads(cached_data)
                return AnalysisResult.parse_obj(data)
            
            logger.debug(f"Cache miss for {repository_url}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve from cache: {e}")
            return None
    
    async def store_analysis_result(
        self,
        repository_url: str,
        analysis_result: AnalysisResult,
        analysis_type: str = "full",
        ttl: Optional[int] = None
    ) -> bool:
        """
        Store analysis result in cache.
        
        Args:
            repository_url: Repository URL
            analysis_result: Analysis result to cache
            analysis_type: Type of analysis
            ttl: Time to live in seconds (optional)
            
        Returns:
            True if stored successfully, False otherwise
        """
        if not self.enabled:
            return False
            
        try:
            cache_key = self._generate_cache_key(repository_url, analysis_type)
            cache_ttl = ttl or self.cache_ttl
            
            # Convert to dict and add metadata
            data = analysis_result.dict()
            data['_cached_at'] = datetime.utcnow().isoformat()
            data['_cache_version'] = "1.0"
            
            # Store with TTL
            await self.redis_client.setex(
                cache_key,
                cache_ttl,
                json.dumps(data, default=str)
            )
            
            logger.info(f"Cached analysis result for {repository_url} (TTL: {cache_ttl}s)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store in cache: {e}")
            return False
    
    async def invalidate_repository_cache(self, repository_url: str) -> int:
        """
        Invalidate all cached analysis results for a repository.
        
        Args:
            repository_url: Repository URL
            
        Returns:
            Number of keys invalidated
        """
        if not self.enabled:
            return 0
            
        try:
            # Find all cache keys for this repository
            pattern = f"analysis:*{hashlib.md5(repository_url.encode()).hexdigest()[:8]}*"
            keys = await self.redis_client.keys(pattern)
            
            if keys:
                deleted = await self.redis_client.delete(*keys)
                logger.info(f"Invalidated {deleted} cache entries for {repository_url}")
                return deleted
            
            return 0
            
        except Exception as e:
            logger.error(f"Failed to invalidate cache: {e}")
            return 0
    
    async def get_repository_metadata(self, repository_url: str) -> Optional[Dict[str, Any]]:
        """
        Get cached repository metadata (file structure, basic info).
        
        Args:
            repository_url: Repository URL
            
        Returns:
            Cached metadata or None if not found
        """
        if not self.enabled:
            return None
            
        try:
            metadata_key = f"metadata:{hashlib.md5(repository_url.encode()).hexdigest()}"
            cached_data = await self.redis_client.get(metadata_key)
            
            if cached_data:
                return json.loads(cached_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve metadata from cache: {e}")
            return None
    
    async def store_repository_metadata(
        self,
        repository_url: str,
        metadata: Dict[str, Any],
        ttl: Optional[int] = None
    ) -> bool:
        """
        Store repository metadata in cache.
        
        Args:
            repository_url: Repository URL
            metadata: Metadata to cache
            ttl: Time to live in seconds
            
        Returns:
            True if stored successfully, False otherwise
        """
        if not self.enabled:
            return False
            
        try:
            metadata_key = f"metadata:{hashlib.md5(repository_url.encode()).hexdigest()}"
            cache_ttl = ttl or (self.cache_ttl * 2)  # Metadata lasts longer
            
            # Add cache metadata
            metadata['_cached_at'] = datetime.utcnow().isoformat()
            
            await self.redis_client.setex(
                metadata_key,
                cache_ttl,
                json.dumps(metadata, default=str)
            )
            
            logger.debug(f"Cached metadata for {repository_url}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store metadata in cache: {e}")
            return False
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics and health information.
        
        Returns:
            Cache statistics dictionary
        """
        if not self.enabled:
            return {"enabled": False, "reason": "Redis not available or configured"}
            
        try:
            info = await self.redis_client.info()
            
            # Count our cache keys
            analysis_keys = await self.redis_client.keys("analysis:*")
            metadata_keys = await self.redis_client.keys("metadata:*")
            
            return {
                "enabled": True,
                "redis_version": info.get("redis_version"),
                "memory_used": info.get("used_memory_human"),
                "total_keys": info.get("db0", {}).get("keys", 0),
                "analysis_cache_entries": len(analysis_keys),
                "metadata_cache_entries": len(metadata_keys),
                "cache_ttl": self.cache_ttl,
                "uptime": info.get("uptime_in_seconds")
            }
            
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"enabled": False, "error": str(e)}
    
    async def cleanup_expired_cache(self) -> int:
        """
        Manually cleanup expired cache entries.
        
        Returns:
            Number of entries cleaned up
        """
        if not self.enabled:
            return 0
            
        try:
            # Redis automatically handles TTL expiration,
            # but we can cleanup entries with old cache versions
            all_keys = await self.redis_client.keys("analysis:*")
            cleaned = 0
            
            for key in all_keys:
                try:
                    data = await self.redis_client.get(key)
                    if data:
                        parsed = json.loads(data)
                        # Check cache version - cleanup old versions
                        if parsed.get('_cache_version') != "1.0":
                            await self.redis_client.delete(key)
                            cleaned += 1
                except Exception:
                    # If we can't parse the data, it's corrupted - delete it
                    await self.redis_client.delete(key)
                    cleaned += 1
            
            if cleaned > 0:
                logger.info(f"Cleaned up {cleaned} invalid cache entries")
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Failed to cleanup cache: {e}")
            return 0
    
    async def health_check(self) -> bool:
        """
        Check if cache is healthy and accessible.
        
        Returns:
            True if cache is healthy, False otherwise
        """
        if not self.enabled:
            return False
            
        try:
            # Simple ping test
            await self.redis_client.ping()
            return True
            
        except Exception as e:
            logger.error(f"Cache health check failed: {e}")
            return False
    
    async def close(self):
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Cache manager connection closed")
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Generic cache retrieval method.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        if not self.enabled:
            return None
            
        try:
            cached_data = await self.redis_client.get(key)
            
            if cached_data:
                logger.debug(f"Cache hit for key: {key}")
                return json.loads(cached_data)
            
            logger.debug(f"Cache miss for key: {key}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve from cache for key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Generic cache storage method.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
            
        try:
            ttl = ttl or self.cache_ttl
            serialized_data = json.dumps(value, default=str)
            
            await self.redis_client.setex(key, ttl, serialized_data)
            logger.debug(f"Cached data for key: {key} (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache data for key {key}: {e}")
            return False
