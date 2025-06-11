"""
Home Assistant Integration API Endpoints

This module provides REST API endpoints for controlling and monitoring
Home Assistant devices within the vertical farm system.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse

from app.services.user_home_assistant_service import (
    get_user_home_assistant_service,
    UserHomeAssistantService
)
from app.models.home_assistant import (
    DeviceControlRequest,
    LightControlRequest,
    IrrigationControlRequest,
    DeviceSubscriptionRequest,
    HomeAssistantServiceCall,
    DeviceControlResponse,
    HomeAssistantStatusResponse,
    DeviceListResponse,
    DeviceDetailsResponse,
    ServiceListResponse,
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
    UserDeviceConfigResponse
)
from app.db.supabase_client import get_async_supabase_client
from app.services.database_service import get_database
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


@router.post(
    "/lights/control",
    response_model=DeviceControlResponse,
    summary="Control Light",
    description="Control lights with advanced parameters (brightness, color, etc.) for the current user"
)
async def control_light(
    request: LightControlRequest,
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> DeviceControlResponse:
    """Control a light with advanced parameters for the authenticated user"""
    try:
        user_id = str(current_user.id)
        
        # Prepare light-specific parameters
        kwargs = {}
        if request.brightness is not None:
            kwargs["brightness"] = request.brightness
        if request.color_temp is not None:
            kwargs["color_temp"] = request.color_temp
        if request.rgb_color is not None:
            kwargs["rgb_color"] = request.rgb_color
        
        result = await user_ha_service.control_device(
            user_id,
            request.entity_id,
            request.action,
            **kwargs
        )
        
        return DeviceControlResponse(
            success=result["success"],
            entity_id=request.entity_id,
            action=request.action,
            timestamp=result["timestamp"],
            message=f"Light {request.action} command sent successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to control light {request.entity_id} for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to control light: {str(e)}"
        )


@router.post(
    "/irrigation/control",
    response_model=DeviceControlResponse,
    summary="Control Irrigation",
    description="Control irrigation solenoid valves with pulse functionality for the current user"
)
async def control_irrigation(
    request: IrrigationControlRequest,
    current_user = Depends(get_current_user),
    user_ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> DeviceControlResponse:
    """Control irrigation devices for the authenticated user"""
    try:
        user_id = str(current_user.id)
        
        # Handle irrigation-specific logic
        action = "on" if request.action == "open" else "off" if request.action == "close" else request.action
        
        kwargs = {}
        if request.action == "pulse" and request.duration_seconds:
            # For pulse, we'll turn on, wait, then turn off
            # This is a simplified implementation - ideally this would be handled by HA automation
            kwargs["duration"] = request.duration_seconds
        
        result = await user_ha_service.control_device(
            user_id,
            request.entity_id,
            action,
            **kwargs
        )
        
        return DeviceControlResponse(
            success=result["success"],
            entity_id=request.entity_id,
            action=request.action,
            timestamp=result["timestamp"],
            message=f"Irrigation {request.action} command sent successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to control irrigation {request.entity_id} for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to control irrigation: {str(e)}"
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


# Service Discovery Endpoints

@router.get(
    "/services",
    response_model=ServiceListResponse,
    summary="Get Available Services",
    description="Get all available Home Assistant services for device control"
)
async def get_available_services(
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> ServiceListResponse:
    """Get available Home Assistant services"""
    try:
        services = await ha_service.get_available_services()
        
        return ServiceListResponse(
            services=services,
            total_domains=len(services)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get available services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available services"
        )


@router.post(
    "/services/call",
    response_model=DeviceControlResponse,
    summary="Call Home Assistant Service",
    description="Call any Home Assistant service with custom parameters"
)
async def call_service(
    request: HomeAssistantServiceCall,
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service)
) -> DeviceControlResponse:
    """Call a Home Assistant service with custom parameters"""
    try:
        # Validate that the service exists (optional, could be removed for flexibility)
        if not ha_service.is_enabled():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Home Assistant integration is not enabled"
            )
        
        # Call the service through the client
        result = await ha_service.client.call_service(
            domain=request.domain,
            service=request.service,
            entity_id=request.entity_id,
            data=request.data
        )
        
        return DeviceControlResponse(
            success=True,
            entity_id=request.entity_id or "multiple",
            action=f"{request.domain}.{request.service}",
            message=f"Service {request.domain}.{request.service} called successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to call service {request.domain}.{request.service}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to call service {request.domain}.{request.service}"
        )


# Note: Exception handlers are not available on APIRouter, they need to be added to the main FastAPI app


@router.post("/devices/{entity_id}/assign")
async def assign_device_to_location(
    entity_id: str,
    assignment: DeviceAssignmentRequest,
    current_user = Depends(get_current_user),
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service),
    db = Depends(get_database)
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
        device = await ha_service.get_device(entity_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found in Home Assistant")
        
        # Store the assignment in the database
        query = """
        INSERT INTO device_assignments (shelf_id, rack_id, row_id, farm_id, entity_id, entity_type, friendly_name, assigned_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (entity_id) DO UPDATE SET
            shelf_id = EXCLUDED.shelf_id,
            rack_id = EXCLUDED.rack_id,
            row_id = EXCLUDED.row_id,
            farm_id = EXCLUDED.farm_id,
            friendly_name = EXCLUDED.friendly_name,
            updated_at = NOW()
        RETURNING *
        """
        
        values = [
            assignment.shelf_id,
            assignment.rack_id, 
            assignment.row_id,
            assignment.farm_id,
            entity_id,
            device.get("entity_type", "unknown"),
            assignment.friendly_name or device.get("name", entity_id),
            assignment.assigned_by
        ]
        
        result = await db.fetchrow(query, *values)
        
        return {
            "success": True,
            "message": f"Device {entity_id} assigned successfully",
            "assignment": dict(result)
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
    db = Depends(get_database)
):
    """Get device assignments, optionally filtered by farm location"""
    try:
        logger.info(f"get_device_assignments called by user {current_user.id}")
        
        # Check if database is available
        if db is None:
            logger.error("Database service is None")
            raise HTTPException(
                status_code=503,
                detail="Database service is currently unavailable. Device assignments cannot be retrieved."
            )
        
        logger.info(f"Database service is available: {db.is_available}")
        
        # Start with a simple query to test basic database connectivity
        try:
            simple_query = "SELECT COUNT(*) FROM device_assignments"
            count_result = await db.fetchval(simple_query)
            logger.info(f"Found {count_result} device assignments in total")
        except Exception as e:
            logger.error(f"Simple count query failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")
        
        # Now try the full query but simplified first
        try:
            base_query = """
            SELECT 
                da.*,
                f.name as farm_name,
                r.name as row_name,
                ra.name as rack_name,
                s.name as shelf_name
            FROM device_assignments da
            LEFT JOIN farms f ON da.farm_id = f.id
            LEFT JOIN rows r ON da.row_id = r.id  
            LEFT JOIN racks ra ON da.rack_id = ra.id
            LEFT JOIN shelves s ON da.shelf_id = s.id
            WHERE 1=1
            """
            
            conditions = []
            values = []
            
            if farm_id:
                conditions.append(f"AND (da.farm_id = ${len(values)+1} OR r.farm_id = ${len(values)+1} OR ra.row_id IN (SELECT id FROM rows WHERE farm_id = ${len(values)+1}) OR s.rack_id IN (SELECT id FROM racks WHERE row_id IN (SELECT id FROM rows WHERE farm_id = ${len(values)+1})))")
                values.append(farm_id)
            if row_id:
                conditions.append(f"AND (da.row_id = ${len(values)+1} OR ra.row_id = ${len(values)+1} OR s.rack_id IN (SELECT id FROM racks WHERE row_id = ${len(values)+1}))")
                values.append(row_id)
            if rack_id:
                conditions.append(f"AND (da.rack_id = ${len(values)+1} OR s.rack_id = ${len(values)+1})")
                values.append(rack_id)
            if shelf_id:
                conditions.append(f"AND da.shelf_id = ${len(values)+1}")
                values.append(shelf_id)
                
            query = base_query + " ".join(conditions) + " ORDER BY da.created_at DESC"
            
            logger.info(f"Executing query with {len(values)} parameters")
            results = await db.fetch(query, *values)
            logger.info(f"Query returned {len(results)} results")
            
            return {
                "assignments": [dict(row) for row in results],
                "count": len(results)
            }
        except Exception as e:
            logger.error(f"Main query execution failed: {str(e)}")
            logger.error(f"Query was: {query}")
            logger.error(f"Values were: {values}")
            raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_device_assignments: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.delete("/devices/{entity_id}/assignment")
async def remove_device_assignment(
    entity_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_database)
):
    """Remove device assignment from farm location"""
    try:
        # Check if database is available
        if db is None:
            raise HTTPException(
                status_code=503,
                detail="Database service is currently unavailable. Device assignments cannot be removed."
            )
        query = "DELETE FROM device_assignments WHERE entity_id = $1 RETURNING *"
        result = await db.fetchrow(query, entity_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Device assignment not found")
            
        return {
            "success": True,
            "message": f"Device assignment for {entity_id} removed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error removing device assignment {entity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/farms/{farm_id}/assigned-devices")
async def get_farm_assigned_devices(
    farm_id: str,
    current_user = Depends(get_current_user),
    ha_service: UserHomeAssistantService = Depends(get_user_home_assistant_service),
    db = Depends(get_database)
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
                device_state = await ha_service.get_device(entity_id)
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
    current_user = Depends(get_current_user)
) -> List[HomeAssistantConfigResponse]:
    """Get all Home Assistant configurations for the current user"""
    try:
        # Get Supabase client and query user's configurations
        db = await get_async_supabase_client()
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
    current_user = Depends(get_current_user)
) -> HomeAssistantConfigResponse:
    """Create a new Home Assistant configuration"""
    try:
        # Get Supabase client
        db = await get_async_supabase_client()
        
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
    current_user = Depends(get_current_user)
) -> HomeAssistantConfigResponse:
    """Update an existing Home Assistant configuration"""
    try:
        # Get Supabase client
        db = await get_async_supabase_client()
        
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
            "updated_at": "NOW()"
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
    current_user = Depends(get_current_user)
):
    """Delete a Home Assistant configuration"""
    try:
        # Get Supabase client
        db = await get_async_supabase_client()
        
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