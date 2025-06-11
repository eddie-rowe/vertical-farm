from fastapi import APIRouter

# Import endpoint routers here - Only Home Assistant remains after PostGREST migration
from app.api.v1.endpoints import (
    home_assistant,  # Only remaining endpoint after migration
)

api_router = APIRouter()

# Only include Home Assistant endpoints after PostGREST migration
api_router.include_router(home_assistant.router, prefix="/home-assistant", tags=["Home Assistant"])

# Add other v1 routers here as needed
