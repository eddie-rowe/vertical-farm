from typing import Optional, Literal, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.enums import ParentType, SensorType

class SensorDeviceBase(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    model_number: Optional[str] = None
    sensor_type: Optional[Literal[
        'temperature',
        'humidity',
        'co2',
        'ph',
        'ec',
        'water_level',
        'light_intensity',
        'air_flow',
        'soil_moisture'
    ]] = None
    measurement_unit: Optional[str] = None
    data_range_min: Optional[float] = None
    data_range_max: Optional[float] = None
    accuracy: Optional[str] = None
    parent_type: Optional[Literal['shelf', 'rack', 'row', 'farm']] = None
    parent_id: Optional[UUID] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None

    @model_validator(mode='after')
    def check_data_range(cls, values):
        min_val, max_val = values.data_range_min, values.data_range_max
        if min_val is not None and max_val is not None and max_val < min_val:
            raise ValueError('Max data range must be greater than or equal to min data range')
        return values

class SensorDeviceCreate(SensorDeviceBase):
    name: str = Field(..., min_length=2, max_length=50)
    sensor_type: Literal[
        'temperature',
        'humidity',
        'co2',
        'ph',
        'ec',
        'water_level',
        'light_intensity',
        'air_flow',
        'soil_moisture'
    ]
    parent_type: Literal['shelf', 'rack', 'row', 'farm']
    parent_id: UUID
    # Other fields are optional or have defaults based on SensorDeviceBase

class SensorDeviceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    model_number: Optional[str] = None
    sensor_type: Optional[Literal[
        'temperature',
        'humidity',
        'co2',
        'ph',
        'ec',
        'water_level',
        'light_intensity',
        'air_flow',
        'soil_moisture'
    ]] = None
    measurement_unit: Optional[str] = None
    data_range_min: Optional[float] = None
    data_range_max: Optional[float] = None
    accuracy: Optional[str] = None
    # parent_type and parent_id are generally not updatable for an existing sensor
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None

    @model_validator(mode='after')
    def check_data_range_update(cls, values):
        # This validation needs to be present in Update as well if these fields are updatable
        # Pydantic v2 style: access fields directly from `values` (which is the model instance here)
        min_val = values.data_range_min
        max_val = values.data_range_max
        if min_val is not None and max_val is not None and max_val < min_val:
            raise ValueError('Max data range must be greater than or equal to min data range')
        return values

class SensorDeviceInDBBase(SensorDeviceBase):
    id: UUID
    name: str # Required in DB
    sensor_type: SensorType # Required in DB
    parent_type: ParentType # Required in DB
    parent_id: UUID # Required in DB

    model_config = ConfigDict(from_attributes=True) # Use ConfigDict

class SensorDeviceResponse(SensorDeviceInDBBase):
    pass

class SensorDeviceInDB(SensorDeviceInDBBase):
    pass 