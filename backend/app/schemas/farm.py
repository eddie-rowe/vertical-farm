from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime # For created_at, updated_at

# Base Pydantic model for common farm attributes
class FarmBase(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    location: Optional[str] = Field(None, min_length=3, max_length=100)
    plan_image_url: Optional[str] = Field(None, pattern=r"^https?://[\w\d.-]+\.[a-z]{2,}(?:/[^\s]*)?$") # Basic URL regex
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)

# Schema for creating a new farm
class FarmCreate(FarmBase):
    name: str = Field(..., min_length=3, max_length=50) # Name is required for creation

# Schema for updating an existing farm (all fields optional)
class FarmUpdate(FarmBase):
    pass

# Schema representing a farm as stored in the database, including IDs and timestamps
class FarmInDBBase(FarmBase):
    id: uuid.UUID
    name: str # Name should be non-optional when in DB
    owner_id: uuid.UUID # The user ID of the owner/creator
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True) # Use ConfigDict

# Schema for representing a farm in API responses (public-facing)
class FarmResponse(FarmInDBBase):
    pass # Inherits all fields from FarmInDBBase, can be customized if needed

# Schema for a list of farms in API responses, including pagination info
class FarmListResponse(BaseModel):
    farms: List[FarmResponse]
    total: int 