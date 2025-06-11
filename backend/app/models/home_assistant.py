"""
Pydantic models for Home Assistant integration API endpoints.
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict, ValidationInfo
from datetime import datetime


class HomeAssistantDeviceBase(BaseModel):
    """Base model for Home Assistant device/entity"""
    model_config = ConfigDict()
    
    entity_id: str = Field(..., description="Home Assistant entity ID (e.g., 'light.kitchen')")
    friendly_name: Optional[str] = Field(None, description="Human-readable device name")
    state: str = Field(..., description="Current device state")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Device attributes")
    last_changed: Optional[datetime] = Field(None, description="When the state was last changed")
    last_updated: Optional[datetime] = Field(None, description="When the entity was last updated")


class HomeAssistantDevice(HomeAssistantDeviceBase):
    """Full Home Assistant device/entity model"""
    domain: str = Field(..., description="Device domain (light, switch, sensor, etc.)")
    device_class: Optional[str] = Field(None, description="Device class for categorization")
    unit_of_measurement: Optional[str] = Field(None, description="Unit of measurement for sensors")
    
    @field_validator('domain', mode='before')
    @classmethod
    def extract_domain(cls, v: str, info: ValidationInfo) -> str:
        """Extract domain from entity_id"""
        if info.data and 'entity_id' in info.data:
            entity_id = info.data.get('entity_id', '')
            if '.' in entity_id:
                return entity_id.split('.')[0]
        return v


class DeviceControlRequest(BaseModel):
    """Request model for device control operations"""
    model_config = ConfigDict()
    
    entity_id: str = Field(..., description="Target device entity ID")
    action: str = Field(..., description="Action to perform (on, off, toggle)")
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v: str) -> str:
        valid_actions = ['on', 'off', 'toggle']
        if v.lower() not in valid_actions:
            raise ValueError(f"Action must be one of: {', '.join(valid_actions)}")
        return v.lower()


class LightControlRequest(DeviceControlRequest):
    """Extended request model for light control with additional parameters"""
    brightness: Optional[int] = Field(None, ge=0, le=255, description="Brightness level (0-255)")
    color_temp: Optional[int] = Field(None, ge=1000, le=10000, description="Color temperature in Kelvin")
    rgb_color: Optional[List[int]] = Field(None, description="RGB color values [R, G, B]")
    
    @field_validator('rgb_color')
    @classmethod
    def validate_rgb_color(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is not None:
            if len(v) != 3:
                raise ValueError("RGB color must have exactly 3 values")
            if not all(0 <= val <= 255 for val in v):
                raise ValueError("RGB values must be between 0 and 255")
        return v


class IrrigationControlRequest(BaseModel):
    """Request model for irrigation system control"""
    model_config = ConfigDict()
    
    entity_id: str = Field(..., description="Solenoid valve entity ID")
    action: str = Field(..., description="Action (open, close, pulse)")
    duration_seconds: Optional[int] = Field(None, ge=1, le=3600, description="Duration for pulse action (1-3600 seconds)")
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v: str) -> str:
        valid_actions = ['open', 'close', 'pulse']
        if v.lower() not in valid_actions:
            raise ValueError(f"Action must be one of: {', '.join(valid_actions)}")
        return v.lower()
    
    @model_validator(mode='after')
    def validate_duration(self) -> 'IrrigationControlRequest':
        if self.action == 'pulse' and self.duration_seconds is None:
            raise ValueError("Duration is required for pulse action")
        return self


class DeviceSubscriptionRequest(BaseModel):
    """Request model for device subscription management"""
    model_config = ConfigDict()
    
    entity_id: str = Field(..., description="Device entity ID to subscribe to")
    subscribe: bool = Field(True, description="True to subscribe, False to unsubscribe")


class HomeAssistantServiceCall(BaseModel):
    """Model for Home Assistant service call requests"""
    model_config = ConfigDict()
    
    domain: str = Field(..., description="Service domain (e.g., 'light', 'switch')")
    service: str = Field(..., description="Service name (e.g., 'turn_on', 'turn_off')")
    entity_id: Optional[str] = Field(None, description="Target entity ID")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional service data")


class DeviceControlResponse(BaseModel):
    """Response model for device control operations"""
    model_config = ConfigDict()
    
    success: bool = Field(..., description="Whether the operation was successful")
    entity_id: str = Field(..., description="Target device entity ID")
    action: str = Field(..., description="Action that was performed")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the action was performed")
    message: Optional[str] = Field(None, description="Additional response message")


class HomeAssistantStatusResponse(BaseModel):
    """Response model for Home Assistant integration status"""
    model_config = ConfigDict()
    
    enabled: bool = Field(..., description="Whether Home Assistant integration is enabled")
    initialized: bool = Field(..., description="Whether the service is initialized")
    healthy: bool = Field(..., description="Overall health status")
    connected: bool = Field(default=False, description="Whether connected to Home Assistant (frontend compatibility)")
    rest_api: bool = Field(default=False, description="REST API connection status")
    websocket: bool = Field(default=False, description="WebSocket connection status")
    cached_entities: int = Field(default=0, description="Number of cached entities")
    subscribed_devices: int = Field(default=0, description="Number of subscribed devices")
    home_assistant_url: Optional[str] = Field(None, description="Home Assistant URL")
    message: Optional[str] = Field(None, description="Status message or error")
    error: Optional[str] = Field(None, description="Error details if unhealthy")


class DeviceListResponse(BaseModel):
    """Response model for device list endpoints"""
    model_config = ConfigDict()
    
    devices: List[HomeAssistantDevice] = Field(..., description="List of devices")
    total_count: int = Field(..., description="Total number of devices")
    device_type: Optional[str] = Field(None, description="Device type filter applied")


class DeviceDetailsResponse(BaseModel):
    """Response model for individual device details"""
    model_config = ConfigDict()
    
    device: Optional[HomeAssistantDevice] = Field(None, description="Device details")
    found: bool = Field(..., description="Whether the device was found")
    cached: bool = Field(default=False, description="Whether data was served from cache")


class ServiceListResponse(BaseModel):
    """Response model for available services"""
    model_config = ConfigDict()
    
    services: Dict[str, Dict] = Field(..., description="Available services by domain")
    total_domains: int = Field(..., description="Number of service domains")


class DeviceTypeFilter(BaseModel):
    """Model for device type filtering"""
    model_config = ConfigDict()
    
    device_types: List[str] = Field(default=["light", "switch", "sensor", "fan", "cover", "climate"], 
                                   description="Device types to include")
    
    @field_validator('device_types')
    @classmethod
    def validate_device_types(cls, v: List[str]) -> List[str]:
        valid_types = ["light", "switch", "sensor", "fan", "cover", "climate", "binary_sensor", 
                      "input_boolean", "automation", "script"]
        invalid_types = [t for t in v if t not in valid_types]
        if invalid_types:
            raise ValueError(f"Invalid device types: {', '.join(invalid_types)}")
        return v


class SensorData(BaseModel):
    """Model for sensor data from Home Assistant"""
    model_config = ConfigDict()
    
    entity_id: str = Field(..., description="Sensor entity ID")
    state: Union[str, float, int] = Field(..., description="Current sensor value")
    unit_of_measurement: Optional[str] = Field(None, description="Unit of measurement")
    device_class: Optional[str] = Field(None, description="Sensor device class")
    friendly_name: Optional[str] = Field(None, description="Human-readable sensor name")
    last_updated: datetime = Field(..., description="When the sensor was last updated")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Additional sensor attributes")


class SensorDataResponse(BaseModel):
    """Response model for sensor data endpoints"""
    model_config = ConfigDict()
    
    sensors: List[SensorData] = Field(..., description="List of sensor data")
    total_count: int = Field(..., description="Total number of sensors")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")


class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint"""
    model_config = ConfigDict()
    
    healthy: bool = Field(..., description="Overall health status")
    services: Dict[str, bool] = Field(..., description="Individual service health statuses")
    uptime: Optional[float] = Field(None, description="Service uptime in seconds")
    version: Optional[str] = Field(None, description="Home Assistant version")
    last_check: datetime = Field(default_factory=datetime.now, description="When health check was performed")


