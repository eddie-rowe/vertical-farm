from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from supabase import AClient  # Changed

from app.core.config import settings
from app.crud import crud_user
from app.db.supabase_client import get_async_supabase_client  # Changed
from app.models.user import User
from app.schemas.token import TokenPayload
from app.services.database_service import DatabaseService
from app.services.device_monitoring_service import DeviceMonitoringService

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token"
)  # Assuming a more standard token URL


# Helper function to get raw token payload, moved up
async def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(sub=payload.get("sub"))
        if token_data.sub is None:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception
    return token_data


async def get_current_user(
    # This function is not currently used by other main dependencies in this file.
    # It can be implemented if a dependency needs a User object directly from a token
    # without the active/superuser checks.
    token_payload: TokenPayload = Depends(get_current_user_payload),
    db: AClient = Depends(get_async_supabase_client),
) -> Optional[User]:
    """Fetches a user based on token payload. Does not check for active status."""
    # raise NotImplementedError("get_current_user dependency is a placeholder and not fully implemented.")
    # Basic implementation:
    if not token_payload.sub:
        return None
    user = await crud_user.get_user(db, user_id=token_payload.sub)
    return user


async def get_current_active_user(
    current_user_payload: TokenPayload = Depends(get_current_user_payload),
    db: AClient = Depends(get_async_supabase_client),
) -> User:  # Changed to non-optional as it raises if not found/active
    user = await crud_user.get_user(db, user_id=current_user_payload.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not crud_user.is_superuser(current_user):
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


# Service Dependencies
async def get_database_service() -> DatabaseService:
    """Get database service instance"""
    return DatabaseService()


async def get_device_monitoring_service(
    db_service: DatabaseService = Depends(get_database_service),
) -> DeviceMonitoringService:
    """Get device monitoring service instance"""
    return DeviceMonitoringService(db_service)
