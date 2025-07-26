from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FanBase(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=50)
    model_number: str | None = None
    type: Literal["circulation", "exhaust", "intake"] | None = None
    size_cm: float | None = Field(None, gt=0)
    airflow_cfm: float | None = Field(None, gt=0)
    power_watts: float | None = Field(None, gt=0)
    parent_type: Literal["rack", "row"] | None = None
    parent_id: UUID | None = None
    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None
    orientation: Literal["up", "down", "front", "back", "left", "right"] | None = (
        None
    )


class FanCreate(FanBase):
    name: str = Field(..., min_length=2, max_length=50)
    parent_type: Literal["rack", "row"]
    parent_id: UUID
    # Other fields are optional or have defaults based on FanBase


class FanUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=50)
    model_number: str | None = None
    type: Literal["circulation", "exhaust", "intake"] | None = None
    size_cm: float | None = Field(None, gt=0)
    airflow_cfm: float | None = Field(None, gt=0)
    power_watts: float | None = Field(None, gt=0)
    # parent_type and parent_id are generally not updatable for an existing fan
    position_x: float | None = None
    position_y: float | None = None
    position_z: float | None = None
    orientation: Literal["up", "down", "front", "back", "left", "right"] | None = (
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
