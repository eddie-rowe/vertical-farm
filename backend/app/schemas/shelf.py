from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

# Shared properties
class ShelfBase(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    rack_id: Optional[UUID] = None # Made optional in base, required in Create
    position_in_rack: Optional[int] = Field(None, gt=0)
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)
    max_weight: Optional[float] = Field(None, gt=0)

# Properties to receive on item creation
class ShelfCreate(ShelfBase):
    name: str = Field(..., min_length=2, max_length=50)
    rack_id: UUID # rack_id is required for creation
    position_in_rack: int = Field(..., gt=0)
    width: float = Field(..., gt=0)
    depth: float = Field(..., gt=0)
    # max_weight is optional, inherits from ShelfBase

# Properties to receive on item update
class ShelfUpdate(BaseModel): # All fields optional for update
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    # rack_id: Optional[UUID] = None # Typically rack_id is not updatable for a shelf
    position_in_rack: Optional[int] = Field(None, gt=0)
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)
    max_weight: Optional[float] = Field(None, gt=0)

# Properties shared by models stored in DB
class ShelfInDBBase(ShelfBase):
    id: UUID
    name: str # Should be non-optional in DB
    rack_id: UUID # Should be non-optional in DB
    position_in_rack: int
    width: float
    depth: float
    # max_weight remains optional as in ShelfBase

    model_config = ConfigDict(from_attributes=True) # Use ConfigDict

# Properties to return to client
class ShelfResponse(ShelfInDBBase):
    pass

# Properties stored in DB
class ShelfInDB(ShelfInDBBase):
    pass 