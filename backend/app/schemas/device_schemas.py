"""
Pydantic schemas for device monitoring and control API
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from enum import Enum


class DeviceType(str, Enum):
    LIGHT = "light"
    PUMP = "pump"
    FAN = "fan"
    SENSOR = "sensor"


class DeviceState(str, Enum):
    ON = "on"
    OFF = "off"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


# Device Action Schemas
class TurnOnAction(BaseModel):
    type: str = Field("turn_on", const=True)
    data: Optional[Dict[str, Any]] = None


class TurnOffAction(BaseModel):
    type: str = Field("turn_off", const=True)
    data: Optional[Dict[str, Any]] = None


class ToggleAction(BaseModel):
    type: str = Field("toggle", const=True)
    data: Optional[Dict[str, Any]] = None


class SetBrightnessAction(BaseModel):
    type: str = Field("set_brightness", const=True)
    brightness: int = Field(..., ge=0, le=255, description="Brightness level 0-255")


class SetColorAction(BaseModel):
    type: str = Field("set_color", const=True)
    rgb_color: List[int] = Field(
        ..., min_length=3, max_length=3, description="RGB color values [R, G, B]"
    )

    @field_validator("rgb_color")
    @classmethod
    def validate_rgb_values(cls, v):
        for val in v:
            if not 0 <= val <= 255:
                raise ValueError("RGB values must be between 0 and 255")
        return v


class SetSpeedAction(BaseModel):
    type: str = Field("set_speed", const=True)
    speed: int = Field(..., ge=0, le=100, description="Speed percentage 0-100")


# Union type for all device actions
DeviceAction = Union[
    TurnOnAction,
    TurnOffAction,
    ToggleAction,
    SetBrightnessAction,
    SetColorAction,
    SetSpeedAction,
]


# Device Capabilities Schema
class DeviceCapabilities(BaseModel):
    # Light capabilities
    brightness: Optional[bool] = None
    color_mode: Optional[bool] = None
    rgb_color: Optional[bool] = None
    color_temp: Optional[bool] = None
    effect: Optional[bool] = None

    # Pump/Fan capabilities
    speed_control: Optional[bool] = None
    flow_rate: Optional[bool] = None

    # Sensor capabilities
    measurement_unit: Optional[str] = None
    precision: Optional[int] = None

    # Common capabilities
    power: Optional[bool] = None
    scheduling: Optional[bool] = None


# Device Attributes Schema
class DeviceAttributes(BaseModel):
    # Common attributes
    friendly_name: Optional[str] = None
    icon: Optional[str] = None
    unit_of_measurement: Optional[str] = None

    # Light attributes
    brightness: Optional[int] = Field(None, ge=0, le=255)
    rgb_color: Optional[List[int]] = None
    color_temp: Optional[int] = None
    effect: Optional[str] = None

    # Sensor attributes
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None

    # Pump/Fan attributes
    speed: Optional[int] = Field(None, ge=0, le=100)
    flow_rate: Optional[float] = None

    # Device status
    last_seen: Optional[str] = None
    battery_level: Optional[int] = Field(None, ge=0, le=100)
    signal_strength: Optional[int] = None


# Request Schemas
class CreateDeviceAssignmentRequest(BaseModel):
    location_id: str = Field(..., description="Location ID in format 'R1-S3'")
    home_assistant_entity_id: str = Field(..., description="Home Assistant entity ID")
    device_type: DeviceType
    device_name: Optional[str] = None
    capabilities: Optional[DeviceCapabilities] = None


class UpdateDeviceAssignmentRequest(BaseModel):
    device_name: Optional[str] = None
    capabilities: Optional[DeviceCapabilities] = None
    is_active: Optional[bool] = None


class ControlDeviceRequest(BaseModel):
    entity_id: str = Field(..., description="Home Assistant entity ID")
    action: DeviceAction


class EmergencyControlRequest(BaseModel):
    type: str = Field(..., regex="^(emergency_stop|emergency_start|reset_all)$")
    location_ids: Optional[List[str]] = None
    device_types: Optional[List[DeviceType]] = None
    reason: Optional[str] = None


# Response Schemas
class DeviceAssignmentResponse(BaseModel):
    id: str
    user_id: str
    location_id: str
    home_assistant_entity_id: str
    device_type: DeviceType
    device_name: Optional[str] = None
    capabilities: DeviceCapabilities
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DeviceStateResponse(BaseModel):
    id: str
    user_id: str
    home_assistant_entity_id: str
    state: DeviceState
    attributes: DeviceAttributes
    last_updated: datetime
    last_changed: datetime


class DeviceDataResponse(DeviceAssignmentResponse):
    current_state: Optional[DeviceState] = None
    attributes: Optional[DeviceAttributes] = None
    last_updated: Optional[datetime] = None
    is_online: Optional[bool] = None


class LocationDevicesResponse(BaseModel):
    location_id: str
    devices: List[DeviceDataResponse]
    last_updated: str


class ControlDeviceResponse(BaseModel):
    success: bool
    entity_id: str
    action: DeviceAction
    new_state: Optional[DeviceState] = None
    error: Optional[str] = None


class DeviceControlHistoryResponse(BaseModel):
    id: str
    user_id: str
    home_assistant_entity_id: str
    action_type: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    triggered_by: str
    success: bool
    error_message: Optional[str] = None
    created_at: datetime


# WebSocket Message Schemas
class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: str


class DeviceStateUpdateMessage(BaseModel):
    type: str = Field("device_state_update", const=True)
    data: Dict[str, Any]
    timestamp: str


class DeviceControlResponseMessage(BaseModel):
    type: str = Field("device_control_response", const=True)
    data: Dict[str, Any]
    timestamp: str


class ConnectionStatusMessage(BaseModel):
    type: str = Field("connection_status", const=True)
    data: Dict[str, Any]
    timestamp: str


# Utility Schemas
class DeviceFilter(BaseModel):
    device_type: Optional[DeviceType] = None
    state: Optional[DeviceState] = None
    location_id: Optional[str] = None
    is_online: Optional[bool] = None


class DeviceHealthResponse(BaseModel):
    service_running: bool
    websocket_connected: bool
    home_assistant_connected: bool
    active_connections: int
    timestamp: str


class DeviceStatesResponse(BaseModel):
    states: Dict[str, Optional[str]]
    timestamp: str


class EmergencyControlResponse(BaseModel):
    success: bool
    affected_devices: Optional[int] = None
    successful_stops: Optional[int] = None
    failed_stops: Optional[int] = None
    results: Optional[List[ControlDeviceResponse]] = None
    error: Optional[str] = None
