from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.sensor_device import SensorDeviceResponse


# Shared properties
class ShelfBase(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=50)
    rack_id: UUID | None = None  # Made optional in base, required in Create
    position_in_rack: int | None = Field(None, gt=0)
    width: float | None = Field(None, gt=0)
    depth: float | None = Field(None, gt=0)
    max_weight: float | None = Field(None, gt=0)


# Properties to receive on item creation
class ShelfCreate(ShelfBase):
    name: str = Field(..., min_length=2, max_length=50)
    rack_id: UUID  # rack_id is required for creation
    position_in_rack: int = Field(..., gt=0)
    width: float = Field(..., gt=0)
    depth: float = Field(..., gt=0)
    # max_weight is optional, inherits from ShelfBase


# Properties to receive on item update
class ShelfUpdate(BaseModel):  # All fields optional for update
    name: str | None = Field(None, min_length=2, max_length=50)
    # rack_id: Optional[UUID] = None # Typically rack_id is not updatable for a shelf
    position_in_rack: int | None = Field(None, gt=0)
    width: float | None = Field(None, gt=0)
    depth: float | None = Field(None, gt=0)
    max_weight: float | None = Field(None, gt=0)


# Properties shared by models stored in DB
class ShelfInDBBase(ShelfBase):
    id: UUID
    name: str  # Should be non-optional in DB
    rack_id: UUID  # Should be non-optional in DB
    position_in_rack: int
    width: float
    depth: float
    # max_weight remains optional as in ShelfBase

    model_config = ConfigDict(from_attributes=True)  # Use ConfigDict


# Properties to return to client
class ShelfResponse(ShelfInDBBase):
    devices: list[SensorDeviceResponse] | None = Field(default_factory=list)


# Properties stored in DB
class ShelfInDB(ShelfInDBBase):
    pass
