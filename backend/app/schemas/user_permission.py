from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import uuid
from app.models.enums import PermissionLevel
from datetime import datetime


class UserPermissionBase(BaseModel):
    user_id: Optional[uuid.UUID] = None
    farm_id: Optional[uuid.UUID] = None
    permission: Optional[PermissionLevel] = None


class UserPermissionCreate(UserPermissionBase):
    user_id: uuid.UUID
    farm_id: uuid.UUID
    permission: PermissionLevel


class UserPermissionUpdate(BaseModel):
    permission: Optional[PermissionLevel] = None


class UserPermissionInDBBase(UserPermissionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    farm_id: uuid.UUID
    permission: PermissionLevel
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserPermissionResponse(UserPermissionInDBBase):
    # Potentially add related user/farm info here if needed for responses
    pass


class UserPermissionListResponse(BaseModel):
    permissions: List[UserPermissionResponse]
    total: int


# The UserPermission model (for DB representation) will be in app/models/user_permission.py
