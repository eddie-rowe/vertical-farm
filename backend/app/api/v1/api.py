from fastapi import APIRouter

# Import endpoint routers here - Only Home Assistant remains after PostGREST migration
from app.api.v1.endpoints import (
    home_assistant,  # Only remaining endpoint after migration
    supabase_background_tasks,  # Supabase-based background tasks
    test_endpoints,  # Test endpoints for integration testing
    cache,  # Cache management endpoints
)
from app.api.v1 import sensors_cached  # Cached sensor data endpoints

api_router = APIRouter()

# Only include Home Assistant endpoints after PostGREST migration
api_router.include_router(home_assistant.router, prefix="/home-assistant", tags=["Home Assistant"])

# Background task management endpoints - Supabase-based system
api_router.include_router(supabase_background_tasks.router, prefix="/background-tasks", tags=["Background Tasks"])

# Test endpoints for integration testing
api_router.include_router(test_endpoints.router, prefix="/test", tags=["Testing"])

# Cache management endpoints
api_router.include_router(cache.router, prefix="/cache", tags=["Cache"])

# Cached sensor data endpoints - High-performance sensor data for dashboards
api_router.include_router(sensors_cached.router, prefix="/sensors-cached", tags=["Sensors (Cached)"])

# Add other v1 routers here as needed
