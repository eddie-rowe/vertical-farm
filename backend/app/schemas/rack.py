from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.shelf import ShelfResponse


# Shared properties
class RackBase(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    row_id: Optional[UUID] = None  # Made optional in base, required in Create
    position_in_row: Optional[int] = Field(None, gt=0)
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    max_shelves: Optional[int] = Field(None, gt=0)


# Properties to receive on item creation
class RackCreate(RackBase):
    name: str = Field(..., min_length=2, max_length=50)
    row_id: UUID  # row_id is required for creation
    position_in_row: int = Field(..., gt=0)
    width: float = Field(..., gt=0)
    depth: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    # max_shelves is optional, inherits from RackBase


# Properties to receive on item update
class RackUpdate(BaseModel):  # All fields optional for update
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    # row_id: Optional[UUID] = None # Typically row_id is not updatable for a rack
    position_in_row: Optional[int] = Field(None, gt=0)
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    max_shelves: Optional[int] = Field(None, gt=0)


# Properties shared by models stored in DB
class RackInDBBase(RackBase):
    id: UUID
    name: str  # Ensure name is non-optional
    row_id: UUID  # Ensure row_id is non-optional
    position_in_row: int
    width: float
    depth: float
    height: float
    # max_shelves remains optional as in RackBase

    model_config = ConfigDict(from_attributes=True)  # Use ConfigDict


# Properties to return to client
class RackResponse(RackInDBBase):
    shelves: Optional[List[ShelfResponse]] = Field(default_factory=list)


# Properties stored in DB
class RackInDB(RackInDBBase):
    pass
