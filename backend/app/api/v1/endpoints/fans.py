from typing import List, Any, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.db.supabase_client import get_async_supabase_client
from app.core.security import get_current_active_user
from app.schemas.fan import FanCreate, FanUpdate, FanResponse
from app.crud import (
    fan as crud_fan_instance,
    rack as crud_rack_instance,
    row as crud_row_instance,
    farm as crud_farm_instance,
    can_user_perform_action
)
from app.models.enums import PermissionLevel, ParentType

router = APIRouter()

async def get_farm_id_for_fan_parent(db: AsyncClient, parent_id: UUID, parent_type: ParentType) -> Optional[UUID]:
    """Helper to get the farm_id for a fan's parent (row or rack)."""
    if parent_type == ParentType.ROW:
        row = await crud_row_instance.get(db, id=parent_id)
        return UUID(row.get("farm_id")) if row else None
    elif parent_type == ParentType.RACK:
        rack = await crud_rack_instance.get(db, id=parent_id)
        if not rack: return None
        row = await crud_row_instance.get(db, id=UUID(rack.get("row_id")))
        return UUID(row.get("farm_id")) if row else None
    return None

@router.post("/", response_model=FanResponse, status_code=status.HTTP_201_CREATED)
async def create_fan_endpoint(
    fan_in: FanCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    farm_id = await get_farm_id_for_fan_parent(db, fan_in.parent_id, fan_in.parent_type)
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{fan_in.parent_type.value.capitalize()} parent not found or farm link broken")

    can_create = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions on the parent's farm")
    
    created_fan_dict = await crud_fan_instance.create_with_parent(
        db=db, obj_in=fan_in, parent_id=fan_in.parent_id, parent_type=fan_in.parent_type
    )
    return FanResponse(**created_fan_dict)

@router.get("/{fan_id}", response_model=FanResponse)
async def read_fan_endpoint(
    fan_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    fan_dict = await crud_fan_instance.get(db=db, id=fan_id)
    if not fan_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan not found")

    farm_id = await get_farm_id_for_fan_parent(db, UUID(fan_dict.get("parent_id")), ParentType(fan_dict.get("parent_type")))
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan's parent not found or farm link broken")

    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this fan")
    return FanResponse(**fan_dict)

@router.get("/parent/{parent_id}", response_model=List[FanResponse])
async def read_fans_for_parent_endpoint(
    parent_id: UUID,
    parent_type: ParentType,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    farm_id = await get_farm_id_for_fan_parent(db, parent_id, parent_type)
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{parent_type.value.capitalize()} parent not found or farm link broken")

    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view fans for this parent")
    
    fans_list = await crud_fan_instance.get_multi_by_parent(
        db=db, parent_id=parent_id, parent_type=parent_type, skip=skip, limit=limit
    )
    return [FanResponse(**f) for f in fans_list]

@router.put("/{fan_id}", response_model=FanResponse)
async def update_fan_endpoint(
    fan_id: UUID,
    fan_in: FanUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_fan_dict = await crud_fan_instance.get(db=db, id=fan_id)
    if not existing_fan_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan not found")

    farm_id = await get_farm_id_for_fan_parent(db, UUID(existing_fan_dict.get("parent_id")), ParentType(existing_fan_dict.get("parent_type")))
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan's parent not found or farm link broken")

    can_update = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this fan")
    
    updated_fan_dict = await crud_fan_instance.update(db=db, id=fan_id, obj_in=fan_in)
    if not updated_fan_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan not found after update attempt or update failed")
    return FanResponse(**updated_fan_dict)

@router.delete("/{fan_id}", response_model=FanResponse)
async def delete_fan_endpoint(
    fan_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_fan_dict = await crud_fan_instance.get(db=db, id=fan_id)
    if not existing_fan_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan not found")

    farm_id = await get_farm_id_for_fan_parent(db, UUID(existing_fan_dict.get("parent_id")), ParentType(existing_fan_dict.get("parent_type")))
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan's parent not found or farm link broken")

    can_delete = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this fan")

    deleted_fan_dict = await crud_fan_instance.remove(db=db, id=fan_id)
    if not deleted_fan_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fan not found for deletion or delete failed")
    return FanResponse(**deleted_fan_dict) 