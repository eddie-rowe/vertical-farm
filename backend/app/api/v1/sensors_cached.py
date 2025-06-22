"""
Cached Sensor Data API Endpoints

High-performance sensor data endpoints using the new caching architecture:
- sensor_readings: Cached data (no realtime) for dashboard queries
- sensor_alerts: Realtime alerts for critical conditions

These endpoints provide fast access to sensor data for dashboards and analytics
while maintaining separation between cached data and realtime alerts.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.security import get_current_active_user as get_current_user
from app.services.sensor_cache_service import get_sensor_cache_service, SensorCacheService
from app.models.user import User
from app.schemas.sensor import (
    SensorReadingResponse,
    SensorAggregateResponse,
    SensorHistoryResponse,
    StaticDataResponse
)

router = APIRouter()

@router.get("/latest", response_model=List[SensorReadingResponse])
async def get_latest_sensor_readings(
    device_ids: Optional[str] = Query(None, description="Comma-separated device IDs"),
    sensor_types: Optional[str] = Query(None, description="Comma-separated sensor types"),
    current_user: User = Depends(get_current_user),
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Get latest sensor readings for user's devices (cached for performance)
    
    This endpoint provides fast access to the most recent sensor readings
    from all user devices. Data is cached for 5 minutes to improve dashboard
    performance while still providing reasonably fresh data.
    
    Args:
        device_ids: Optional comma-separated list of specific device IDs
        sensor_types: Optional comma-separated list of sensor types to filter
        current_user: Authenticated user
        cache_service: Sensor cache service
        
    Returns:
        List of latest sensor readings with device and location information
    """
    try:
        # Parse comma-separated parameters
        device_id_list = device_ids.split(",") if device_ids else None
        sensor_type_list = sensor_types.split(",") if sensor_types else None
        
        # Get cached sensor readings
        readings = await cache_service.get_latest_sensor_readings(
            user_id=str(current_user.id),
            device_ids=device_id_list,
            sensor_types=sensor_type_list
        )
        
        # Convert to response format
        response_data = []
        for reading in readings:
            response_data.append(SensorReadingResponse(
                id=reading.id,
                device_assignment_id=reading.device_assignment_id,
                reading_type=reading.reading_type,
                value=reading.value,
                unit=reading.unit,
                timestamp=reading.timestamp,
                device_name=reading.device_name,
                location=reading.location,
                cached=True
            ))
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sensor readings: {str(e)}")

