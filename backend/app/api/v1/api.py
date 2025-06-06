from fastapi import APIRouter

# Import endpoint routers here
from app.api.v1.endpoints import (
    farms,
    login,
    users,
    user_permissions,
    rows,  # Added
    racks,  # Added
    shelves,  # Added
    fans,  # Added
    sensor_devices,  # Added
    home_assistant,  # Added
)

api_router = APIRouter()

api_router.include_router(login.router, tags=["Login"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(farms.router, prefix="/farms", tags=["Farms"])
api_router.include_router(
    user_permissions.router, prefix="/user-permissions", tags=["User Permissions"]
)
api_router.include_router(rows.router, prefix="/rows", tags=["Rows"])  # New
api_router.include_router(racks.router, prefix="/racks", tags=["Racks"])  # New
api_router.include_router(shelves.router, prefix="/shelves", tags=["Shelves"])  # New
api_router.include_router(fans.router, prefix="/fans", tags=["Fans"])  # Added
api_router.include_router(sensor_devices.router, prefix="/sensor-devices", tags=["Sensor Devices"])  # Added
api_router.include_router(home_assistant.router, prefix="/home-assistant", tags=["Home Assistant"])  # Added

# Add other v1 routers here as needed
