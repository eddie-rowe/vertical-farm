import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import UserRole  # Assuming UserRole is in models.enums


class UserBase(BaseModel):
    email: EmailStr | None = None
    is_active: bool | None = True
    is_superuser: bool = False
    full_name: str | None = None
    role: UserRole | None = UserRole.OPERATOR  # Default role


class UserCreate(UserBase):
    email: EmailStr
    password: str
    role: UserRole = UserRole.OPERATOR


class UserUpdate(UserBase):
    password: str | None = None


class UserInDBBase(UserBase):
    id: uuid.UUID
    # Add any other fields that are in the DB but not always in API responses
    hashed_password: str | None = None  # Only for internal use

    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    # Fields to return to the client
    pass


class UserInDB(UserInDBBase):
    # Potentially all fields, including hashed_password for internal use
    pass
