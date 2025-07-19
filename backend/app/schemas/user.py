from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
import uuid
from app.models.enums import UserRole  # Assuming UserRole is in models.enums


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.OPERATOR  # Default role


class UserCreate(UserBase):
    email: EmailStr
    password: str
    role: UserRole = UserRole.OPERATOR


class UserUpdate(UserBase):
    password: Optional[str] = None


class UserInDBBase(UserBase):
    id: uuid.UUID
    # Add any other fields that are in the DB but not always in API responses
    hashed_password: Optional[str] = None  # Only for internal use

    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    # Fields to return to the client
    pass


class UserInDB(UserInDBBase):
    # Potentially all fields, including hashed_password for internal use
    pass