class WebSocketEventData(BaseModel):
    """Model for WebSocket event data"""
    model_config = ConfigDict()
    
    event_type: str = Field(..., description="Type of event")
    entity_id: str = Field(..., description="Entity that triggered the event")
    old_state: Optional[Dict[str, Any]] = Field(None, description="Previous entity state")
    new_state: Dict[str, Any] = Field(..., description="New entity state")
    timestamp: datetime = Field(default_factory=datetime.now, description="Event timestamp")


class ErrorResponse(BaseModel):
    """Standard error response model"""
    model_config = ConfigDict()
    
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error description")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")


class DeviceAssignmentRequest(BaseModel):
    """Request model for assigning devices to farm locations"""
    model_config = ConfigDict()
    
    shelf_id: Optional[str] = None
    rack_id: Optional[str] = None 
    row_id: Optional[str] = None
    farm_id: Optional[str] = None
    friendly_name: Optional[str] = None
    assigned_by: Optional[str] = None
    
    @model_validator(mode='after')
    def validate_assignment_level(self) -> 'DeviceAssignmentRequest':
        """Ensure device is assigned to exactly one level of the farm hierarchy"""
        assignment_fields = [self.shelf_id, self.rack_id, self.row_id, self.farm_id]
        assigned_levels = sum(1 for field in assignment_fields if field is not None)
        
        if assigned_levels != 1:
            raise ValueError("Device must be assigned to exactly one level: shelf, rack, row, or farm")
        
        return self 


