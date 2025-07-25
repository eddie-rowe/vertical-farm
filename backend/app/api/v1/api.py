from fastapi import APIRouter

from app.api.v1 import (
    grow_automation,  # Layer Two: Grow automation endpoints
    sensors_cached,  # Cached sensor data endpoints
)

# Import endpoint routers here - Only Home Assistant remains after PostGREST migration
from app.api.v1.endpoints import (
    farm_automation,  # Farm automation background tasks
    home_assistant,  # Only remaining endpoint after migration
    square,  # Square payment integration
    supabase_background_tasks,  # Supabase-based background tasks
)

api_router = APIRouter()

# Only include Home Assistant endpoints after PostGREST migration
api_router.include_router(
    home_assistant.router, prefix="/home-assistant", tags=["Home Assistant"]
)

# Background task management endpoints - Supabase-based system
api_router.include_router(
    supabase_background_tasks.router,
    prefix="/background-tasks",
    tags=["Background Tasks"],
)

# Test endpoints removed - using proper test files in tests/ directory

# Cache management endpoints removed with cache middleware

# Cached sensor data endpoints - High-performance sensor data for dashboards
api_router.include_router(
    sensors_cached.router, prefix="/sensors-cached", tags=["Sensors (Cached)"]
)

# Farm automation endpoints - Background task management for farm operations
api_router.include_router(
    farm_automation.router, prefix="/farm-automation", tags=["Farm Automation"]
)

# Square payment integration endpoints
api_router.include_router(square.router, prefix="/square", tags=["Square Integration"])

# Layer Two: Grow automation endpoints - Bridge grows with device controls
api_router.include_router(
    grow_automation.router, prefix="/grow-automation", tags=["Grow Automation"]
)

# Add other v1 routers here as needed
