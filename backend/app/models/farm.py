from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

# This model represents the structure of the 'farms' table in the database.
# It's used by CRUD functions to map database rows to Pydantic objects.
class Farm(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    owner_id: uuid.UUID # User ID of the farm owner/manager
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Allows Pydantic to map from ORM objects or dicts with these fields
