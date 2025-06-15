"""
FastAPI Response Caching Middleware

Implements server-side response caching with:
- In-memory caching for fast access
- Configurable TTL per endpoint
- Cache-Control headers for client-side caching
- Automatic cache invalidation for mutations
- ETag support for efficient client revalidation
"""

import hashlib
import json
import time
from typing import Dict, Optional, Set, Callable, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class CacheEntry:
    def __init__(self, data: Any, ttl: int, etag: str):
        self.data = data
        self.created_at = time.time()
        self.ttl = ttl
        self.etag = etag
        self.access_count = 0
        self.last_accessed = time.time()

    def is_expired(self) -> bool:
        return time.time() - self.created_at > self.ttl

    def access(self):
        self.access_count += 1
        self.last_accessed = time.time()

class CacheConfig:
    def __init__(self):
        # Cache TTL configurations per endpoint pattern
        self.endpoint_ttl: Dict[str, int] = {
            '/api/v1/farms': 300,  # 5 minutes
            '/api/v1/farms/{farm_id}': 600,  # 10 minutes
            '/api/v1/farms/{farm_id}/hierarchy': 900,  # 15 minutes
            '/api/v1/device-assignments': 180,  # 3 minutes
            '/api/v1/device-status': 60,  # 1 minute
            '/api/v1/users/profile': 1800,  # 30 minutes
        }
        
        # Endpoints that should never be cached
        self.never_cache: Set[str] = {
            '/health', '/healthz', '/cors-test', '/debug/'
        }
        
        # Endpoints that invalidate caches when called
        self.invalidation_patterns: Dict[str, Set[str]] = {
            'POST:/api/v1/farms': {'/api/v1/farms'},
            'PUT:/api/v1/farms': {'/api/v1/farms', '/api/v1/farms/{farm_id}'},
            'DELETE:/api/v1/farms': {'/api/v1/farms', '/api/v1/farms/{farm_id}'},
            'POST:/api/v1/device-assignments': {'/api/v1/device-assignments'},
            'PUT:/api/v1/device-assignments': {'/api/v1/device-assignments'},
            'DELETE:/api/v1/device-assignments': {'/api/v1/device-assignments'},
        }

class ResponseCacheMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_cache_size: int = 1000):
        super().__init__(app)
        self.cache: Dict[str, CacheEntry] = {}
        self.config = CacheConfig()
        self.max_cache_size = max_cache_size
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip caching for non-GET requests and excluded endpoints
        if request.method != "GET" or self._should_skip_cache(request):
            logger.info(f"CACHE: Skipping cache for {request.method} {request.url.path}")
            response = await call_next(request)
            # Handle cache invalidation for mutations
            if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                self._invalidate_caches(request)
            return response

        # Generate cache key
        cache_key = self._generate_cache_key(request)
        logger.info(f"CACHE: Processing {request.url.path}, cache key: {cache_key[:8]}...")
        
        # Check for cached response
        cached_entry = self._get_cached_response(cache_key)
        if cached_entry:
            logger.info(f"CACHE: HIT for {request.url.path}")
            # Handle If-None-Match header (ETag validation)
            if_none_match = request.headers.get("if-none-match")
            if if_none_match == cached_entry.etag:
                return Response(status_code=304)  # Not Modified
            
            # Return cached response
            cached_entry.access()
            response = JSONResponse(
                content=cached_entry.data,
                headers={
                    "X-Cache": "HIT",
                    "ETag": cached_entry.etag,
                    "Cache-Control": f"max-age={self._get_ttl(request)}",
                }
            )
            return response

        # Execute request
        response = await call_next(request)
        logger.info(f"CACHE: Response status: {response.status_code}, content-type: {response.headers.get('content-type')}")
        
        # Cache successful JSON responses
        if response.status_code == 200:
            cached_response = await self._cache_response(cache_key, request, response)
            if cached_response:
                logger.info(f"CACHE: MISS for {request.url.path} - response cached")
                return cached_response
            else:
                logger.info(f"CACHE: MISS for {request.url.path} - response not cached")
            
        return response

    def _should_skip_cache(self, request: Request) -> bool:
        """Determine if this request should skip caching"""
        path = request.url.path
        
        # Check never-cache patterns
        for pattern in self.config.never_cache:
            if pattern in path:
                return True
                
        # Skip if user-specific (has authorization header)
        if "authorization" in request.headers:
            # Could implement user-specific caching here
            pass
            
        return False

    def _generate_cache_key(self, request: Request) -> str:
        """Generate a unique cache key for the request"""
        # Include path, query parameters, and relevant headers
        key_components = [
            request.method,
            request.url.path,
            str(sorted(request.query_params.items())),
        ]
        
        # Include user ID if authenticated (for user-specific caching)
        user_id = request.headers.get("x-user-id", "anonymous")
        key_components.append(user_id)
        
        key_string = "|".join(key_components)
        return hashlib.md5(key_string.encode()).hexdigest()

    def _get_cached_response(self, cache_key: str) -> Optional[CacheEntry]:
        """Retrieve cached response if valid"""
        if cache_key not in self.cache:
            return None
            
        entry = self.cache[cache_key]
        if entry.is_expired():
            del self.cache[cache_key]
            return None
            
        return entry

    async def _cache_response(self, cache_key: str, request: Request, response: Response) -> Optional[Response]:
        """Cache the response if it meets criteria"""
        try:
            # Only cache JSON responses
            content_type = response.headers.get("content-type", "")
            if "application/json" not in content_type:
                return None
                
            # Read response body
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
                
            # Parse JSON response
            response_data = json.loads(response_body.decode())
            
            # Generate ETag
            etag = f'"{hashlib.md5(response_body).hexdigest()}"'
            
            # Get TTL for this endpoint
            ttl = self._get_ttl(request)
            
            # Create cache entry
            cache_entry = CacheEntry(response_data, ttl, etag)
            
            # Store in cache (with size limit)
            if len(self.cache) >= self.max_cache_size:
                self._evict_lru()
                
            self.cache[cache_key] = cache_entry
            
            # Create new response with cache headers
            headers = dict(response.headers)
            headers.update({
                "X-Cache": "MISS",
                "ETag": etag,
                "Cache-Control": f"public, max-age={ttl}, must-revalidate",
                "Last-Modified": time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime()),
                "Vary": "Accept-Encoding"
            })
            
            # Return new response with cached body and headers
            return JSONResponse(
                content=response_data,
                status_code=response.status_code,
                headers=headers
            )
            
        except Exception as e:
            logger.warning(f"Failed to cache response: {e}")
            return None

    def _get_ttl(self, request: Request) -> int:
        """Get TTL for the request endpoint"""
        path = request.url.path
        
        # Check exact matches first
        if path in self.config.endpoint_ttl:
            return self.config.endpoint_ttl[path]
            
        # Check pattern matches
        for pattern, ttl in self.config.endpoint_ttl.items():
            if self._path_matches_pattern(path, pattern):
                return ttl
                
        # Default TTL
        return 300  # 5 minutes

    def _path_matches_pattern(self, path: str, pattern: str) -> bool:
        """Check if path matches a pattern with placeholders"""
        path_parts = path.strip("/").split("/")
        pattern_parts = pattern.strip("/").split("/")
        
        if len(path_parts) != len(pattern_parts):
            return False
            
        for path_part, pattern_part in zip(path_parts, pattern_parts):
            if pattern_part.startswith("{") and pattern_part.endswith("}"):
                continue  # Wildcard match
            if path_part != pattern_part:
                return False
                
        return True

    def _invalidate_caches(self, request: Request):
        """Invalidate caches based on mutation operations"""
        operation_key = f"{request.method}:{request.url.path}"
        
        patterns_to_invalidate = set()
        
        # Check exact operation matches
        if operation_key in self.config.invalidation_patterns:
            patterns_to_invalidate.update(self.config.invalidation_patterns[operation_key])
            
        # Check pattern-based invalidation
        for pattern, cache_patterns in self.config.invalidation_patterns.items():
            if self._operation_matches_pattern(operation_key, pattern):
                patterns_to_invalidate.update(cache_patterns)
        
        # Invalidate matching cache entries
        keys_to_remove = []
        for cache_key, entry in self.cache.items():
            for pattern in patterns_to_invalidate:
                # This is simplified - in production you'd want to store
                # reverse mappings from cache keys to patterns
                keys_to_remove.append(cache_key)
                break
                
        for key in keys_to_remove:
            if key in self.cache:
                del self.cache[key]
                
        if keys_to_remove:
            logger.info(f"Invalidated {len(keys_to_remove)} cache entries for operation {operation_key}")

    def _operation_matches_pattern(self, operation: str, pattern: str) -> bool:
        """Check if operation matches invalidation pattern"""
        # Simple pattern matching - could be enhanced
        return operation == pattern

    def _evict_lru(self):
        """Evict least recently used cache entries"""
        if not self.cache:
            return
            
        # Find LRU entry
        lru_key = min(self.cache.keys(), key=lambda k: self.cache[k].last_accessed)
        del self.cache[lru_key]

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring"""
        total_entries = len(self.cache)
        total_size_mb = sum(len(str(entry.data)) for entry in self.cache.values()) / (1024 * 1024)
        
        # Calculate hit rates (would need to track hits/misses in production)
        stats = {
            "total_entries": total_entries,
            "total_size_mb": round(total_size_mb, 2),
            "max_cache_size": self.max_cache_size,
            "entries_by_age": self._get_age_distribution(),
        }
        
        return stats

    def _get_age_distribution(self) -> Dict[str, int]:
        """Get distribution of cache entry ages"""
        now = time.time()
        distribution = {"0-60s": 0, "1-5m": 0, "5-15m": 0, "15m+": 0}
        
        for entry in self.cache.values():
            age = now - entry.created_at
            if age < 60:
                distribution["0-60s"] += 1
            elif age < 300:
                distribution["1-5m"] += 1
            elif age < 900:
                distribution["5-15m"] += 1
            else:
                distribution["15m+"] += 1
                
        return distribution

    def clear_cache(self, pattern: Optional[str] = None):
        """Clear cache entries, optionally matching a pattern"""
        if pattern is None:
            self.cache.clear()
            logger.info("Cleared entire cache")
        else:
            # Pattern-based clearing would require more sophisticated key tracking
            keys_to_remove = [k for k in self.cache.keys() if pattern in k]
            for key in keys_to_remove:
                del self.cache[key]
            logger.info(f"Cleared {len(keys_to_remove)} cache entries matching pattern: {pattern}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        total_entries = len(self.cache)
        total_size_mb = sum(len(str(entry.data)) for entry in self.cache.values()) / (1024 * 1024)
        
        return {
            "size": total_entries,
            "total_size_mb": round(total_size_mb, 2),
            "max_size": self.max_cache_size,
            "hit_rate": 0.0,  # Would need to track hits/misses
            "entries": [
                {
                    "key": key[:50] + "..." if len(key) > 50 else key,
                    "size_bytes": len(str(entry.data)),
                    "age_seconds": time.time() - entry.created_at,
                    "ttl": entry.ttl,
                    "expires_in": entry.ttl - (time.time() - entry.created_at)
                }
                for key, entry in list(self.cache.items())[:10]
            ],
            "age_distribution": self._get_age_distribution()
        }
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache entries matching a pattern"""
        keys_to_remove = [k for k in self.cache.keys() if pattern in k]
        for key in keys_to_remove:
            del self.cache[key]
        logger.info(f"Invalidated {len(keys_to_remove)} cache entries matching pattern: {pattern}")
        return len(keys_to_remove)
    
    def clear(self) -> int:
        """Clear all cache entries and return count"""
        count = len(self.cache)
        self.cache.clear()
        logger.info(f"Cleared all {count} cache entries")
        return count

# Global cache store instance for API endpoints
cache_store = None

def get_cache_store() -> ResponseCacheMiddleware:
    """Get the global cache store instance"""
    global cache_store
    if cache_store is None:
        # Create a dummy app for the middleware
        from fastapi import FastAPI
        dummy_app = FastAPI()
        cache_store = ResponseCacheMiddleware(dummy_app)
    return cache_store 