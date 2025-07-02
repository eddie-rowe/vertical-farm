"""
Home Assistant Integration API Endpoints

This module provides REST API endpoints for controlling and monitoring
Home Assistant devices within the vertical farm system.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import JSONResponse
from datetime import datetime

from app.services.user_home_assistant_service import (
    get_user_home_assistant_service,
    UserHomeAssistantService
)
from app.models.home_assistant import (
    DeviceControlRequest,
    DeviceSubscriptionRequest,
    DeviceControlResponse,
    HomeAssistantStatusResponse,
    DeviceListResponse,
    DeviceDetailsResponse,
    SensorDataResponse,
    HealthCheckResponse,
    ErrorResponse,
    HomeAssistantDevice,
    SensorData,
    DeviceAssignmentRequest,
    HomeAssistantConfigRequest,
    HomeAssistantConfigResponse,
    HomeAssistantTestConnectionRequest,
    HomeAssistantTestConnectionResponse,
    UserDeviceConfigRequest,
    UserDeviceConfigResponse,
    DeviceImportRequest,
    ImportedDeviceResponse,
    ImportDevicesResponse,
    ImportedDeviceListResponse,
    ImportedDeviceUpdateRequest
)
from app.db.supabase_client import get_async_supabase_client, get_async_rls_client
from app.core.security import get_current_active_user as get_current_user


logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/status",
    response_model=HomeAssistantStatusResponse,
    summary="Get Home Assistant Integration Status",
    description="Get the current status and health of the Home Assistant integration for the current user"
)
async def get_integration_status(
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> HomeAssistantStatusResponse:
    """Get current integration status and health information for the authenticated user"""
    try:
        user_id = str(current_user.id)
        status_data = await user_ha_service.get_user_integration_status(user_id)
        return HomeAssistantStatusResponse(**status_data)
    except Exception as e:
        logger.error(f"Failed to get integration status for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve integration status"
        )


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health Check",
    description="Perform a detailed health check of Home Assistant connections for the current user"
)
async def health_check(
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> HealthCheckResponse:
    """Perform a comprehensive health check for the authenticated user"""
    try:
        user_id = str(current_user.id)
        status_data = await user_ha_service.get_user_integration_status(user_id)
        
        return HealthCheckResponse(
            healthy=status_data.get("healthy", False),
            services={
                "rest_api": status_data.get("rest_api", False),
                "websocket": status_data.get("websocket", False),
                "home_assistant": status_data.get("healthy", False)
            },
            version=None  # Could be extended to get HA version
        )
        
    except Exception as e:
        logger.error(f"Health check failed for user {current_user.id}: {e}")
        return HealthCheckResponse(
            healthy=False,
            services={"home_assistant": False},
            version=None
        )


# Device Discovery Endpoints

@router.post(
    "/discover",
    response_model=DeviceListResponse,
    summary="Discover Home Assistant Devices",
    description="Discover and retrieve all Home Assistant devices/entities for the current user"
)
async def discover_devices(
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> DeviceListResponse:
    """Discover all available Home Assistant devices for the authenticated user"""
    try:
        user_id = str(current_user.id)
        
        # Get devices from Home Assistant
        devices = await user_ha_service.get_user_devices(user_id)
        
        # Convert to Pydantic models
        device_models = []
        for device in devices:
            try:
                # Extract domain from entity_id
                entity_id = device.get("entity_id", "")
                domain = entity_id.split(".")[0] if "." in entity_id else "unknown"
                
                # Handle both service format (name) and HA format (friendly_name in attributes)
                friendly_name = (device.get("name") or 
                               device.get("attributes", {}).get("friendly_name") or 
                               entity_id)
                
                device_model = HomeAssistantDevice(
                    entity_id=entity_id,
                    friendly_name=friendly_name,
                    state=device.get("state", "unknown"),
                    attributes=device.get("attributes", {}),
                    last_changed=device.get("last_changed"),
                    last_updated=device.get("last_updated"),
                    domain=domain,
                    device_class=device.get("attributes", {}).get("device_class"),
                    unit_of_measurement=device.get("attributes", {}).get("unit_of_measurement")
                )
                device_models.append(device_model)
            except Exception as e:
                logger.warning(f"Failed to parse device {device.get('entity_id', 'unknown')} for user {user_id}: {e}")
                continue
        
        logger.info(f"Discovered {len(device_models)} devices for user {user_id}")
        
        return DeviceListResponse(
            devices=device_models,
            total_count=len(device_models),
            device_type=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to discover devices for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to discover devices"
        )


@router.get(
    "/devices",
    response_model=DeviceListResponse,
    summary="Get All Devices",
    description="Retrieve all Home Assistant devices/entities for the current user"
)
async def get_all_devices(
    response: Response,
    device_type: Optional[str] = Query(None, description="Filter by device type (light, switch, sensor, etc.)"),
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> DeviceListResponse:
    """Get all devices or devices of a specific type for the authenticated user"""
    try:
        user_id = str(current_user.id)
        devices = await user_ha_service.get_user_devices(user_id, device_type)
        
        # Convert to Pydantic models
        device_models = []
        for device in devices:
            try:
                # Extract domain from entity_id
                entity_id = device.get("entity_id", "")
                domain = entity_id.split(".")[0] if "." in entity_id else "unknown"
                
                device_model = HomeAssistantDevice(
                    entity_id=entity_id,
                    friendly_name=device.get("attributes", {}).get("friendly_name"),
                    state=device.get("state", "unknown"),
                    attributes=device.get("attributes", {}),
                    last_changed=device.get("last_changed"),
                    last_updated=device.get("last_updated"),
                    domain=domain,
                    device_class=device.get("attributes", {}).get("device_class"),
                    unit_of_measurement=device.get("attributes", {}).get("unit_of_measurement")
                )
                device_models.append(device_model)
            except Exception as e:
                logger.warning(f"Failed to parse device {device.get('entity_id', 'unknown')} for user {user_id}: {e}")
                continue
        
        # Add cache headers for device list (cache for 2 minutes)
        response.headers["Cache-Control"] = "public, max-age=120"
        response.headers["ETag"] = f'"{hash(str(device_models))}"'
        
        return DeviceListResponse(
            devices=device_models,
            total_count=len(device_models),
            device_type=device_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get devices for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve devices"
        )


# Device Import Endpoints (Must be before /devices/{entity_id} to avoid routing conflicts)

@router.post(
    "/devices/import",
    response_model=ImportDevicesResponse,
    summary="Import Devices to User Library",
    description="Import discovered Home Assistant devices to the user's device library for later assignment"
)
async def import_devices_endpoint(
    request: DeviceImportRequest,
    current_user = Depends(get_current_user),
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service),
    db = Depends(get_async_rls_client)
) -> ImportDevicesResponse:
    """Import devices to user's device library"""
    try:
        user_id = str(current_user.id)
        imported_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []
        imported_devices = []
        
        for entity_id in request.entity_ids:
            try:
                # Get device details from Home Assistant
                device = await ha_service.get_user_device(user_id, entity_id)
                if not device:
                    errors.append(f"Device {entity_id} not found in Home Assistant")
                    skipped_count += 1
                    continue
                
                # Prepare device data for import
                device_name = device.get("attributes", {}).get("friendly_name") or device.get("name") or entity_id
                device_type = entity_id.split(".")[0] if "." in entity_id else "unknown"
                
                device_data = {
                    "user_id": user_id,
                    "entity_id": entity_id,
                    "name": device_name,
                    "device_type": device_type,
                    "state": device.get("state", "unknown"),
                    "attributes": device.get("attributes", {}),
                    "is_assigned": False,
                    "last_seen": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                # Import or update device
                if request.update_existing:
                    result = await db.table("home_assistant_devices").upsert(
                        device_data,
                        on_conflict="user_id,entity_id"
                    ).execute()
                    
                    if result.data:
                        imported_count += 1
                else:
                    # Only insert if doesn't exist
                    existing = await db.table("home_assistant_devices").select("id").eq("user_id", user_id).eq("entity_id", entity_id).execute()
                    if existing.data:
                        skipped_count += 1
                        continue
                    
                    result = await db.table("home_assistant_devices").insert(device_data).execute()
                    imported_count += 1
                
                if result.data:
                    device_record = result.data[0]
                    imported_device = ImportedDeviceResponse(
                        id=device_record["id"],
                        entity_id=device_record["entity_id"],
                        name=device_record["name"],
                        device_type=device_record["device_type"],
                        state=device_record.get("state"),
                        attributes=device_record.get("attributes", {}),
                        is_assigned=device_record.get("is_assigned", False),
                        last_seen=device_record["last_seen"],
                        created_at=device_record["created_at"],
                        updated_at=device_record["updated_at"]
                    )
                    imported_devices.append(imported_device)
                else:
                    errors.append(f"Failed to save device {entity_id} to database")
            except Exception as e:
                logger.error(f"Failed to import device {entity_id}: {e}")
                errors.append(f"Failed to import {entity_id}: {str(e)}")
                skipped_count += 1
        
        return ImportDevicesResponse(
            success=len(errors) == 0 or (imported_count + updated_count) > 0,
            imported_count=imported_count,
            updated_count=updated_count,
            skipped_count=skipped_count,
            errors=errors,
            imported_devices=imported_devices
        )
        
    except Exception as e:
        logger.error(f"Failed to import devices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import devices: {str(e)}"
        )


@router.get(
    "/devices/imported",
    response_model=ImportedDeviceListResponse,
    summary="Get Imported Devices",
    description="Get all devices imported to the user's device library"
)
async def get_imported_devices(
    device_type: Optional[str] = Query(None, description="Filter by device type"),
    assigned: Optional[bool] = Query(None, description="Filter by assignment status"),
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
) -> ImportedDeviceListResponse:
    """Get user's imported devices"""
    try:
        user_id = str(current_user.id)
        
        # Build query
        query = db.table("home_assistant_devices").select("*").eq("user_id", user_id)
        
        # Apply filters
        if device_type:
            query = query.eq("device_type", device_type)
        if assigned is not None:
            query = query.eq("is_assigned", assigned)
        
        # Execute query
        result = await query.order("created_at", desc=True).execute()
        
        if not result.data:
            result.data = []
        
        # Convert to response models
        devices = []
        assigned_count = 0
        for device_data in result.data:
            device = ImportedDeviceResponse(
                id=device_data["id"],
                entity_id=device_data["entity_id"],
                name=device_data["name"],
                device_type=device_data["device_type"],
                state=device_data.get("state"),
                attributes=device_data.get("attributes", {}),
                is_assigned=device_data.get("is_assigned", False),
                last_seen=device_data["last_seen"],
                created_at=device_data["created_at"],
                updated_at=device_data["updated_at"]
            )
            devices.append(device)
            if device.is_assigned:
                assigned_count += 1
        
        return ImportedDeviceListResponse(
            devices=devices,
            total_count=len(devices),
            assigned_count=assigned_count,
            unassigned_count=len(devices) - assigned_count
        )
        
    except Exception as e:
        logger.error(f"Failed to get imported devices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get imported devices: {str(e)}"
        )


@router.put(
    "/devices/imported/{entity_id}",
    response_model=ImportedDeviceResponse,
    summary="Update Imported Device",
    description="Update information for an imported device"
)
async def update_imported_device(
    entity_id: str,
    request: ImportedDeviceUpdateRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
) -> ImportedDeviceResponse:
    """Update imported device information"""
    try:
        user_id = str(current_user.id)
        
        # Prepare update data
        update_data = {"updated_at": datetime.now().isoformat()}
        if request.name is not None:
            update_data["name"] = request.name
        if request.device_type is not None:
            update_data["device_type"] = request.device_type
        
        # Update device
        result = await db.table("home_assistant_devices").update(update_data).eq("user_id", user_id).eq("entity_id", entity_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Imported device not found")
        
        device_data = result.data[0]
        return ImportedDeviceResponse(
            id=device_data["id"],
            entity_id=device_data["entity_id"],
            name=device_data["name"],
            device_type=device_data["device_type"],
            state=device_data.get("state"),
            attributes=device_data.get("attributes", {}),
            is_assigned=device_data.get("is_assigned", False),
            last_seen=device_data["last_seen"],
            created_at=device_data["created_at"],
            updated_at=device_data["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update imported device {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update imported device: {str(e)}"
        )


@router.delete(
    "/devices/imported/{entity_id}",
    summary="Remove Imported Device",
    description="Remove a device from the user's imported device library"
)
async def remove_imported_device(
    entity_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
):
    """Remove device from user's imported library"""
    try:
        user_id = str(current_user.id)
        
        # Delete device
        result = await db.table("home_assistant_devices").delete().eq("user_id", user_id).eq("entity_id", entity_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Imported device not found")
        
        return {
            "success": True,
            "message": f"Device {entity_id} removed from imported library"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove imported device {entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove imported device: {str(e)}"
        )


@router.get(
    "/devices/{entity_id}",
    response_model=DeviceDetailsResponse,
    summary="Get Device Details",
    description="Get detailed information about a specific device for the current user"
)
async def get_device_details(
    entity_id: str,
    use_cache: bool = Query(True, description="Use cached data if available"),
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> DeviceDetailsResponse:
    """Get details for a specific device for the authenticated user"""
    try:
        user_id = str(current_user.id)
        device = await user_ha_service.get_user_device(user_id, entity_id)
        
        if not device:
            return DeviceDetailsResponse(
                device=None,
                found=False,
                cached=False
            )
        
        # Convert to Pydantic model
        domain = entity_id.split(".")[0] if "." in entity_id else "unknown"
        
        device_model = HomeAssistantDevice(
            entity_id=entity_id,
            friendly_name=device.get("attributes", {}).get("friendly_name"),
            state=device.get("state", "unknown"),
            attributes=device.get("attributes", {}),
            last_changed=device.get("last_changed"),
            last_updated=device.get("last_updated"),
            domain=domain,
            device_class=device.get("attributes", {}).get("device_class"),
            unit_of_measurement=device.get("attributes", {}).get("unit_of_measurement")
        )
        
        return DeviceDetailsResponse(
            device=device_model,
            found=True,
            cached=use_cache
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get device {entity_id} for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve device details"
        )


# Device Control Endpoints

@router.post(
    "/devices/control",
    response_model=DeviceControlResponse,
    summary="Control Device",
    description="Turn a device on, off, or toggle its state for the current user"
)
async def control_device(
    request: DeviceControlRequest,
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> DeviceControlResponse:
    """Control a device (on/off/toggle) for the authenticated user"""
    try:
        user_id = str(current_user.id)
        result = await user_ha_service.control_device(
            user_id, 
            request.entity_id, 
            request.action
        )
        
        return DeviceControlResponse(
            success=result["success"],
            entity_id=request.entity_id,
            action=request.action,
            timestamp=result["timestamp"],
            message=f"Device {request.action} command sent successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to control device {request.entity_id} for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to control device: {str(e)}"
        )





# Sensor Monitoring Endpoints

@router.get(
    "/sensors",
    response_model=SensorDataResponse,
    summary="Get Sensor Data",
    description="Retrieve current sensor readings from Home Assistant"
)
async def get_sensor_data(
    sensor_type: Optional[str] = Query(None, description="Filter by sensor type"),
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> SensorDataResponse:
    """Get current sensor data for the authenticated user"""
    try:
        user_id = str(current_user.id)
        
        # Get sensor devices for the user
        sensors = await user_ha_service.get_user_devices(user_id, "sensor")
        
        # Filter by sensor type if specified
        if sensor_type:
            sensors = [s for s in sensors if s.get("attributes", {}).get("device_class") == sensor_type]
        
        # Convert to sensor data models
        sensor_models = []
        for sensor in sensors:
            try:
                sensor_model = SensorData(
                    entity_id=sensor.get("entity_id", ""),
                    state=sensor.get("state", "unknown"),
                    unit_of_measurement=sensor.get("attributes", {}).get("unit_of_measurement"),
                    device_class=sensor.get("attributes", {}).get("device_class"),
                    friendly_name=sensor.get("attributes", {}).get("friendly_name"),
                    last_updated=sensor.get("last_updated"),
                    attributes=sensor.get("attributes", {})
                )
                sensor_models.append(sensor_model)
            except Exception as e:
                logger.warning(f"Failed to parse sensor {sensor.get('entity_id', 'unknown')} for user {user_id}: {e}")
                continue
        
        return SensorDataResponse(
            sensors=sensor_models,
            total_count=len(sensor_models)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get sensor data for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sensor data"
        )


# Device Subscription Endpoints

@router.post(
    "/devices/subscribe",
    summary="Subscribe to Device Updates",
    description="Subscribe to real-time updates for a specific device"
)
async def subscribe_to_device(
    request: DeviceSubscriptionRequest,
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
):
    """Subscribe or unsubscribe from device updates"""
    try:
        if request.subscribe:
            await ha_service.subscribe_to_device_updates(request.entity_id)
            message = f"Subscribed to updates for {request.entity_id}"
        else:
            await ha_service.unsubscribe_from_device_updates(request.entity_id)
            message = f"Unsubscribed from updates for {request.entity_id}"
        
        return {
            "success": True,
            "entity_id": request.entity_id,
            "subscribed": request.subscribe,
            "message": message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to manage subscription for {request.entity_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to manage subscription for {request.entity_id}"
        )



# Device Assignment Endpoints

# Note: Exception handlers are not available on APIRouter, they need to be added to the main FastAPI app


@router.post("/devices/{entity_id}/assign")
async def assign_device_to_location(
    entity_id: str,
    assignment: DeviceAssignmentRequest,
    current_user = Depends(get_current_user),
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service),
    db = Depends(get_async_rls_client)
):
    """Assign a Home Assistant device to a farm location (shelf, rack, row, or farm level)"""
    try:
        # Check if database is available
        if db is None:
            raise HTTPException(
                status_code=503,
                detail="Database service is currently unavailable. Device assignments cannot be stored."
            )
        
        # First verify the device exists in Home Assistant
        device = await ha_service.get_user_device(str(current_user.id), entity_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found in Home Assistant")
        
        # Store the assignment in the database using Supabase
        assignment_data = {
            "user_id": str(current_user.id),
            "entity_id": entity_id,
            "entity_type": device.get("entity_type", "unknown"),
            "friendly_name": assignment.friendly_name or device.get("name", entity_id),
            "farm_id": str(assignment.farm_id) if assignment.farm_id else None,
            "row_id": str(assignment.row_id) if assignment.row_id else None,
            "rack_id": str(assignment.rack_id) if assignment.rack_id else None,
            "shelf_id": str(assignment.shelf_id) if assignment.shelf_id else None,
            "assigned_by": assignment.assigned_by
        }
        
        # Use upsert to handle conflicts
        result = await db.table("device_assignments").upsert(
            assignment_data,
            on_conflict="user_id,entity_id"
        ).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to store device assignment")
        
        assignment_record = result.data[0]
        
        # Also mark the device as assigned in home_assistant_devices table if it exists
        try:
            await db.table("home_assistant_devices").update({
                "is_assigned": True,
                "farm_location": {
                    "farm_id": assignment.farm_id,
                    "row_id": assignment.row_id,
                    "rack_id": assignment.rack_id,
                    "shelf_id": assignment.shelf_id
                },
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", str(current_user.id)).eq("entity_id", entity_id).execute()
        except Exception as e:
            # Don't fail the assignment if updating imported device fails
            logger.warning(f"Failed to update imported device assignment status: {e}")
        
        return {
            "success": True,
            "message": f"Device {entity_id} assigned successfully",
            "assignment": assignment_record
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning device {entity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/assignments")
async def get_device_assignments(
    farm_id: Optional[str] = None,
    row_id: Optional[str] = None,
    rack_id: Optional[str] = None,
    shelf_id: Optional[str] = None,
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
):
    """Get device assignments, optionally filtered by farm location"""
    try:
        logger.info(f"get_device_assignments called by user {current_user.id}")
        
        # Build query with filters using Supabase
        query = db.table("device_assignments").select(
            "*, farms(name), rows(name), racks(name), shelves(name)"
        )
        
        # Apply filters
        if farm_id:
            query = query.or_(f"farm_id.eq.{farm_id},rows.farm_id.eq.{farm_id}")
        if row_id:
            query = query.or_(f"row_id.eq.{row_id},racks.row_id.eq.{row_id}")
        if rack_id:
            query = query.or_(f"rack_id.eq.{rack_id},shelves.rack_id.eq.{rack_id}")
        if shelf_id:
            query = query.eq("shelf_id", shelf_id)
        
        # Execute query
        result = await query.order("created_at", desc=True).execute()
        
        if result.data is None:
            logger.error("Query returned None data")
            raise HTTPException(status_code=500, detail="Failed to retrieve device assignments")
        
        logger.info(f"Query returned {len(result.data)} results")
        
        return {
            "assignments": result.data,
            "count": len(result.data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_device_assignments: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.delete("/devices/{entity_id}/assignment")
async def remove_device_assignment(
    entity_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
):
    """Remove device assignment from farm location"""
    try:
        # Delete the assignment using Supabase
        result = await db.table("device_assignments").delete().eq("entity_id", entity_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Device assignment not found")
        
        # Also mark the device as unassigned in home_assistant_devices table if it exists
        try:
            await db.table("home_assistant_devices").update({
                "is_assigned": False,
                "farm_location": None,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", str(current_user.id)).eq("entity_id", entity_id).execute()
        except Exception as e:
            # Don't fail the unassignment if updating imported device fails
            logger.warning(f"Failed to update imported device unassignment status: {e}")
            
        return {
            "success": True,
            "message": f"Device assignment for {entity_id} removed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing device assignment {entity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/farms/{farm_id}/assigned-devices")
async def get_farm_assigned_devices(
    farm_id: str,
    current_user = Depends(get_current_user),
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service),
    db = Depends(get_async_rls_client)
):
    """Get all devices assigned to a specific farm with their current states"""
    try:
        # Check if database is available
        if db is None:
            raise HTTPException(
                status_code=503,
                detail="Database service is currently unavailable. Farm device assignments cannot be retrieved."
            )
        # Get device assignments for this farm
        assignments_response = await get_device_assignments(farm_id=farm_id, current_user=current_user, db=db)
        assignments = assignments_response["assignments"]
        
        # Get current states from Home Assistant
        devices_with_states = []
        for assignment in assignments:
            entity_id = assignment["entity_id"]
            try:
                device_state = await ha_service.get_user_device(str(current_user.id), entity_id)
                devices_with_states.append({
                    **assignment,
                    "current_state": device_state
                })
            except Exception as e:
                logger.warning(f"Could not get state for device {entity_id}: {str(e)}")
                devices_with_states.append({
                    **assignment,
                    "current_state": None,
                    "state_error": str(e)
                })
        
        return {
            "farm_id": farm_id,
            "devices": devices_with_states,
            "count": len(devices_with_states)
        }
        
    except Exception as e:
        logger.error(f"Error fetching farm assigned devices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# User Configuration Endpoints

@router.get(
    "/config",
    response_model=List[HomeAssistantConfigResponse],
    summary="Get User Home Assistant Configurations",
    description="Get all Home Assistant configurations for the current user"
)
async def get_user_configs(
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
) -> List[HomeAssistantConfigResponse]:
    """Get all Home Assistant configurations for the current user"""
    try:
        # Query user's configurations using RLS client
        result = await db.from_("user_home_assistant_configs").select("*").eq("user_id", current_user.id).execute()
        
        configs = []
        for config in result.data:
            configs.append(HomeAssistantConfigResponse(
                id=config["id"],
                name=config["name"],
                url=config["url"],
                local_url=config.get("local_url"),
                cloudflare_enabled=config.get("cloudflare_enabled", False),
                is_default=config.get("is_default", False),
                enabled=config.get("enabled", True),
                last_tested=config.get("last_tested"),
                last_successful_connection=config.get("last_successful_connection"),
                test_result=config.get("test_result"),
                created_at=config["created_at"],
                updated_at=config["updated_at"]
            ))
        
        return configs
        
    except Exception as e:
        logger.error(f"Failed to get user configs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve configurations"
        )


@router.post(
    "/config",
    response_model=HomeAssistantConfigResponse,
    summary="Create Home Assistant Configuration",
    description="Create a new Home Assistant configuration for the current user"
)
async def create_user_config(
    config_request: HomeAssistantConfigRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
) -> HomeAssistantConfigResponse:
    """Create a new Home Assistant configuration"""
    try:
        # Use RLS client for database operations
        
        # Check if user already has configurations to handle unique constraints
        existing_configs = await db.from_("user_home_assistant_configs").select("name, is_default").eq("user_id", current_user.id).execute()
        
        existing_names = [config["name"] for config in existing_configs.data] if existing_configs.data else []
        existing_defaults = [config for config in existing_configs.data if config.get("is_default")] if existing_configs.data else []
        
        # Handle unique name constraint
        config_name = config_request.name
        if config_name in existing_names:
            # Generate a unique name
            counter = 1
            base_name = config_name
            while config_name in existing_names:
                config_name = f"{base_name} ({counter})"
                counter += 1
        
        # Handle unique default constraint - if user already has a default and this is default, unset others
        is_default = config_request.is_default
        if not existing_configs.data:
            # First configuration should be default
            is_default = True
        elif config_request.is_default and existing_defaults:
            # We'll let the database trigger handle setting others to non-default
            pass
        else:
            # Force non-default if user already has configs to avoid constraint issues
            is_default = False
        
        # Prepare configuration data
        config_data = {
            "user_id": str(current_user.id),  # Ensure UUID is string
            "name": config_name,
            "url": config_request.url,
            "access_token": config_request.access_token,  # Should be encrypted in production
            "local_url": config_request.local_url,
            "cloudflare_enabled": config_request.cloudflare_enabled,
            "cloudflare_client_id": config_request.cloudflare_client_id,
            "cloudflare_client_secret": config_request.cloudflare_client_secret,  # Should be encrypted
            "is_default": is_default
        }
        
        # Insert new configuration
        try:
            result = await db.from_("user_home_assistant_configs").insert(config_data).execute()
        except Exception as insert_error:
            # Handle unique constraint violations
            error_message = str(insert_error)
            if "unique_default_per_user" in error_message or "23505" in error_message:
                # Retry with is_default = False to work around constraint issues
                logger.warning(f"Unique constraint violation, retrying with is_default=False: {error_message}")
                config_data["is_default"] = False
                result = await db.from_("user_home_assistant_configs").insert(config_data).execute()
            else:
                raise insert_error
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create configuration"
            )
        
        created_config = result.data[0]
        
        return HomeAssistantConfigResponse(
            id=created_config["id"],
            name=created_config["name"],
            url=created_config["url"],
            local_url=created_config.get("local_url"),
            cloudflare_enabled=created_config.get("cloudflare_enabled", False),
            is_default=created_config.get("is_default", False),
            enabled=created_config.get("enabled", True),
            last_tested=created_config.get("last_tested"),
            last_successful_connection=created_config.get("last_successful_connection"),
            test_result=created_config.get("test_result"),
            created_at=created_config["created_at"],
            updated_at=created_config["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create user config: {e}")
        logger.error(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create configuration: {str(e)}"
        )


@router.post(
    "/test-connection",
    response_model=HomeAssistantTestConnectionResponse,
    summary="Test Home Assistant Connection",
    description="Test connection to a Home Assistant instance without saving the configuration"
)
async def test_connection(
    test_request: HomeAssistantTestConnectionRequest,
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> HomeAssistantTestConnectionResponse:
    """Test connection to Home Assistant instance for the authenticated user"""
    try:
        user_id = str(current_user.id)
        
        # Prepare config for testing
        test_config = {
            "url": test_request.url,
            "access_token": test_request.access_token,
            "cloudflare_enabled": test_request.cloudflare_enabled,
            "cloudflare_client_id": test_request.cloudflare_client_id,
            "cloudflare_client_secret": test_request.cloudflare_client_secret
        }
        
        # Use the user service to test the connection
        result = await user_ha_service.test_user_connection(user_id, test_config)
        
        return HomeAssistantTestConnectionResponse(
            success=result["success"],
            url=result["url"],
            status=result["status"],
            message=result["message"],
            home_assistant_version=result.get("home_assistant_version"),
            device_count=result.get("device_count"),
            websocket_supported=result.get("websocket_supported", False),
            rest_api_working=result.get("rest_api_working", False),
            cloudflare_working=result.get("cloudflare_working", False),
            error_details=result.get("error_details")
        )
            
    except Exception as e:
        logger.error(f"Test connection failed for user {current_user.id}: {e}")
        return HomeAssistantTestConnectionResponse(
            success=False,
            url=test_request.url,
            status="error",
            message=f"Test failed: {str(e)}",
            rest_api_working=False,
            error_details=str(e)
        )


@router.put(
    "/config/{config_id}",
    response_model=HomeAssistantConfigResponse,
    summary="Update Home Assistant Configuration",
    description="Update an existing Home Assistant configuration"
)
async def update_user_config(
    config_id: str,
    config_request: HomeAssistantConfigRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
) -> HomeAssistantConfigResponse:
    """Update an existing Home Assistant configuration"""
    try:
        # Use RLS client for database operations
        
        # Verify ownership and get existing config
        existing_result = await db.from_("user_home_assistant_configs").select("*").eq("id", config_id).eq("user_id", str(current_user.id)).execute()
        
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration not found"
            )
        
        # Prepare update data
        update_data = {
            "name": config_request.name,
            "url": config_request.url,
            "access_token": config_request.access_token,
            "local_url": config_request.local_url,
            "cloudflare_enabled": config_request.cloudflare_enabled,
            "cloudflare_client_id": config_request.cloudflare_client_id,
            "cloudflare_client_secret": config_request.cloudflare_client_secret,
            "is_default": config_request.is_default,
            "updated_at": datetime.now().isoformat()
        }
        
        # Update configuration
        result = await db.from_("user_home_assistant_configs").update(update_data).eq("id", config_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update configuration"
            )
        
        updated_config = result.data[0]
        
        return HomeAssistantConfigResponse(
            id=updated_config["id"],
            name=updated_config["name"],
            url=updated_config["url"],
            local_url=updated_config.get("local_url"),
            cloudflare_enabled=updated_config.get("cloudflare_enabled", False),
            is_default=updated_config.get("is_default", False),
            enabled=updated_config.get("enabled", True),
            last_tested=updated_config.get("last_tested"),
            last_successful_connection=updated_config.get("last_successful_connection"),
            test_result=updated_config.get("test_result"),
            created_at=updated_config["created_at"],
            updated_at=updated_config["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update configuration"
        )


@router.delete(
    "/config/{config_id}",
    summary="Delete Home Assistant Configuration",
    description="Delete a Home Assistant configuration"
)
async def delete_user_config(
    config_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_async_rls_client)
):
    """Delete a Home Assistant configuration"""
    try:
        # Use RLS client for database operations
        
        # Verify ownership and delete
        result = await db.from_("user_home_assistant_configs").delete().eq("id", config_id).eq("user_id", str(current_user.id)).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration not found"
            )
        
        return {"message": "Configuration deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete user config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete configuration"
        )












 