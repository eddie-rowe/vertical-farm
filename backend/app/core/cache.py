"""
Cache management for the FastAPI application.

This module provides caching functionality using in-memory storage
for development and testing purposes.
"""

import asyncio
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Simple in-memory cache manager for development and testing.

    In production, this should be replaced with Redis or another
    distributed cache solution.
    """

    def __init__(self) -> None:
        self._cache: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        """
        Get a value from the cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found or expired
        """
        async with self._lock:
            if key not in self._cache:
                return None

            cache_entry = self._cache[key]

            # Check if expired
            if cache_entry["expires_at"] and time.time() > cache_entry["expires_at"]:
                del self._cache[key]
                return None

            return cache_entry["value"]

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """
        Set a value in the cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: Time to live in seconds (None for no expiration)
        """
        async with self._lock:
            expires_at = None
            if ttl_seconds:
                expires_at = time.time() + ttl_seconds

            self._cache[key] = {
                "value": value,
                "expires_at": expires_at,
                "created_at": time.time(),
            }

    async def delete(self, key: str) -> bool:
        """
        Delete a key from the cache.

        Args:
            key: Cache key to delete

        Returns:
            True if key was deleted, False if not found
        """
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    async def clear(self) -> None:
        """Clear all cache entries."""
        async with self._lock:
            self._cache.clear()

    async def exists(self, key: str) -> bool:
        """
        Check if a key exists in the cache.

        Args:
            key: Cache key to check

        Returns:
            True if key exists and is not expired
        """
        return await self.get(key) is not None

    async def keys(self, pattern: str | None = None) -> list[str]:
        """
        Get all cache keys, optionally filtered by pattern.

        Args:
            pattern: Optional pattern to filter keys (basic string matching)

        Returns:
            List of cache keys
        """
        async with self._lock:
            all_keys = list(self._cache.keys())

            if pattern:
                return [key for key in all_keys if pattern in key]

            return all_keys

    async def cleanup_expired(self) -> int:
        """
        Remove expired entries from the cache.

        Returns:
            Number of entries removed
        """
        async with self._lock:
            current_time = time.time()
            expired_keys = []

            for key, cache_entry in self._cache.items():
                if (
                    cache_entry["expires_at"]
                    and current_time > cache_entry["expires_at"]
                ):
                    expired_keys.append(key)

            for key in expired_keys:
                del self._cache[key]

            return len(expired_keys)

    async def stats(self) -> dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache statistics
        """
        async with self._lock:
            total_entries = len(self._cache)
            expired_count = 0
            current_time = time.time()

            for cache_entry in self._cache.values():
                if (
                    cache_entry["expires_at"]
                    and current_time > cache_entry["expires_at"]
                ):
                    expired_count += 1

            return {
                "total_entries": total_entries,
                "expired_entries": expired_count,
                "active_entries": total_entries - expired_count,
                "memory_usage_estimate": len(str(self._cache)),
            }


# Global cache manager instance
_cache_manager: CacheManager | None = None


def get_cache_manager() -> CacheManager:
    """
    Get the global cache manager instance.

    Returns:
        CacheManager instance
    """
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


async def cache_dependency() -> CacheManager:
    """
    FastAPI dependency for getting the cache manager.

    Returns:
        CacheManager instance
    """
    return get_cache_manager()
