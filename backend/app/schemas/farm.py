import uuid
from datetime import datetime  # For created_at, updated_at
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.row import RowResponse  # Added import


# Base Pydantic model for common farm attributes
class FarmBase(BaseModel):
    name: str | None = Field(None, min_length=3, max_length=50)
    location: str | None = Field(None, min_length=3, max_length=100)
    farm_image_url: str | None = Field(
        None, pattern=r"^https?://[\w\d.-]+\.[a-z]{2,}(?:/[^\s]*)?$"
    )  # Basic URL regex
    width: float | None = Field(None, gt=0)
    depth: float | None = Field(None, gt=0)


# Schema for creating a new farm
class FarmCreate(FarmBase):
    name: str = Field(..., min_length=3, max_length=50)  # Name is required for creation


# Schema for updating an existing farm (all fields optional)
class FarmUpdate(FarmBase):
    pass


# Schema representing a farm as stored in the database, including IDs and timestamps
class FarmInDBBase(FarmBase):
    id: uuid.UUID
    name: str  # Name should be non-optional when in DB
    manager_id: (
        uuid.UUID
    )  # The user ID of the manager/creator (matches database schema)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)  # Use ConfigDict


# Schema for representing a farm in API responses (public-facing)
class FarmResponse(FarmInDBBase):
    rows: list[RowResponse] | None = Field(default_factory=list)  # Added rows


# Schema for basic farm info, used in lists
class FarmBasicInfo(BaseModel):
    id: uuid.UUID
    name: str
    model_config = ConfigDict(from_attributes=True)


# Schema for a list of farms in API responses, including pagination info
class FarmListResponse(BaseModel):
    farms: list[FarmResponse]  # This remains for the full list if needed elsewhere
    total: int


# Schema for a list of basic farm info
class FarmBasicListResponse(BaseModel):
    farms: list[FarmBasicInfo]
    total: int
