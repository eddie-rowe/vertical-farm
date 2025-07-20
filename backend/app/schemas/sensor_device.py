from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ParentType, SensorType


class SensorDeviceBase(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=50)
    model_number: str | None = None
    sensor_type: Literal["temperature", "humidity", "co2", "ph", "ec", "water_level", "light_intensity", "air_flow", "soil_moisture"] | None = None
    measurement_unit: str | None = None
    data_range_min: float | None = None
    data_range_max: float | None = None
    accuracy: str | None = None
    parent_type: Literal["shelf", "rack", "row", "farm"] | None = None
    parent_id: UUID | None = None
    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None

    @model_validator(mode="after")
    def check_data_range(cls, values):
        min_val, max_val = values.data_range_min, values.data_range_max
        if min_val is not None and max_val is not None and max_val < min_val:
            raise ValueError(
                "Max data range must be greater than or equal to min data range"
            )
        return values


class SensorDeviceCreate(SensorDeviceBase):
    name: str = Field(..., min_length=2, max_length=50)
    sensor_type: Literal[
        "temperature",
        "humidity",
        "co2",
        "ph",
        "ec",
        "water_level",
        "light_intensity",
        "air_flow",
        "soil_moisture",
    ]
    parent_type: Literal["shelf", "rack", "row", "farm"]
    parent_id: UUID
    # Other fields are optional or have defaults based on SensorDeviceBase


class SensorDeviceUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=50)
    model_number: str | None = None
    sensor_type: Literal["temperature", "humidity", "co2", "ph", "ec", "water_level", "light_intensity", "air_flow", "soil_moisture"] | None = None
    measurement_unit: str | None = None
    data_range_min: float | None = None
    data_range_max: float | None = None
    accuracy: str | None = None
    # parent_type and parent_id are generally not updatable for an existing sensor
    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None

    @model_validator(mode="after")
    def check_data_range_update(cls, values):
        # This validation needs to be present in Update as well if these fields are updatable
        # Pydantic v2 style: access fields directly from `values` (which is the model instance here)
        min_val = values.data_range_min
        max_val = values.data_range_max
        if min_val is not None and max_val is not None and max_val < min_val:
            raise ValueError(
                "Max data range must be greater than or equal to min data range"
            )
        return values


class SensorDeviceInDBBase(SensorDeviceBase):
    id: UUID
    name: str  # Required in DB
    sensor_type: SensorType  # Required in DB
    parent_type: ParentType  # Required in DB
    parent_id: UUID  # Required in DB

    model_config = ConfigDict(from_attributes=True)  # Use ConfigDict


class SensorDeviceResponse(SensorDeviceInDBBase):
    pass


class SensorDeviceInDB(SensorDeviceInDBBase):
    pass
