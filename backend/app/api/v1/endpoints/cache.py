from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.core.security import get_validated_supabase_token_payload
from app.middleware.cache_middleware import get_cache_store

router = APIRouter()

@router.get("/stats")
async def get_cache_stats(
    token_data: tuple = Depends(get_validated_supabase_token_payload)
) -> Dict[str, Any]:
    """
    Get cache statistics and performance metrics.
    Requires authentication.
    """
    try:
        cache_store = get_cache_store()
        stats = cache_store.get_stats()
        return {
            "status": "success",
            "data": stats,
            "message": "Cache statistics retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")

@router.post("/invalidate")
async def invalidate_cache_pattern(
    pattern: str,
    token_data: tuple = Depends(get_validated_supabase_token_payload)
) -> Dict[str, Any]:
    """
    Invalidate cache entries matching a pattern.
    Requires authentication.
    """
    try:
        cache_store = get_cache_store()
        invalidated_count = cache_store.invalidate_pattern(pattern)
        return {
            "status": "success",
            "data": {
                "pattern": pattern,
                "invalidated_count": invalidated_count
            },
            "message": f"Invalidated {invalidated_count} cache entries"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to invalidate cache: {str(e)}")

@router.delete("/clear")
async def clear_cache(
    token_data: tuple = Depends(get_validated_supabase_token_payload)
) -> Dict[str, Any]:
    """
    Clear all cache entries.
    Requires authentication.
    """
    try:
        cache_store = get_cache_store()
        cleared_count = cache_store.clear()
        return {
            "status": "success",
            "data": {
                "cleared_count": cleared_count
            },
            "message": f"Cleared {cleared_count} cache entries"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

@router.get("/health")
async def cache_health() -> Dict[str, Any]:
    """
    Get cache health status.
    Public endpoint for monitoring.
    """
    try:
        cache_store = get_cache_store()
        stats = cache_store.get_stats()
        
        # Determine health status based on cache performance
        hit_rate = stats.get("hit_rate", 0)
        cache_size = stats.get("size", 0)
        
        if hit_rate >= 0.7 and cache_size < 1000:
            status = "healthy"
        elif hit_rate >= 0.5 and cache_size < 1500:
            status = "degraded"
        else:
            status = "unhealthy"
        
        return {
            "status": status,
            "hit_rate": hit_rate,
            "cache_size": cache_size,
            "message": f"Cache is {status}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Cache health check failed: {str(e)}"
        } 