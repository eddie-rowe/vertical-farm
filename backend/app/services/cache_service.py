"""
Cache service for managing application-wide caching functionality.

This module provides a centralized cache service that can be used
across the application for storing and retrieving cached data.
"""

import logging
import time
from datetime import datetime
from typing import Any

from ..core.cache import CacheManager

logger = logging.getLogger(__name__)


class CacheService:
    """
    Service for managing application caching operations.

    This service provides high-level caching operations and statistics
    for the application.
    """

    def __init__(self) -> None:
        self.cache_manager = CacheManager()
        self._stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "clears": 0,
            "start_time": time.time(),
        }

    async def get(self, key: str) -> Any | None:
        """
        Get a value from the cache.

        Args:
            key: The cache key

        Returns:
            The cached value if found, None otherwise
        """
        try:
            value = await self.cache_manager.get(key)
            if value is not None:
                self._stats["hits"] += 1
                logger.debug(f"Cache hit for key: {key}")
            else:
                self._stats["misses"] += 1
                logger.debug(f"Cache miss for key: {key}")
            return value
        except Exception as e:
            logger.error(f"Error getting cache key {key}: {e}")
            self._stats["misses"] += 1
            return None

    async def set(self, key: str, value: Any, ttl: int | None = None) -> bool:
        """
        Set a value in the cache.

        Args:
            key: The cache key
            value: The value to cache
            ttl: Time to live in seconds

        Returns:
            True if successful, False otherwise
        """
        try:
            await self.cache_manager.set(key, value, ttl)
            self._stats["sets"] += 1
            logger.debug(f"Cache set for key: {key}")
            return True
        except Exception as e:
            logger.error(f"Error setting cache key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete a value from the cache.

        Args:
            key: The cache key to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            await self.cache_manager.delete(key)
            self._stats["deletes"] += 1
            logger.debug(f"Cache delete for key: {key}")
            return True
        except Exception as e:
            logger.error(f"Error deleting cache key {key}: {e}")
            return False

    async def clear(self) -> bool:
        """
        Clear all cached values.

        Returns:
            True if successful, False otherwise
        """
        try:
            await self.cache_manager.clear()
            self._stats["clears"] += 1
            logger.info("Cache cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False

    async def get_stats(self) -> dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary containing cache statistics
        """
        current_time = time.time()
        uptime = current_time - self._stats["start_time"]

        total_requests = self._stats["hits"] + self._stats["misses"]
        hit_rate = (
            (self._stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        )

        cache_size = await self.cache_manager.size()

        return {
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "hit_rate_percent": round(hit_rate, 2),
            "sets": self._stats["sets"],
            "deletes": self._stats["deletes"],
            "clears": self._stats["clears"],
            "total_requests": total_requests,
            "cache_size": cache_size,
            "uptime_seconds": round(uptime, 2),
            "start_time": datetime.fromtimestamp(self._stats["start_time"]).isoformat(),
        }

    async def health_check(self) -> dict[str, Any]:
        """
        Perform a health check on the cache service.

        Returns:
            Dictionary containing health status
        """
        try:
            # Test basic cache operations
            test_key = "__health_check__"
            test_value = {"timestamp": time.time()}

            # Test set operation
            set_success = await self.set(test_key, test_value, ttl=60)
            if not set_success:
                return {
                    "healthy": False,
                    "error": "Failed to set test value",
                    "timestamp": datetime.utcnow().isoformat(),
                }

            # Test get operation
            retrieved_value = await self.get(test_key)
            if retrieved_value != test_value:
                return {
                    "healthy": False,
                    "error": "Failed to retrieve test value",
                    "timestamp": datetime.utcnow().isoformat(),
                }

            # Test delete operation
            delete_success = await self.delete(test_key)
            if not delete_success:
                return {
                    "healthy": False,
                    "error": "Failed to delete test value",
                    "timestamp": datetime.utcnow().isoformat(),
                }

            # Get current stats
            stats = await self.get_stats()

            return {
                "healthy": True,
                "cache_size": stats["cache_size"],
                "hit_rate_percent": stats["hit_rate_percent"],
                "uptime_seconds": stats["uptime_seconds"],
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Cache health check failed: {e}")
            return {
                "healthy": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }


# Global cache service instance
_cache_service: CacheService | None = None


async def get_cache_service() -> CacheService:
    """
    Get the global cache service instance.

    Returns:
        The cache service instance
    """
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


# For backward compatibility
cache_service = get_cache_service
