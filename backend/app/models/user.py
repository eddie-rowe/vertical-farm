from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional
from datetime import datetime
from .enums import UserRole # Assuming enums.py is in the same directory

class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: UUID4 # Changed from int to UUID4 to match Supabase auth.users.id
    role: Optional[UserRole] = None # From user_profiles table
    # Supabase specific fields that might come with auth.users
    aud: Optional[str] = None
    created_at: Optional[datetime] = None 
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str # This would not typically be exposed directly 