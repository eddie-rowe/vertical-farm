"""
Pydantic schemas for device monitoring and control API
"""

from datetime import datetime
from enum import Enum
from typing import Any, Union

from pydantic import BaseModel, Field, field_validator


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
    data: dict[str, Any] | None = None


class TurnOffAction(BaseModel):
    type: str = Field("turn_off", const=True)
    data: dict[str, Any] | None = None


class ToggleAction(BaseModel):
    type: str = Field("toggle", const=True)
    data: dict[str, Any] | None = None


class SetBrightnessAction(BaseModel):
    type: str = Field("set_brightness", const=True)
    brightness: int = Field(..., ge=0, le=255, description="Brightness level 0-255")


class SetColorAction(BaseModel):
    type: str = Field("set_color", const=True)
    rgb_color: list[int] = Field(
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
    brightness: bool | None = None
    color_mode: bool | None = None
    rgb_color: bool | None = None
    color_temp: bool | None = None
    effect: bool | None = None

    # Pump/Fan capabilities
    speed_control: bool | None = None
    flow_rate: bool | None = None

    # Sensor capabilities
    measurement_unit: str | None = None
    precision: int | None = None

    # Common capabilities
    power: bool | None = None
    scheduling: bool | None = None


# Device Attributes Schema
class DeviceAttributes(BaseModel):
    # Common attributes
    friendly_name: str | None = None
    icon: str | None = None
    unit_of_measurement: str | None = None

    # Light attributes
    brightness: int | None = Field(None, ge=0, le=255)
    rgb_color: list[int] | None = None
    color_temp: int | None = None
    effect: str | None = None

    # Sensor attributes
    temperature: float | None = None
    humidity: float | None = None
    pressure: float | None = None

    # Pump/Fan attributes
    speed: int | None = Field(None, ge=0, le=100)
    flow_rate: float | None = None

    # Device status
    last_seen: str | None = None
    battery_level: int | None = Field(None, ge=0, le=100)
    signal_strength: int | None = None


# Request Schemas
class CreateDeviceAssignmentRequest(BaseModel):
    location_id: str = Field(..., description="Location ID in format 'R1-S3'")
    home_assistant_entity_id: str = Field(..., description="Home Assistant entity ID")
    device_type: DeviceType
    device_name: str | None = None
    capabilities: DeviceCapabilities | None = None


class UpdateDeviceAssignmentRequest(BaseModel):
    device_name: str | None = None
    capabilities: DeviceCapabilities | None = None
    is_active: bool | None = None


class ControlDeviceRequest(BaseModel):
    entity_id: str = Field(..., description="Home Assistant entity ID")
    action: DeviceAction


class EmergencyControlRequest(BaseModel):
    type: str = Field(..., regex="^(emergency_stop|emergency_start|reset_all)$")
    location_ids: list[str] | None = None
    device_types: list[DeviceType] | None = None
    reason: str | None = None


# Response Schemas
class DeviceAssignmentResponse(BaseModel):
    id: str
    user_id: str
    location_id: str
    home_assistant_entity_id: str
    device_type: DeviceType
    device_name: str | None = None
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
    current_state: DeviceState | None = None
    attributes: DeviceAttributes | None = None
    last_updated: datetime | None = None
    is_online: bool | None = None


class LocationDevicesResponse(BaseModel):
    location_id: str
    devices: list[DeviceDataResponse]
    last_updated: str


class ControlDeviceResponse(BaseModel):
    success: bool
    entity_id: str
    action: DeviceAction
    new_state: DeviceState | None = None
    error: str | None = None


class DeviceControlHistoryResponse(BaseModel):
    id: str
    user_id: str
    home_assistant_entity_id: str
    action_type: str
    previous_state: str | None = None
    new_state: str | None = None
    triggered_by: str
    success: bool
    error_message: str | None = None
    created_at: datetime


# WebSocket Message Schemas
class WebSocketMessage(BaseModel):
    type: str
    data: dict[str, Any]
    timestamp: str


class DeviceStateUpdateMessage(BaseModel):
    type: str = Field("device_state_update", const=True)
    data: dict[str, Any]
    timestamp: str


class DeviceControlResponseMessage(BaseModel):
    type: str = Field("device_control_response", const=True)
    data: dict[str, Any]
    timestamp: str


class ConnectionStatusMessage(BaseModel):
    type: str = Field("connection_status", const=True)
    data: dict[str, Any]
    timestamp: str


# Utility Schemas
class DeviceFilter(BaseModel):
    device_type: DeviceType | None = None
    state: DeviceState | None = None
    location_id: str | None = None
    is_online: bool | None = None


class DeviceHealthResponse(BaseModel):
    service_running: bool
    websocket_connected: bool
    home_assistant_connected: bool
    active_connections: int
    timestamp: str


class DeviceStatesResponse(BaseModel):
    states: dict[str, str | None]
    timestamp: str


class EmergencyControlResponse(BaseModel):
    success: bool
    affected_devices: int | None = None
    successful_stops: int | None = None
    failed_stops: int | None = None
    results: list[ControlDeviceResponse] | None = None
    error: str | None = None
