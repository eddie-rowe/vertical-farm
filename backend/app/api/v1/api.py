from fastapi import APIRouter

# Import endpoint routers here - Only Home Assistant remains after PostGREST migration
from app.api.v1.endpoints import (
    home_assistant,  # Only remaining endpoint after migration
    supabase_background_tasks,  # Supabase-based background tasks
    test_endpoints,  # Test endpoints for integration testing
)

api_router = APIRouter()

# Only include Home Assistant endpoints after PostGREST migration
api_router.include_router(home_assistant.router, prefix="/home-assistant", tags=["Home Assistant"])

# Background task management endpoints - Supabase-based system
api_router.include_router(supabase_background_tasks.router, prefix="/background-tasks", tags=["Background Tasks"])

# Test endpoints for integration testing
api_router.include_router(test_endpoints.router, prefix="/test", tags=["Testing"])

# Add other v1 routers here as needed
