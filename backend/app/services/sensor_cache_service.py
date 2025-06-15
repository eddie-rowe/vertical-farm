"""
Sensor Cache Service

Implements caching for sensor data queries to improve dashboard performance.
This service works with the new architecture where:
- sensor_readings: Cached data (no realtime) for dashboard queries
- sensor_alerts: Realtime alerts for critical conditions

Key Features:
- Cache recent sensor readings for dashboard performance
- Cache aggregated sensor data (averages, trends)
- Cache static data (species, plant varieties, grow recipes)
- Intelligent cache invalidation
- Fallback to database when cache misses
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum

from app.core.cache import CacheManager
from app.core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)

class CacheKeyType(Enum):
    """Cache key types for different data categories"""
    SENSOR_LATEST = "sensor_latest"
    SENSOR_HISTORY = "sensor_history"
    SENSOR_AGGREGATES = "sensor_aggregates"
    DEVICE_STATUS = "device_status"
    STATIC_SPECIES = "static_species"
    STATIC_VARIETIES = "static_varieties"
    STATIC_RECIPES = "static_recipes"
    USER_PREFERENCES = "user_preferences"

@dataclass
class SensorReading:
    """Sensor reading data structure"""
    id: Optional[int]
    device_assignment_id: str
    reading_type: str
    value: float
    unit: Optional[str]
    timestamp: datetime
    device_name: Optional[str] = None
    location: Optional[str] = None

@dataclass
class SensorAggregate:
    """Aggregated sensor data structure"""
    device_assignment_id: str
    sensor_type: str
    avg_value: float
    min_value: float
    max_value: float
    count: int
    period_start: datetime
    period_end: datetime

class SensorCacheService:
    """Service for caching sensor data and related information"""
    
    def __init__(self, cache_manager: CacheManager):
        self.cache = cache_manager
        self.default_ttl = {
            CacheKeyType.SENSOR_LATEST: 300,      # 5 minutes
            CacheKeyType.SENSOR_HISTORY: 900,     # 15 minutes
            CacheKeyType.SENSOR_AGGREGATES: 1800, # 30 minutes
            CacheKeyType.DEVICE_STATUS: 300,      # 5 minutes
            CacheKeyType.STATIC_SPECIES: 86400,   # 24 hours
            CacheKeyType.STATIC_VARIETIES: 86400, # 24 hours
            CacheKeyType.STATIC_RECIPES: 86400,   # 24 hours
            CacheKeyType.USER_PREFERENCES: 3600,  # 1 hour
        }
    
    def _get_cache_key(self, key_type: CacheKeyType, *args) -> str:
        """Generate cache key for given type and arguments"""
        key_parts = [key_type.value] + [str(arg) for arg in args]
        return ":".join(key_parts)
    
    async def get_latest_sensor_readings(
        self, 
        user_id: str, 
        device_ids: Optional[List[str]] = None,
        sensor_types: Optional[List[str]] = None
    ) -> List[SensorReading]:
        """
        Get latest sensor readings for user's devices
        
        Args:
            user_id: User ID
            device_ids: Optional list of specific device IDs
            sensor_types: Optional list of sensor types to filter
            
        Returns:
            List of latest sensor readings
        """
        cache_key = self._get_cache_key(
            CacheKeyType.SENSOR_LATEST, 
            user_id, 
            ",".join(device_ids or []), 
            ",".join(sensor_types or [])
        )
        
        # Try cache first
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            try:
                readings_data = json.loads(cached_data)
                return [SensorReading(**reading) for reading in readings_data]
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Failed to deserialize cached sensor readings: {e}")
        
        # Cache miss - fetch from database
        readings = await self._fetch_latest_sensor_readings_from_db(
            user_id, device_ids, sensor_types
        )
        
        # Cache the results
        if readings:
            readings_data = [asdict(reading) for reading in readings]
            # Convert datetime objects to ISO strings for JSON serialization
            for reading_data in readings_data:
                if isinstance(reading_data.get('timestamp'), datetime):
                    reading_data['timestamp'] = reading_data['timestamp'].isoformat()
            
            await self.cache.set(
                cache_key, 
                json.dumps(readings_data, default=str),
                ttl=self.default_ttl[CacheKeyType.SENSOR_LATEST]
            )
        
        return readings
    
    async def get_sensor_history(
        self,
        user_id: str,
        device_id: str,
        sensor_type: str,
        hours: int = 24
    ) -> List[SensorReading]:
        """
        Get sensor reading history for a specific device and sensor type
        
        Args:
            user_id: User ID
            device_id: Device assignment ID
            sensor_type: Type of sensor (temperature, humidity, etc.)
            hours: Number of hours of history to retrieve
            
        Returns:
            List of sensor readings ordered by timestamp
        """
        cache_key = self._get_cache_key(
            CacheKeyType.SENSOR_HISTORY,
            user_id,
            device_id,
            sensor_type,
            hours
        )
        
        # Try cache first
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            try:
                readings_data = json.loads(cached_data)
                return [SensorReading(**reading) for reading in readings_data]
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Failed to deserialize cached sensor history: {e}")
        
        # Cache miss - fetch from database
        readings = await self._fetch_sensor_history_from_db(
            user_id, device_id, sensor_type, hours
        )
        
        # Cache the results
        if readings:
            readings_data = [asdict(reading) for reading in readings]
            # Convert datetime objects to ISO strings for JSON serialization
            for reading_data in readings_data:
                if isinstance(reading_data.get('timestamp'), datetime):
                    reading_data['timestamp'] = reading_data['timestamp'].isoformat()
            
            await self.cache.set(
                cache_key,
                json.dumps(readings_data, default=str),
                ttl=self.default_ttl[CacheKeyType.SENSOR_HISTORY]
            )
        
        return readings
    
    async def get_sensor_aggregates(
        self,
        user_id: str,
        device_ids: Optional[List[str]] = None,
        sensor_types: Optional[List[str]] = None,
        period_hours: int = 24
    ) -> List[SensorAggregate]:
        """
        Get aggregated sensor data (averages, min, max) for dashboard charts
        
        Args:
            user_id: User ID
            device_ids: Optional list of device IDs
            sensor_types: Optional list of sensor types
            period_hours: Period for aggregation in hours
            
        Returns:
            List of sensor aggregates
        """
        cache_key = self._get_cache_key(
            CacheKeyType.SENSOR_AGGREGATES,
            user_id,
            ",".join(device_ids or []),
            ",".join(sensor_types or []),
            period_hours
        )
        
        # Try cache first
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            try:
                aggregates_data = json.loads(cached_data)
                return [SensorAggregate(**agg) for agg in aggregates_data]
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Failed to deserialize cached sensor aggregates: {e}")
        
        # Cache miss - fetch from database
        aggregates = await self._fetch_sensor_aggregates_from_db(
            user_id, device_ids, sensor_types, period_hours
        )
        
        # Cache the results
        if aggregates:
            aggregates_data = [asdict(agg) for agg in aggregates]
            # Convert datetime objects to ISO strings for JSON serialization
            for agg_data in aggregates_data:
                for field in ['period_start', 'period_end']:
                    if isinstance(agg_data.get(field), datetime):
                        agg_data[field] = agg_data[field].isoformat()
            
            await self.cache.set(
                cache_key,
                json.dumps(aggregates_data, default=str),
                ttl=self.default_ttl[CacheKeyType.SENSOR_AGGREGATES]
            )
        
        return aggregates
    
    async def get_static_species_data(self) -> List[Dict[str, Any]]:
        """
        Get cached species data (static data that changes rarely)
        
        Returns:
            List of species data
        """
        cache_key = self._get_cache_key(CacheKeyType.STATIC_SPECIES)
        
        # Try cache first
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            try:
                return json.loads(cached_data)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to deserialize cached species data: {e}")
        
        # Cache miss - fetch from database
        species_data = await self._fetch_species_from_db()
        
        # Cache the results
        if species_data:
            await self.cache.set(
                cache_key,
                json.dumps(species_data, default=str),
                ttl=self.default_ttl[CacheKeyType.STATIC_SPECIES]
            )
        
        return species_data
    
    async def get_static_plant_varieties_data(self) -> List[Dict[str, Any]]:
        """
        Get cached plant varieties data (static data that changes rarely)
        
        Returns:
            List of plant varieties data
        """
        cache_key = self._get_cache_key(CacheKeyType.STATIC_VARIETIES)
        
        # Try cache first
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            try:
                return json.loads(cached_data)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to deserialize cached varieties data: {e}")
        
        # Cache miss - fetch from database
        varieties_data = await self._fetch_plant_varieties_from_db()
        
        # Cache the results
        if varieties_data:
            await self.cache.set(
                cache_key,
                json.dumps(varieties_data, default=str),
                ttl=self.default_ttl[CacheKeyType.STATIC_VARIETIES]
            )
        
        return varieties_data
    
    async def get_static_grow_recipes_data(self) -> List[Dict[str, Any]]:
        """
        Get cached grow recipes data (static data that changes rarely)
        
        Returns:
            List of grow recipes data
        """
        cache_key = self._get_cache_key(CacheKeyType.STATIC_RECIPES)
        
        # Try cache first
        cached_data = await self.cache.get(cache_key)
        if cached_data:
            try:
                return json.loads(cached_data)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to deserialize cached recipes data: {e}")
        
        # Cache miss - fetch from database
        recipes_data = await self._fetch_grow_recipes_from_db()
        
        # Cache the results
        if recipes_data:
            await self.cache.set(
                cache_key,
                json.dumps(recipes_data, default=str),
                ttl=self.default_ttl[CacheKeyType.STATIC_RECIPES]
            )
        
        return recipes_data
    
    async def invalidate_sensor_cache(
        self, 
        user_id: str, 
        device_id: Optional[str] = None,
        sensor_type: Optional[str] = None
    ):
        """
        Invalidate sensor-related cache entries
        
        Args:
            user_id: User ID
            device_id: Optional specific device ID
            sensor_type: Optional specific sensor type
        """
        # Invalidate latest readings cache
        patterns = [
            f"{CacheKeyType.SENSOR_LATEST.value}:{user_id}:*",
            f"{CacheKeyType.SENSOR_AGGREGATES.value}:{user_id}:*"
        ]
        
        if device_id:
            patterns.extend([
                f"{CacheKeyType.SENSOR_HISTORY.value}:{user_id}:{device_id}:*",
                f"{CacheKeyType.DEVICE_STATUS.value}:{user_id}:{device_id}:*"
            ])
        
        for pattern in patterns:
            await self.cache.delete_pattern(pattern)
    
    async def invalidate_static_cache(self, data_type: str):
        """
        Invalidate static data cache
        
        Args:
            data_type: Type of static data (species, varieties, recipes)
        """
        cache_type_map = {
            'species': CacheKeyType.STATIC_SPECIES,
            'varieties': CacheKeyType.STATIC_VARIETIES,
            'recipes': CacheKeyType.STATIC_RECIPES
        }
        
        cache_type = cache_type_map.get(data_type)
        if cache_type:
            cache_key = self._get_cache_key(cache_type)
            await self.cache.delete(cache_key)
    
    # Private methods for database queries
    
    async def _fetch_latest_sensor_readings_from_db(
        self,
        user_id: str,
        device_ids: Optional[List[str]] = None,
        sensor_types: Optional[List[str]] = None
    ) -> List[SensorReading]:
        """Fetch latest sensor readings from database"""
        try:
            db = next(get_db())
            
            # Build query with user's device filter
            query = """
            WITH latest_readings AS (
                SELECT DISTINCT ON (sr.device_assignment_id, sr.reading_type)
                    sr.id,
                    sr.device_assignment_id,
                    sr.reading_type,
                    sr.value,
                    sr.unit,
                    sr.timestamp,
                    da.friendly_name as device_name,
                    CONCAT(f.name, ' - ', ro.name, ' - ', r.name, ' - ', s.name) as location
                FROM sensor_readings sr
                JOIN device_assignments da ON sr.device_assignment_id = da.id
                JOIN shelves s ON da.shelf_id = s.id
                JOIN racks r ON s.rack_id = r.id
                JOIN rows ro ON r.row_id = ro.id
                JOIN farms f ON ro.farm_id = f.id
                WHERE f.user_id = :user_id
            """
            
            params = {"user_id": user_id}
            
            if device_ids:
                query += " AND sr.device_assignment_id = ANY(:device_ids)"
                params["device_ids"] = device_ids
            
            if sensor_types:
                query += " AND sr.reading_type = ANY(:sensor_types)"
                params["sensor_types"] = sensor_types
            
            query += """
                ORDER BY sr.device_assignment_id, sr.reading_type, sr.timestamp DESC
            )
            SELECT * FROM latest_readings
            ORDER BY timestamp DESC
            """
            
            result = db.execute(text(query), params)
            rows = result.fetchall()
            
            readings = []
            for row in rows:
                readings.append(SensorReading(
                    id=row.id,
                    device_assignment_id=row.device_assignment_id,
                    reading_type=row.reading_type,
                    value=float(row.value),
                    unit=row.unit,
                    timestamp=row.timestamp,
                    device_name=row.device_name,
                    location=row.location
                ))
            
            return readings
            
        except Exception as e:
            logger.error(f"Error fetching latest sensor readings from DB: {e}")
            return []
    
    async def _fetch_sensor_history_from_db(
        self,
        user_id: str,
        device_id: str,
        sensor_type: str,
        hours: int
    ) -> List[SensorReading]:
        """Fetch sensor history from database"""
        try:
            db = next(get_db())
            
            query = """
            SELECT 
                sr.id,
                sr.device_assignment_id,
                sr.reading_type,
                sr.value,
                sr.unit,
                sr.timestamp,
                da.friendly_name as device_name,
                CONCAT(f.name, ' - ', ro.name, ' - ', r.name, ' - ', s.name) as location
            FROM sensor_readings sr
            JOIN device_assignments da ON sr.device_assignment_id = da.id
            JOIN shelves s ON da.shelf_id = s.id
            JOIN racks r ON s.rack_id = r.id
            JOIN rows ro ON r.row_id = ro.id
            JOIN farms f ON ro.farm_id = f.id
            WHERE f.user_id = :user_id
                AND sr.device_assignment_id = :device_id
                AND sr.reading_type = :sensor_type
                AND sr.timestamp >= NOW() - INTERVAL ':hours hours'
            ORDER BY sr.timestamp DESC
            LIMIT 1000
            """
            
            result = db.execute(text(query), {
                "user_id": user_id,
                "device_id": device_id,
                "sensor_type": sensor_type,
                "hours": hours
            })
            rows = result.fetchall()
            
            readings = []
            for row in rows:
                readings.append(SensorReading(
                    id=row.id,
                    device_assignment_id=row.device_assignment_id,
                    reading_type=row.reading_type,
                    value=float(row.value),
                    unit=row.unit,
                    timestamp=row.timestamp,
                    device_name=row.device_name,
                    location=row.location
                ))
            
            return readings
            
        except Exception as e:
            logger.error(f"Error fetching sensor history from DB: {e}")
            return []
    
    async def _fetch_sensor_aggregates_from_db(
        self,
        user_id: str,
        device_ids: Optional[List[str]] = None,
        sensor_types: Optional[List[str]] = None,
        period_hours: int = 24
    ) -> List[SensorAggregate]:
        """Fetch sensor aggregates from database"""
        try:
            db = next(get_db())
            
            query = """
            SELECT 
                sr.device_assignment_id,
                sr.reading_type as sensor_type,
                AVG(sr.value) as avg_value,
                MIN(sr.value) as min_value,
                MAX(sr.value) as max_value,
                COUNT(*) as count,
                MIN(sr.timestamp) as period_start,
                MAX(sr.timestamp) as period_end
            FROM sensor_readings sr
            JOIN device_assignments da ON sr.device_assignment_id = da.id
            JOIN shelves s ON da.shelf_id = s.id
            JOIN racks r ON s.rack_id = r.id
            JOIN rows ro ON r.row_id = ro.id
            JOIN farms f ON ro.farm_id = f.id
            WHERE f.user_id = :user_id
                AND sr.timestamp >= NOW() - INTERVAL ':period_hours hours'
            """
            
            params = {"user_id": user_id, "period_hours": period_hours}
            
            if device_ids:
                query += " AND sr.device_assignment_id = ANY(:device_ids)"
                params["device_ids"] = device_ids
            
            if sensor_types:
                query += " AND sr.reading_type = ANY(:sensor_types)"
                params["sensor_types"] = sensor_types
            
            query += """
            GROUP BY sr.device_assignment_id, sr.reading_type
            ORDER BY sr.device_assignment_id, sr.reading_type
            """
            
            result = db.execute(text(query), params)
            rows = result.fetchall()
            
            aggregates = []
            for row in rows:
                aggregates.append(SensorAggregate(
                    device_assignment_id=row.device_assignment_id,
                    sensor_type=row.sensor_type,
                    avg_value=float(row.avg_value),
                    min_value=float(row.min_value),
                    max_value=float(row.max_value),
                    count=row.count,
                    period_start=row.period_start,
                    period_end=row.period_end
                ))
            
            return aggregates
            
        except Exception as e:
            logger.error(f"Error fetching sensor aggregates from DB: {e}")
            return []
    
    async def _fetch_species_from_db(self) -> List[Dict[str, Any]]:
        """Fetch species data from database"""
        try:
            db = next(get_db())
            
            query = """
            SELECT 
                id,
                name,
                scientific_name,
                category,
                description,
                optimal_temperature_min,
                optimal_temperature_max,
                optimal_humidity_min,
                optimal_humidity_max,
                optimal_ph_min,
                optimal_ph_max,
                growth_cycle_days,
                created_at,
                updated_at
            FROM species
            ORDER BY name
            """
            
            result = db.execute(text(query))
            rows = result.fetchall()
            
            species_data = []
            for row in rows:
                species_data.append({
                    "id": str(row.id),
                    "name": row.name,
                    "scientific_name": row.scientific_name,
                    "category": row.category,
                    "description": row.description,
                    "optimal_temperature_min": float(row.optimal_temperature_min) if row.optimal_temperature_min else None,
                    "optimal_temperature_max": float(row.optimal_temperature_max) if row.optimal_temperature_max else None,
                    "optimal_humidity_min": float(row.optimal_humidity_min) if row.optimal_humidity_min else None,
                    "optimal_humidity_max": float(row.optimal_humidity_max) if row.optimal_humidity_max else None,
                    "optimal_ph_min": float(row.optimal_ph_min) if row.optimal_ph_min else None,
                    "optimal_ph_max": float(row.optimal_ph_max) if row.optimal_ph_max else None,
                    "growth_cycle_days": row.growth_cycle_days,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "updated_at": row.updated_at.isoformat() if row.updated_at else None
                })
            
            return species_data
            
        except Exception as e:
            logger.error(f"Error fetching species from DB: {e}")
            return []
    
    async def _fetch_plant_varieties_from_db(self) -> List[Dict[str, Any]]:
        """Fetch plant varieties data from database"""
        try:
            db = next(get_db())
            
            query = """
            SELECT 
                pv.id,
                pv.name,
                pv.species_id,
                s.name as species_name,
                pv.description,
                pv.days_to_germination,
                pv.days_to_harvest,
                pv.yield_per_plant,
                pv.created_at,
                pv.updated_at
            FROM plant_varieties pv
            LEFT JOIN species s ON pv.species_id = s.id
            ORDER BY s.name, pv.name
            """
            
            result = db.execute(text(query))
            rows = result.fetchall()
            
            varieties_data = []
            for row in rows:
                varieties_data.append({
                    "id": str(row.id),
                    "name": row.name,
                    "species_id": str(row.species_id) if row.species_id else None,
                    "species_name": row.species_name,
                    "description": row.description,
                    "days_to_germination": row.days_to_germination,
                    "days_to_harvest": row.days_to_harvest,
                    "yield_per_plant": float(row.yield_per_plant) if row.yield_per_plant else None,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "updated_at": row.updated_at.isoformat() if row.updated_at else None
                })
            
            return varieties_data
            
        except Exception as e:
            logger.error(f"Error fetching plant varieties from DB: {e}")
            return []
    
    async def _fetch_grow_recipes_from_db(self) -> List[Dict[str, Any]]:
        """Fetch grow recipes data from database"""
        try:
            db = next(get_db())
            
            query = """
            SELECT 
                gr.id,
                gr.name,
                gr.species_id,
                s.name as species_name,
                gr.description,
                gr.phases,
                gr.total_days,
                gr.created_at,
                gr.updated_at
            FROM grow_recipes gr
            LEFT JOIN species s ON gr.species_id = s.id
            ORDER BY s.name, gr.name
            """
            
            result = db.execute(text(query))
            rows = result.fetchall()
            
            recipes_data = []
            for row in rows:
                recipes_data.append({
                    "id": str(row.id),
                    "name": row.name,
                    "species_id": str(row.species_id) if row.species_id else None,
                    "species_name": row.species_name,
                    "description": row.description,
                    "phases": row.phases,  # JSONB field
                    "total_days": row.total_days,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "updated_at": row.updated_at.isoformat() if row.updated_at else None
                })
            
            return recipes_data
            
        except Exception as e:
            logger.error(f"Error fetching grow recipes from DB: {e}")
            return []


# Dependency injection helper
def get_sensor_cache_service() -> SensorCacheService:
    """Get sensor cache service instance"""
    from app.core.cache import get_cache_manager
    cache_manager = get_cache_manager()
    return SensorCacheService(cache_manager) 