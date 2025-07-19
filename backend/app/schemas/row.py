from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.rack import RackResponse


# Shared properties
class RowBase(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    farm_id: Optional[UUID] = None  # Made optional in base, required in Create
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    length: Optional[float] = Field(None, gt=0)
    orientation: Optional[Literal["horizontal", "vertical"]] = None


# Properties to receive on item creation
class RowCreate(RowBase):
    name: str = Field(..., min_length=2, max_length=50)
    farm_id: UUID  # farm_id is required for creation
    position_x: float
    position_y: float
    length: float = Field(..., gt=0)
    orientation: Literal["horizontal", "vertical"]


# Properties to receive on item update
class RowUpdate(BaseModel):  # All fields optional for update
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    # farm_id: Optional[UUID] = None # Typically farm_id is not updatable for a row
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    length: Optional[float] = Field(None, gt=0)
    orientation: Optional[Literal["horizontal", "vertical"]] = None


# Properties shared by models stored in DB
class RowInDBBase(RowBase):
    id: UUID
    farm_id: UUID  # Ensure farm_id is non-optional here as it's a DB requirement
    name: str  # Name should also be non-optional in DB
    position_x: float
    position_y: float
    length: float
    orientation: Literal["horizontal", "vertical"]

    model_config = ConfigDict(from_attributes=True)


# Properties to return to client
class RowResponse(RowInDBBase):
    racks: Optional[List[RackResponse]] = Field(default_factory=list)


# Properties stored in DB (can be same as RowInDBBase or extend it)
class RowInDB(RowInDBBase):
    pass
