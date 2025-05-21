from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List

from app.crud import crud_user, crud_user_permission
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.security import get_current_active_user
from app.models.user import User as UserModel
from app.db.supabase_client import get_async_supabase_client
from supabase import AsyncClient, create_async_client
import uuid

router = APIRouter()

@router.post("/", response_model=User, status_code=201)
async def create_user(
    *, 
    db: AsyncClient = Depends(get_async_supabase_client),
    user_in: UserCreate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    if not crud_user_permission.is_user_platform_admin(current_user):
        raise HTTPException(
            status_code=403, detail="Only platform administrators can create users."
        )

    user = await crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    new_user = await crud_user.create_user(db, user_in=user_in)
    return new_user

@router.get("/me", response_model=User)
async def read_users_me(current_user: UserModel = Depends(get_current_active_user)) -> Any:
    return current_user

@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: uuid.UUID,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncClient = Depends(get_async_supabase_client)
) -> Any:
    if current_user.id == user_id:
        return current_user

    if not crud_user_permission.is_user_platform_admin(current_user):
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges to view other user details."
        )
    
    user = await crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 