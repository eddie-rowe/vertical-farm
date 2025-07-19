"""
Layer Two: Grow Automation Pydantic Schemas
Data validation and serialization schemas for grow automation API
"""

from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum


class ScheduleType(str, Enum):
    daily = "daily"
    weekly = "weekly"
    stage_based = "stage_based"
    custom = "custom"


class ConditionType(str, Enum):
    above = "above"
    below = "below"
    between = "between"
    equals = "equals"


class DeviceActionType(str, Enum):
    turn_on = "turn_on"
    turn_off = "turn_off"
    set_brightness = "set_brightness"
    set_temperature = "set_temperature"
    set_speed = "set_speed"
    set_value = "set_value"


class ExecutionStatus(str, Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    skipped = "skipped"


class AutomationType(str, Enum):
    rule = "rule"
    schedule = "schedule"
    condition = "condition"
    manual = "manual"


class DeviceType(str, Enum):
    light = "light"
    pump = "pump"
    fan = "fan"
    sensor = "sensor"
    actuator = "actuator"
    switch = "switch"


# Device Action Schema
class DeviceActionSchema(BaseModel):
    action_type: DeviceActionType
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    duration_seconds: Optional[int] = Field(None, ge=1, le=86400)  # Max 24 hours
    delay_seconds: Optional[int] = Field(None, ge=0, le=3600)  # Max 1 hour

    class Config:
        schema_extra = {
            "example": {
                "action_type": "turn_on",
                "parameters": {"brightness": 80},
                "duration_seconds": 30,
            }
        }


# Base Automation Schemas
class CreateAutomationScheduleRequest(BaseModel):
    device_assignment_id: str
    schedule_name: str = Field(..., min_length=1, max_length=100)
    schedule_type: ScheduleType
    device_action: DeviceActionSchema
    cron_expression: Optional[str] = Field(None, max_length=100)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True

    @field_validator("cron_expression")
    @classmethod
    def validate_cron_expression(cls, v, info: ValidationInfo):
        if info.data.get("schedule_type") == ScheduleType.custom and not v:
            raise ValueError("Cron expression is required for custom schedules")
        return v

    @field_validator("ends_at")
    @classmethod
    def validate_end_date(cls, v, info: ValidationInfo):
        if v and info.data.get("starts_at") and v <= info.data["starts_at"]:
            raise ValueError("End date must be after start date")
        return v

    class Config:
        schema_extra = {
            "example": {
                "device_assignment_id": "123e4567-e89b-12d3-a456-426614174000",
                "schedule_name": "Daily Light Schedule",
                "schedule_type": "daily",
                "device_action": {
                    "action_type": "turn_on",
                    "parameters": {"brightness": 80},
                },
                "cron_expression": "0 6 * * *",
                "is_active": True,
            }
        }


class UpdateAutomationScheduleRequest(BaseModel):
    schedule_name: Optional[str] = Field(None, min_length=1, max_length=100)
    schedule_type: Optional[ScheduleType] = None
    device_action: Optional[DeviceActionSchema] = None
    cron_expression: Optional[str] = Field(None, max_length=100)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class CreateAutomationConditionRequest(BaseModel):
    device_assignment_id: str
    condition_name: str = Field(..., min_length=1, max_length=100)
    sensor_entity_id: str = Field(..., min_length=1, max_length=255)
    condition_type: ConditionType
    threshold_value: Optional[float] = None
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    device_action: DeviceActionSchema
    cooldown_minutes: int = Field(0, ge=0, le=1440)  # Max 24 hours
    is_active: bool = True

    @field_validator("threshold_value")
    @classmethod
    def validate_threshold_value(cls, v, info: ValidationInfo):
        condition_type = info.data.get("condition_type")
        if (
            condition_type
            in [ConditionType.above, ConditionType.below, ConditionType.equals]
            and v is None
        ):
            raise ValueError(
                f"Threshold value is required for {condition_type} conditions"
            )
        return v

    @field_validator("threshold_min", "threshold_max")
    @classmethod
    def validate_threshold_range(cls, v, info: ValidationInfo):
        field_name = info.field_name
        if info.data.get("condition_type") == ConditionType.between:
            if field_name == "threshold_min" and v is None:
                raise ValueError("Minimum threshold is required for between conditions")
            if field_name == "threshold_max" and v is None:
                raise ValueError("Maximum threshold is required for between conditions")
        return v

    @field_validator("threshold_max")
    @classmethod
    def validate_max_greater_than_min(cls, v, info: ValidationInfo):
        threshold_min = info.data.get("threshold_min")
        if v is not None and threshold_min is not None and v <= threshold_min:
            raise ValueError("Maximum threshold must be greater than minimum threshold")
        return v

    class Config:
        schema_extra = {
            "example": {
                "device_assignment_id": "123e4567-e89b-12d3-a456-426614174000",
                "condition_name": "High Temperature Control",
                "sensor_entity_id": "sensor.temperature",
                "condition_type": "above",
                "threshold_value": 26.0,
                "device_action": {
                    "action_type": "turn_on",
                    "parameters": {"speed": "high"},
                },
                "cooldown_minutes": 15,
            }
        }


class UpdateAutomationConditionRequest(BaseModel):
    condition_name: Optional[str] = Field(None, min_length=1, max_length=100)
    sensor_entity_id: Optional[str] = Field(None, min_length=1, max_length=255)
    condition_type: Optional[ConditionType] = None
    threshold_value: Optional[float] = None
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    device_action: Optional[DeviceActionSchema] = None
    cooldown_minutes: Optional[int] = Field(None, ge=0, le=1440)
    is_active: Optional[bool] = None


class CreateAutomationRuleRequest(BaseModel):
    device_assignment_id: str
    rule_type: str = Field(..., min_length=1, max_length=50)
    rule_config: Dict[str, Any]
    priority: int = Field(0, ge=0, le=100)
    is_active: bool = True

    class Config:
        schema_extra = {
            "example": {
                "device_assignment_id": "123e4567-e89b-12d3-a456-426614174000",
                "rule_type": "event_trigger",
                "rule_config": {
                    "event": "plant_stage_changed",
                    "action": {
                        "action_type": "set_brightness",
                        "parameters": {"brightness": 60},
                    },
                },
                "priority": 10,
            }
        }


# Grow Automation Configuration for New Grow Setup
class GrowAutomationConfigRequest(BaseModel):
    enabled: bool = True
    use_device_profile: bool = False
    device_profile_id: Optional[str] = None
    custom_schedules: List[CreateAutomationScheduleRequest] = Field(
        default_factory=list
    )
    custom_conditions: List[CreateAutomationConditionRequest] = Field(
        default_factory=list
    )
    custom_rules: List[CreateAutomationRuleRequest] = Field(default_factory=list)

    @field_validator("device_profile_id")
    @classmethod
    def validate_device_profile(cls, v, info: ValidationInfo):
        if info.data.get("use_device_profile") and not v:
            raise ValueError(
                "Device profile ID is required when use_device_profile is True"
            )
        return v


# Response Schemas
class GrowAutomationRuleResponse(BaseModel):
    id: str
    grow_id: str
    device_assignment_id: str
    rule_type: str
    rule_config: Dict[str, Any]
    is_active: bool
    priority: int
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class GrowAutomationScheduleResponse(BaseModel):
    id: str
    grow_id: str
    device_assignment_id: str
    schedule_name: str
    schedule_type: ScheduleType
    cron_expression: Optional[str] = None
    device_action: Dict[str, Any]
    is_active: bool
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class GrowAutomationConditionResponse(BaseModel):
    id: str
    grow_id: str
    device_assignment_id: str
    condition_name: str
    sensor_entity_id: str
    condition_type: ConditionType
    threshold_value: Optional[float] = None
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    device_action: Dict[str, Any]
    cooldown_minutes: int
    is_active: bool
    last_triggered_at: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AutomationExecutionResponse(BaseModel):
    id: str
    grow_id: str
    automation_type: AutomationType
    automation_id: Optional[str] = None
    device_assignment_id: str
    action_taken: Dict[str, Any]
    execution_status: ExecutionStatus
    execution_result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    executed_at: datetime
    completed_at: Optional[datetime] = None


class GrowDeviceAssignmentResponse(BaseModel):
    assignment_id: str
    entity_id: str
    device_type: DeviceType
    location_id: str
    location_name: str


class AutomationStatusResponse(BaseModel):
    grow_id: str
    is_enabled: bool
    active_schedules: int
    active_conditions: int
    active_rules: int
    recent_executions: List[AutomationExecutionResponse]
    efficiency_score: float = Field(..., ge=0, le=100)
    monitoring_active: bool = False
    error: Optional[str] = None


class GrowAutomationResponse(BaseModel):
    rules: List[GrowAutomationRuleResponse]
    schedules: List[GrowAutomationScheduleResponse]
    conditions: List[GrowAutomationConditionResponse]
    executions: List[AutomationExecutionResponse]
    device_assignments: List[GrowDeviceAssignmentResponse]
    status: AutomationStatusResponse


# Device Profile Schemas
class GrowDeviceProfileResponse(BaseModel):
    id: str
    profile_name: str
    crop_id: Optional[str] = None
    grow_stage_id: Optional[str] = None
    device_type: DeviceType
    profile_config: Dict[str, Any]
    description: Optional[str] = None
    is_template: bool
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CreateDeviceProfileRequest(BaseModel):
    profile_name: str = Field(..., min_length=1, max_length=100)
    crop_id: Optional[str] = None
    grow_stage_id: Optional[str] = None
    device_type: DeviceType
    profile_config: Dict[str, Any]
    description: Optional[str] = Field(None, max_length=500)
    is_template: bool = False

    class Config:
        schema_extra = {
            "example": {
                "profile_name": "Lettuce Light Schedule",
                "device_type": "light",
                "profile_config": {
                    "schedule": "daily",
                    "on_time": "06:00",
                    "off_time": "22:00",
                    "intensity": 80,
                },
                "description": "Standard lighting schedule for lettuce cultivation",
            }
        }


# Manual Execution Schema
class ManualExecutionRequest(BaseModel):
    device_assignment_id: str
    action: DeviceActionSchema
    reason: Optional[str] = Field(None, max_length=200)

    class Config:
        schema_extra = {
            "example": {
                "device_assignment_id": "123e4567-e89b-12d3-a456-426614174000",
                "action": {
                    "action_type": "turn_on",
                    "parameters": {"brightness": 100},
                    "duration_seconds": 60,
                },
                "reason": "Testing device functionality",
            }
        }


# Bulk Operations
class BulkScheduleCreateRequest(BaseModel):
    schedules: List[CreateAutomationScheduleRequest] = Field(
        ..., min_items=1, max_items=50
    )


class BulkConditionCreateRequest(BaseModel):
    conditions: List[CreateAutomationConditionRequest] = Field(
        ..., min_items=1, max_items=50
    )


class BulkAutomationToggleRequest(BaseModel):
    grow_ids: List[str] = Field(..., min_items=1, max_items=100)
    enabled: bool


# Error Responses
class AutomationErrorResponse(BaseModel):
    error: str
    details: Optional[Dict[str, Any]] = None
    grow_id: Optional[str] = None
    automation_id: Optional[str] = None


# Validation Functions
def validate_cron_expression(cron_expr: str) -> bool:
    """Validate cron expression format

    Note: Simplified validation. For production, use Supabase's pg_cron
    which has its own validation, or implement a basic regex check.
    """
    try:
        # Basic validation - check if it has the right number of parts
        # Standard cron: minute hour day month weekday (5 parts)
        if not cron_expr or not isinstance(cron_expr, str):
            return False

        parts = cron_expr.strip().split()
        if len(parts) != 5:
            return False

        # Basic check that each part contains valid characters
        valid_chars = set("0123456789,-*/")
        for part in parts:
            if not all(c in valid_chars for c in part):
                return False

        return True
    except:
        return False


def validate_device_action(action: Dict[str, Any], device_type: str) -> List[str]:
    """Validate device action against device capabilities"""
    errors = []

    action_type = action.get("action_type")
    if not action_type:
        errors.append("Action type is required")
        return errors

    # Device-specific validation
    if device_type == "light":
        if action_type == "set_brightness":
            brightness = action.get("parameters", {}).get("brightness")
            if brightness is not None and (brightness < 0 or brightness > 100):
                errors.append("Brightness must be between 0 and 100")

    elif device_type == "fan":
        if action_type == "set_speed":
            speed = action.get("parameters", {}).get("speed")
            if speed and speed not in ["low", "medium", "high"]:
                errors.append("Fan speed must be 'low', 'medium', or 'high'")

    elif device_type == "pump":
        if action_type == "turn_on":
            duration = action.get("duration_seconds")
            if duration is not None and (duration < 1 or duration > 3600):
                errors.append("Pump duration must be between 1 second and 1 hour")

    return errors
