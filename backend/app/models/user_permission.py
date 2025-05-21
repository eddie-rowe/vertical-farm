from pydantic import BaseModel
from typing import Optional # Optional not used here but good practice to keep if model evolves
import uuid
from datetime import datetime
from app.models.enums import PermissionLevel

# This model represents the structure of the 'user_permissions' table in the database.
class UserPermissionInDB(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    farm_id: uuid.UUID
    permission: PermissionLevel # Stored as string/enum value in DB, Pydantic handles conversion
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True # Ensures that when serializing, enum values (e.g., "VIEWER") are used, not the enum members themselves.
                               # When deserializing, Pydantic will convert valid strings back to enum members.