# User Configuration Models
class HomeAssistantConfigRequest(BaseModel):
    """Request model for Home Assistant configuration"""
    model_config = ConfigDict()
    
    name: str = Field(..., description="User-defined name for this configuration")
    url: str = Field(..., description="Home Assistant URL")
    access_token: str = Field(..., description="Home Assistant long-lived access token")
    local_url: Optional[str] = Field(None, description="Optional local URL for WebSocket connections")
    cloudflare_enabled: bool = Field(default=False, description="Whether Cloudflare Access is enabled")
    cloudflare_client_id: Optional[str] = Field(None, description="Cloudflare Access client ID")
    cloudflare_client_secret: Optional[str] = Field(None, description="Cloudflare Access client secret")
    is_default: bool = Field(default=False, description="Whether this should be the default configuration")
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate URL format"""
        if not v.startswith(('http://', 'https://')):
            raise ValueError("URL must start with http:// or https://")
        # Remove trailing slash
        return v.rstrip('/')
    
    @field_validator('local_url')
    @classmethod
    def validate_local_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate local URL format if provided"""
        if v is not None:
            if not v.startswith(('http://', 'https://', 'ws://', 'wss://')):
                raise ValueError("Local URL must start with http://, https://, ws://, or wss://")
            return v.rstrip('/')
        return v


class HomeAssistantConfigResponse(BaseModel):
    """Response model for Home Assistant configuration"""
    model_config = ConfigDict()
    
    id: str = Field(..., description="Configuration ID")
    name: str = Field(..., description="Configuration name")
    url: str = Field(..., description="Home Assistant URL")
    local_url: Optional[str] = Field(None, description="Local URL for WebSocket connections")
    cloudflare_enabled: bool = Field(..., description="Whether Cloudflare Access is enabled")
    is_default: bool = Field(..., description="Whether this is the default configuration")
    enabled: bool = Field(..., description="Whether this configuration is enabled")
    last_tested: Optional[datetime] = Field(None, description="When connection was last tested")
    last_successful_connection: Optional[datetime] = Field(None, description="When last successful connection occurred")
    test_result: Optional[Dict[str, Any]] = Field(None, description="Last test results")
    created_at: datetime = Field(..., description="When configuration was created")
    updated_at: datetime = Field(..., description="When configuration was last updated")
    
    # Don't include sensitive fields like access_token and cloudflare_client_secret


class HomeAssistantTestConnectionRequest(BaseModel):
    """Request model for testing Home Assistant connection"""
    model_config = ConfigDict()
    
    url: str = Field(..., description="Home Assistant URL to test")
    access_token: str = Field(..., description="Access token to test")
    local_url: Optional[str] = Field(None, description="Optional local URL for WebSocket testing")
    cloudflare_enabled: bool = Field(default=False, description="Whether to test with Cloudflare Access")
    cloudflare_client_id: Optional[str] = Field(None, description="Cloudflare Access client ID")
    cloudflare_client_secret: Optional[str] = Field(None, description="Cloudflare Access client secret")
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate URL format"""
        if not v.startswith(('http://', 'https://')):
            raise ValueError("URL must start with http:// or https://")
        return v.rstrip('/')


class HomeAssistantTestConnectionResponse(BaseModel):
    """Response model for connection test results"""
    model_config = ConfigDict()
    
    success: bool = Field(..., description="Whether the test was successful")
    url: str = Field(..., description="URL that was tested")
    status: str = Field(..., description="Connection status")
    message: str = Field(..., description="Test result message")
    home_assistant_version: Optional[str] = Field(None, description="Home Assistant version if connected")
    device_count: Optional[int] = Field(None, description="Number of devices found")
    websocket_supported: bool = Field(default=False, description="Whether WebSocket connection works")
    rest_api_working: bool = Field(default=False, description="Whether REST API is working")
    cloudflare_working: Optional[bool] = Field(None, description="Whether Cloudflare Access is working")
    test_timestamp: datetime = Field(default_factory=datetime.now, description="When the test was performed")
    error_details: Optional[str] = Field(None, description="Detailed error information if test failed")


class UserDeviceConfigRequest(BaseModel):
    """Request model for user device configuration"""
    model_config = ConfigDict()
    
    entity_id: str = Field(..., description="Home Assistant entity ID")
    friendly_name: Optional[str] = Field(None, description="User-defined friendly name")
    room: Optional[str] = Field(None, description="Room/area assignment")
    is_favorite: bool = Field(default=False, description="Whether this is a favorite device")
    custom_settings: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom device settings")


class UserDeviceConfigResponse(BaseModel):
    """Response model for user device configuration"""
    model_config = ConfigDict()
    
    id: str = Field(..., description="Device config ID")
    entity_id: str = Field(..., description="Home Assistant entity ID")
    friendly_name: Optional[str] = Field(None, description="User-defined friendly name")
    device_type: str = Field(..., description="Device type")
    room: Optional[str] = Field(None, description="Room/area assignment")
    is_favorite: bool = Field(..., description="Whether this is a favorite device")
    custom_settings: Dict[str, Any] = Field(..., description="Custom device settings")
    created_at: datetime = Field(..., description="When device config was created")
    updated_at: datetime = Field(..., description="When device config was last updated") 