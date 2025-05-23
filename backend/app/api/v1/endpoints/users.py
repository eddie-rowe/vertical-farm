from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List, Dict
import uuid

from app import crud
from app.schemas.user import User, UserCreate, UserUpdate
from app.core.security import get_current_active_user
from app.db.supabase_client import get_async_supabase_client
from supabase import AsyncClient

router = APIRouter()

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    *, 
    db: AsyncClient = Depends(get_async_supabase_client),
    user_in: UserCreate,
) -> Any:
    existing_user_dict = await crud.user.get_by_email(db=db, email=user_in.email)
    if existing_user_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    new_user_dict = await crud.user.create(db=db, obj_in=user_in)
    return User(**new_user_dict)

@router.get("/me", response_model=User)
async def read_users_me(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Any:
    return User(**current_user)

@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncClient = Depends(get_async_supabase_client)
) -> Any:
    current_user_id_str = current_user.get("sub")
    if not current_user_id_str:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found in token")

    if str(user_id) == current_user_id_str:
        user_dict = await crud.user.get(db=db, id=uuid.UUID(current_user_id_str))
        if not user_dict:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Current user not found in DB")
        return User(**user_dict)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this user's details."
    ) 