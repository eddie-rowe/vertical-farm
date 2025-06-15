"""
Sensor Data Response Schemas

Schema definitions for cached sensor API endpoints.
These schemas define the response format for sensor readings, aggregates,
history, and static data endpoints.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SensorReadingResponse(BaseModel):
    """Response model for individual sensor readings"""
    id: int
    device_assignment_id: str
    reading_type: str
    value: float
    unit: str
    timestamp: datetime
    device_name: Optional[str] = None
    location: Optional[str] = None
    cached: bool = False

    class Config:
        from_attributes = True


class SensorHistoryResponse(BaseModel):
    """Response model for sensor reading history"""
    device_id: str
    sensor_type: str
    period_hours: int
    readings: List[SensorReadingResponse]
    total_readings: int
    cached: bool = False

    class Config:
        from_attributes = True


class SensorAggregateResponse(BaseModel):
    """Response model for sensor data aggregates"""
    device_assignment_id: str
    sensor_type: str
    avg_value: float
    min_value: float
    max_value: float
    count: int
    period_start: datetime
    period_end: datetime
    period_hours: int
    cached: bool = False

    class Config:
        from_attributes = True


class StaticDataResponse(BaseModel):
    """Response model for static data (species, varieties, recipes)"""
    data_type: str
    items: List[Dict[str, Any]]
    total_count: int
    cached: bool = False
    cache_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class CacheStatsResponse(BaseModel):
    """Response model for cache performance statistics"""
    cache_type: str
    hit_rate: float
    total_requests: int
    cache_hits: int
    cache_misses: int
    avg_response_time_ms: float
    last_updated: datetime

    class Config:
        from_attributes = True


class CacheInvalidationResponse(BaseModel):
    """Response model for cache invalidation operations"""
    success: bool
    message: str
    invalidated_keys: List[str]
    timestamp: datetime

    class Config:
        from_attributes = True 