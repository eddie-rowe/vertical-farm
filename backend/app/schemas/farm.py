from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime # For created_at, updated_at

# Base Pydantic model for common farm attributes
class FarmBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

# Schema for creating a new farm
class FarmCreate(FarmBase):
    name: str # Name is required for creation

# Schema for updating an existing farm (all fields optional)
class FarmUpdate(FarmBase):
    pass

# Schema representing a farm as stored in the database, including IDs and timestamps
class FarmInDBBase(FarmBase):
    id: uuid.UUID
    owner_id: uuid.UUID # The user ID of the owner/creator
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Replaces orm_mode in Pydantic v2

# Schema for representing a farm in API responses (public-facing)
class FarmResponse(FarmInDBBase):
    pass # Inherits all fields from FarmInDBBase, can be customized if needed

# Schema for a list of farms in API responses, including pagination info
class FarmListResponse(BaseModel):
    farms: List[FarmResponse]
    total: int 