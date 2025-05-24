from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any, Dict
from uuid import UUID
from supabase import AsyncClient

# Use schemas for request/response types and models for DB representations
from app import crud
from app.schemas import farm as farm_schema
from app.db.supabase_client import get_async_supabase_client, get_async_rls_client
from app.core.security import get_current_active_user
# TODO: Re-enable when permissions are implemented
# from app.models.enums import PermissionLevel
# from app.schemas.user_permission import UserPermissionCreate

router = APIRouter()

@router.post("/", response_model=farm_schema.FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    *, 
    farm_in: farm_schema.FarmCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user = Depends(get_current_active_user)
):
    user_id = current_user.id
    if not user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    
    created_farm_dict = await crud.farm.create_with_owner(supabase=db, obj_in=farm_in, owner_id=user_id)
    if not created_farm_dict:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create farm")

    # TODO: Add permissions system when farm_user_permissions table is created
    # permission_in = UserPermissionCreate(
    #     farm_id=UUID(created_farm_dict["id"]),
    #     user_id=user_id,
    #     permission=PermissionLevel.MANAGER
    # )
    # await crud.create_user_permission(db=db, perm_in=permission_in)
    
    return farm_schema.FarmResponse(**created_farm_dict)

@router.get("/", response_model=farm_schema.FarmBasicListResponse)
async def read_farms(
    skip: int = 0, 
    limit: int = 100,
    db: AsyncClient = Depends(get_async_rls_client),
    current_user = Depends(get_current_active_user)
):
    farms_list, total_count = await crud.farm.get_multi_with_total(supabase=db, skip=skip, limit=limit)
    basic_farms_info = [farm_schema.FarmBasicInfo(id=f['id'], name=f['name']) for f in farms_list]
    return {"farms": basic_farms_info, "total": total_count}

@router.get("/{farm_id}", response_model=farm_schema.FarmResponse)
async def read_farm(
    *, 
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_rls_client),
    current_user = Depends(get_current_active_user)
):
    farm_response = await crud.farm.get(supabase=db, id=farm_id)
    if not farm_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or not accessible")
    return farm_response

@router.put("/{farm_id}", response_model=farm_schema.FarmResponse)
async def update_farm(
    *, 
    farm_id: UUID, 
    farm_in: farm_schema.FarmUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user = Depends(get_current_active_user)
):
    user_id = current_user.id
    if not user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")

    # TODO: Re-enable when farm_user_permissions table is created
    # can_update = await crud.get_user_permission(
    #     db=db, farm_id=farm_id, user_id=user_id
    # )
    can_update = None  # Temporarily disable permission checks
    existing_farm = await crud.farm.get(supabase=db, id=farm_id)
    if not existing_farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    
    if not can_update and existing_farm.manager_id != user_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this farm")

    updated_farm_response = await crud.farm.update(supabase=db, id=farm_id, obj_in=farm_in)
    if not updated_farm_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or update failed")
    return updated_farm_response

@router.delete("/{farm_id}", response_model=farm_schema.FarmResponse)
async def delete_farm(
    *, 
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user = Depends(get_current_active_user)
):
    user_id = current_user.id
    if not user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")

    existing_farm = await crud.farm.get(supabase=db, id=farm_id)
    if not existing_farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    
    if existing_farm.manager_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the farm manager can delete the farm")

    deleted_farm_response = await crud.farm.remove(supabase=db, id=farm_id)
    if not deleted_farm_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or could not be deleted")
    return deleted_farm_response

# TODO: Add endpoints for managing farm_user_permissions
# e.g., /farms/{farm_id}/permissions
