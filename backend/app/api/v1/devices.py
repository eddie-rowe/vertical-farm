"""
Device API endpoints for Layer One functionality
Handles device assignments, control, and WebSocket connections
"""

import json
import logging
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)

from ...dependencies import get_current_user, get_device_monitoring_service
from ...schemas.device_schemas import (
    ControlDeviceRequest,
    ControlDeviceResponse,
    CreateDeviceAssignmentRequest,
    DeviceAssignmentResponse,
    EmergencyControlRequest,
    LocationDevicesResponse,
    UpdateDeviceAssignmentRequest,
)
from ...services.device_monitoring_service import DeviceMonitoringService, DeviceType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/devices", tags=["devices"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
) -> None:
    """WebSocket endpoint for real-time device updates"""
    try:
        # Validate token and get user (you'll need to implement this)
        user_id = await validate_websocket_token(token)
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return

        await device_service.connect_websocket(websocket, user_id)

        try:
            while True:
                # Keep connection alive and handle incoming messages
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle client messages (ping/pong, etc.)
                if message.get("type") == "ping":
                    await websocket.send_text(
                        json.dumps(
                            {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                        )
                    )

        except WebSocketDisconnect:
            pass
        finally:
            await device_service.disconnect_websocket(websocket, user_id)

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=4000, reason="Internal error")
        except Exception:
            pass  # WebSocket already closed or connection broken


@router.get("/assignments", response_model=list[DeviceAssignmentResponse])
async def get_device_assignments(
    location_id: str | None = Query(None, description="Filter by location ID"),
    device_type: DeviceType | None = Query(None, description="Filter by device type"),
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Get device assignments for the current user"""
    try:
        if location_id:
            devices = await device_service.get_location_devices(
                current_user["id"], location_id
            )
        else:
            devices = await device_service.get_user_device_assignments(
                current_user["id"]
            )

        # Filter by device type if specified
        if device_type:
            devices = [d for d in devices if d.get("device_type") == device_type.value]

        return devices

    except Exception as e:
        logger.error(f"Error getting device assignments: {e}")
        raise HTTPException(status_code=500, detail="Failed to get device assignments")


@router.post("/assignments", response_model=DeviceAssignmentResponse)
async def create_device_assignment(
    request: CreateDeviceAssignmentRequest,
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Create a new device assignment"""
    try:
        result = await device_service.create_device_assignment(
            user_id=current_user["id"],
            location_id=request.location_id,
            entity_id=request.home_assistant_entity_id,
            device_type=DeviceType(request.device_type),
            device_name=request.device_name,
            capabilities=request.capabilities,
        )

        return result

    except Exception as e:
        logger.error(f"Error creating device assignment: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to create device assignment"
        )


@router.put("/assignments/{assignment_id}", response_model=DeviceAssignmentResponse)
async def update_device_assignment(
    assignment_id: str,
    request: UpdateDeviceAssignmentRequest,
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Update a device assignment"""
    try:
        # Get current assignment to verify ownership
        assignments = await device_service.get_user_device_assignments(
            current_user["id"]
        )
        assignment = next((a for a in assignments if a["id"] == assignment_id), None)

        if not assignment:
            raise HTTPException(status_code=404, detail="Device assignment not found")

        # Update in database (you'll need to implement this method)
        updated_assignment = await device_service.update_device_assignment(
            user_id=current_user["id"],
            assignment_id=assignment_id,
            device_name=request.device_name,
            capabilities=request.capabilities,
            is_active=request.is_active,
        )

        return updated_assignment

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating device assignment: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update device assignment"
        )


@router.delete("/assignments/{assignment_id}")
async def delete_device_assignment(
    assignment_id: str,
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Delete a device assignment"""
    try:
        success = await device_service.delete_device_assignment(
            user_id=current_user["id"], assignment_id=assignment_id
        )

        if not success:
            raise HTTPException(status_code=404, detail="Device assignment not found")

        return {"success": True, "message": "Device assignment deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting device assignment: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to delete device assignment"
        )


@router.get("/location/{location_id}", response_model=LocationDevicesResponse)
async def get_location_devices(
    location_id: str,
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Get all devices assigned to a specific location"""
    try:
        devices = await device_service.get_location_devices(
            current_user["id"], location_id
        )

        return {
            "location_id": location_id,
            "devices": devices,
            "last_updated": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting location devices: {e}")
        raise HTTPException(status_code=500, detail="Failed to get location devices")


@router.post("/control", response_model=ControlDeviceResponse)
async def control_device(
    request: ControlDeviceRequest,
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Control a device"""
    try:
        # Verify user has access to this device
        assignments = await device_service.get_user_device_assignments(
            current_user["id"]
        )
        has_access = any(
            a["home_assistant_entity_id"] == request.entity_id for a in assignments
        )

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied to this device")

        result = await device_service.control_device(
            user_id=current_user["id"],
            entity_id=request.entity_id,
            action=request.action.dict(),
        )

        return ControlDeviceResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error controlling device: {e}")
        raise HTTPException(status_code=500, detail="Failed to control device")


@router.post("/emergency-stop")
async def emergency_stop(
    request: EmergencyControlRequest,
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Emergency stop for devices"""
    try:
        device_types = (
            [DeviceType(dt) for dt in request.device_types]
            if request.device_types
            else None
        )

        result = await device_service.emergency_stop(
            user_id=current_user["id"],
            location_ids=request.location_ids,
            device_types=device_types,
        )

        return result

    except Exception as e:
        # Log the full error server-side for debugging, but don't expose details to client
        logger.error(f"Error during emergency stop: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Emergency stop operation failed. Please try again or contact support.",
        )


@router.get("/health")
async def device_service_health(
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Get device service health status"""
    try:
        # Check if user has active WebSocket connections
        has_connection = current_user["id"] in device_service.active_connections

        # Check if Home Assistant client is connected
        has_ha_client = current_user["id"] in device_service.ha_clients

        return {
            "service_running": device_service.running,
            "websocket_connected": has_connection,
            "home_assistant_connected": has_ha_client,
            "active_connections": len(
                device_service.active_connections.get(current_user["id"], [])
            ),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting device service health: {e}")
        raise HTTPException(status_code=500, detail="Failed to get service health")


@router.get("/states")
async def get_device_states(
    entity_ids: str | None = Query(None, description="Comma-separated entity IDs"),
    current_user: dict = Depends(get_current_user),
    device_service: DeviceMonitoringService = Depends(get_device_monitoring_service),
):
    """Get current states of devices"""
    try:
        if entity_ids:
            entity_id_list = [eid.strip() for eid in entity_ids.split(",")]
        else:
            # Get all user's assigned devices
            assignments = await device_service.get_user_device_assignments(
                current_user["id"]
            )
            entity_id_list = [a["home_assistant_entity_id"] for a in assignments]

        states = {}
        for entity_id in entity_id_list:
            state = await device_service.get_device_current_state(
                current_user["id"], entity_id
            )
            states[entity_id] = state

        return {"states": states, "timestamp": datetime.utcnow().isoformat()}

    except Exception as e:
        logger.error(f"Error getting device states: {e}")
        raise HTTPException(status_code=500, detail="Failed to get device states")


# Helper function (you'll need to implement this based on your auth system)
async def validate_websocket_token(token: str) -> str | None:
    """Validate WebSocket token and return user ID"""
    try:
        # Implement your token validation logic here
        # This should decode JWT token and return user_id
        # For now, returning None - you'll need to implement this
        return None
    except Exception as e:
        logger.error(f"Error validating websocket token: {e}")
        return None
