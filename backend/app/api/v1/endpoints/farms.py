from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any, Dict
from uuid import UUID
from supabase import AsyncClient

# Use schemas for request/response types and models for DB representations
from app import crud
from app.schemas import farm as farm_schema
from app.db.supabase_client import get_async_supabase_client, get_async_rls_client
from app.core.security import get_current_active_user
from app.models.enums import PermissionLevel
from app.schemas.user_permission import UserPermissionCreate

router = APIRouter()

@router.post("/", response_model=farm_schema.FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    *, 
    farm_in: farm_schema.FarmCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    user_id_str = current_user.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found in token")
    user_id = UUID(user_id_str)
    
    created_farm_dict = await crud.farm.create_with_owner(db=db, obj_in=farm_in, owner_id=user_id)
    if not created_farm_dict:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create farm")

    permission_in = UserPermissionCreate(
        farm_id=UUID(created_farm_dict["id"]),
        user_id=user_id,
        permission=PermissionLevel.MANAGER
    )
    await crud.create_user_permission(db=db, perm_in=permission_in)
    
    return farm_schema.FarmResponse(**created_farm_dict)

@router.get("/", response_model=farm_schema.FarmListResponse)
async def read_farms(
    skip: int = 0, 
    limit: int = 100,
    db: AsyncClient = Depends(get_async_rls_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    farms_list, total_count = await crud.farm.get_multi_with_total(db=db, skip=skip, limit=limit)
    return {"farms": [farm_schema.FarmResponse(**f) for f in farms_list], "total": total_count}

@router.get("/{farm_id}", response_model=farm_schema.FarmResponse)
async def read_farm(
    *, 
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_rls_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    farm_dict = await crud.farm.get(db=db, id=farm_id)
    if not farm_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or not accessible")
    return farm_schema.FarmResponse(**farm_dict)

@router.put("/{farm_id}", response_model=farm_schema.FarmResponse)
async def update_farm(
    *, 
    farm_id: UUID, 
    farm_in: farm_schema.FarmUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    user_id_str = current_user.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found in token")
    user_id = UUID(user_id_str)

    can_update = await crud.get_user_permission(
        db=db, farm_id=farm_id, user_id=user_id
    )
    existing_farm = await crud.farm.get(db=db, id=farm_id)
    if not existing_farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    
    if not can_update and UUID(existing_farm.get("owner_id")) != user_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this farm")

    updated_farm_dict = await crud.farm.update(db=db, id=farm_id, obj_in=farm_in)
    if not updated_farm_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or update failed")
    return farm_schema.FarmResponse(**updated_farm_dict)

@router.delete("/{farm_id}", response_model=farm_schema.FarmResponse)
async def delete_farm(
    *, 
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    user_id_str = current_user.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found in token")
    user_id = UUID(user_id_str)

    existing_farm = await crud.farm.get(db=db, id=farm_id)
    if not existing_farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    
    if UUID(existing_farm.get("owner_id")) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the farm owner can delete the farm")

    deleted_farm_dict = await crud.farm.remove(db=db, id=farm_id)
    if not deleted_farm_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or could not be deleted")
    return farm_schema.FarmResponse(**deleted_farm_dict)

# TODO: Add endpoints for managing farm_user_permissions
# e.g., /farms/{farm_id}/permissions
