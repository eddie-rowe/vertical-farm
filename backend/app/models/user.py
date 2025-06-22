"""
User model for the vertical farm application.

This module provides the User model that represents authenticated users
in the system with their roles and permissions.
"""

import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from .enums import UserRole


class User(BaseModel):
    """
    User model representing an authenticated user in the system.
    
    This model is used for dependency injection in API endpoints
    and represents the current authenticated user.
    """
    
    id: uuid.UUID
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    role: UserRole = UserRole.OPERATOR
    
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True
    )
    
    def __str__(self) -> str:
        return f"User(id={self.id}, email={self.email}, role={self.role})"
    
    def __repr__(self) -> str:
        return self.__str__()
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        return self.role == UserRole.ADMIN or self.is_superuser
    
    @property
    def is_manager(self) -> bool:
        """Check if user has manager role or higher."""
        return self.role in [UserRole.ADMIN, UserRole.MANAGER] or self.is_superuser
    
    @property
    def can_manage_devices(self) -> bool:
        """Check if user can manage devices."""
        return self.is_manager
    
    @property
    def can_view_all_data(self) -> bool:
        """Check if user can view all system data."""
        return self.is_manager


# For backward compatibility and convenience
UserModel = User 