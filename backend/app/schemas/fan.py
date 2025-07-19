from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FanBase(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    model_number: Optional[str] = None
    type: Optional[Literal["circulation", "exhaust", "intake"]] = None
    size_cm: Optional[float] = Field(None, gt=0)
    airflow_cfm: Optional[float] = Field(None, gt=0)
    power_watts: Optional[float] = Field(None, gt=0)
    parent_type: Optional[Literal["rack", "row"]] = None
    parent_id: Optional[UUID] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None
    orientation: Optional[Literal["up", "down", "front", "back", "left", "right"]] = (
        None
    )


class FanCreate(FanBase):
    name: str = Field(..., min_length=2, max_length=50)
    parent_type: Literal["rack", "row"]
    parent_id: UUID
    # Other fields are optional or have defaults based on FanBase


class FanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    model_number: Optional[str] = None
    type: Optional[Literal["circulation", "exhaust", "intake"]] = None
    size_cm: Optional[float] = Field(None, gt=0)
    airflow_cfm: Optional[float] = Field(None, gt=0)
    power_watts: Optional[float] = Field(None, gt=0)
    # parent_type and parent_id are generally not updatable for an existing fan
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    position_z: Optional[float] = None
    orientation: Optional[Literal["up", "down", "front", "back", "left", "right"]] = (
        None
    )


class FanInDBBase(FanBase):
    id: UUID
    name: str  # Should be non-optional in DB
    parent_type: Literal["rack", "row"]  # Should be non-optional in DB
    parent_id: UUID  # Should be non-optional in DB

    model_config = ConfigDict(from_attributes=True)


class FanResponse(FanInDBBase):
    pass


class FanInDB(FanInDBBase):
    pass