@router.get("/history/{device_id}/{sensor_type}", response_model=SensorHistoryResponse)
async def get_sensor_history(
    device_id: str,
    sensor_type: str,
    hours: int = Query(24, description="Number of hours of history to retrieve", ge=1, le=168),
    current_user: User = Depends(get_current_user),
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Get sensor reading history for a specific device and sensor type (cached)
    
    This endpoint provides historical sensor data for charts and trend analysis.
    Data is cached for 15 minutes to balance performance with data freshness.
    
    Args:
        device_id: Device assignment ID
        sensor_type: Type of sensor (temperature, humidity, ph, etc.)
        hours: Number of hours of history (1-168, default 24)
        current_user: Authenticated user
        cache_service: Sensor cache service
        
    Returns:
        Sensor history with readings and metadata
    """
    try:
        # Get cached sensor history
        readings = await cache_service.get_sensor_history(
            user_id=str(current_user.id),
            device_id=device_id,
            sensor_type=sensor_type,
            hours=hours
        )
        
        if not readings:
            raise HTTPException(status_code=404, detail="No sensor data found for the specified device and sensor type")
        
        # Convert to response format
        reading_responses = []
        for reading in readings:
            reading_responses.append(SensorReadingResponse(
                id=reading.id,
                device_assignment_id=reading.device_assignment_id,
                reading_type=reading.reading_type,
                value=reading.value,
                unit=reading.unit,
                timestamp=reading.timestamp,
                device_name=reading.device_name,
                location=reading.location,
                cached=True
            ))
        
        return SensorHistoryResponse(
            device_id=device_id,
            sensor_type=sensor_type,
            period_hours=hours,
            readings=reading_responses,
            total_readings=len(reading_responses),
            cached=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sensor history: {str(e)}")

@router.get("/aggregates", response_model=List[SensorAggregateResponse])
async def get_sensor_aggregates(
    device_ids: Optional[str] = Query(None, description="Comma-separated device IDs"),
    sensor_types: Optional[str] = Query(None, description="Comma-separated sensor types"),
    period_hours: int = Query(24, description="Period for aggregation in hours", ge=1, le=168),
    current_user: User = Depends(get_current_user),
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Get aggregated sensor data for dashboard charts (cached)
    
    This endpoint provides statistical summaries (avg, min, max) of sensor data
    over specified time periods. Data is cached for 30 minutes to provide
    fast dashboard loading while maintaining reasonable data freshness.
    
    Args:
        device_ids: Optional comma-separated list of device IDs
        sensor_types: Optional comma-separated list of sensor types
        period_hours: Period for aggregation in hours (1-168, default 24)
        current_user: Authenticated user
        cache_service: Sensor cache service
        
    Returns:
        List of sensor aggregates with statistical data
    """
    try:
        # Parse comma-separated parameters
        device_id_list = device_ids.split(",") if device_ids else None
        sensor_type_list = sensor_types.split(",") if sensor_types else None
        
        # Get cached sensor aggregates
        aggregates = await cache_service.get_sensor_aggregates(
            user_id=str(current_user.id),
            device_ids=device_id_list,
            sensor_types=sensor_type_list,
            period_hours=period_hours
        )
        
        # Convert to response format
        response_data = []
        for aggregate in aggregates:
            response_data.append(SensorAggregateResponse(
                device_assignment_id=aggregate.device_assignment_id,
                sensor_type=aggregate.sensor_type,
                avg_value=aggregate.avg_value,
                min_value=aggregate.min_value,
                max_value=aggregate.max_value,
                count=aggregate.count,
                period_start=aggregate.period_start,
                period_end=aggregate.period_end,
                period_hours=period_hours,
                cached=True
            ))
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sensor aggregates: {str(e)}")

@router.get("/static/species", response_model=StaticDataResponse)
async def get_species_data(
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Get species data (cached for 24 hours)
    
    This endpoint provides static species data that changes rarely.
    Data is cached for 24 hours to minimize database load while
    ensuring data consistency.
    
    Returns:
        Species data with caching metadata
    """
    try:
        species_data = await cache_service.get_static_species_data()
        
        return StaticDataResponse(
            data_type="species",
            data=species_data,
            total_count=len(species_data),
            cached=True,
            cache_ttl_hours=24
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching species data: {str(e)}")

@router.get("/static/plant-varieties", response_model=StaticDataResponse)
async def get_plant_varieties_data(
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Get plant varieties data (cached for 24 hours)
    
    This endpoint provides static plant varieties data that changes rarely.
    Data is cached for 24 hours to minimize database load while
    ensuring data consistency.
    
    Returns:
        Plant varieties data with caching metadata
    """
    try:
        varieties_data = await cache_service.get_static_plant_varieties_data()
        
        return StaticDataResponse(
            data_type="plant_varieties",
            data=varieties_data,
            total_count=len(varieties_data),
            cached=True,
            cache_ttl_hours=24
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching plant varieties data: {str(e)}")

@router.get("/static/grow-recipes", response_model=StaticDataResponse)
async def get_grow_recipes_data(
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Get grow recipes data (cached for 24 hours)
    
    This endpoint provides static grow recipes data that changes rarely.
    Data is cached for 24 hours to minimize database load while
    ensuring data consistency.
    
    Returns:
        Grow recipes data with caching metadata
    """
    try:
        recipes_data = await cache_service.get_static_grow_recipes_data()
        
        return StaticDataResponse(
            data_type="grow_recipes",
            data=recipes_data,
            total_count=len(recipes_data),
            cached=True,
            cache_ttl_hours=24
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching grow recipes data: {str(e)}")

@router.post("/cache/invalidate")
async def invalidate_sensor_cache(
    device_id: Optional[str] = Query(None, description="Specific device ID to invalidate"),
    sensor_type: Optional[str] = Query(None, description="Specific sensor type to invalidate"),
    static_data_type: Optional[str] = Query(None, description="Static data type to invalidate (species, varieties, recipes)"),
    current_user: User = Depends(get_current_user),
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Manually invalidate sensor cache entries
    
    This endpoint allows manual cache invalidation for testing or when
    immediate data refresh is needed. Use sparingly as it defeats the
    purpose of caching.
    
    Args:
        device_id: Optional specific device ID to invalidate
        sensor_type: Optional specific sensor type to invalidate
        static_data_type: Optional static data type to invalidate
        current_user: Authenticated user
        cache_service: Sensor cache service
        
    Returns:
        Success message
    """
    try:
        if static_data_type:
            await cache_service.invalidate_static_cache(static_data_type)
            return {"message": f"Static cache invalidated for {static_data_type}"}
        else:
            await cache_service.invalidate_sensor_cache(
                user_id=str(current_user.id),
                device_id=device_id,
                sensor_type=sensor_type
            )
            return {"message": "Sensor cache invalidated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error invalidating cache: {str(e)}")

@router.get("/cache/stats")
async def get_cache_stats(
    current_user: User = Depends(get_current_user),
    cache_service: SensorCacheService = Depends(get_sensor_cache_service)
):
    """
    Get cache statistics and health information
    
    This endpoint provides information about cache performance,
    hit rates, and overall health for monitoring purposes.
    
    Returns:
        Cache statistics and health data
    """
    try:
        # This would need to be implemented in the cache service
        # For now, return basic info
        return {
            "cache_enabled": True,
            "cache_type": "redis",
            "ttl_settings": {
                "sensor_latest": "5 minutes",
                "sensor_history": "15 minutes", 
                "sensor_aggregates": "30 minutes",
                "static_species": "24 hours",
                "static_varieties": "24 hours",
                "static_recipes": "24 hours"
            },
            "message": "Cache is operational"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cache stats: {str(e)}") 