from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any
from uuid import UUID
from supabase import AsyncClient, create_async_client

# Use schemas for request/response types and models for DB representations
from app import crud
from app.schemas import farm as farm_schema # Changed
from app.models import farm as farm_model # Added
from app.models import user as user_model # For current_user type hint
from app.db.supabase_client import get_async_supabase_client, get_async_rls_client # Changed to async & added RLS client
from app.core.security import get_current_active_user # Changed to the JWKS based one
from app.models.enums import PermissionLevel
from app.schemas.user_permission import UserPermissionCreate # Use schema for creation

router = APIRouter()

@router.post("/", response_model=farm_schema.FarmResponse, status_code=status.HTTP_201_CREATED) # Use schema
async def create_farm(
    *, 
    farm_in: farm_schema.FarmCreate, # Use schema
    db: AsyncClient = Depends(get_async_supabase_client), # Use async client
    current_user: user_model.User = Depends(get_current_active_user) # Use JWKS one, typed correctly
):
    user_id = current_user.id
    
    created_farm_model = await crud.crud_farm.create_farm(db=db, farm_in=farm_in, manager_id=user_id)
    if not created_farm_model:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create farm")

    permission_in = UserPermissionCreate(
        farm_id=created_farm_model.id,
        user_id=user_id,
        permission=PermissionLevel.MANAGER
    )
    await crud.crud_user_permission.create_user_permission(db=db, perm_in=permission_in)
    
    return created_farm_model # FastAPI will convert model to response_model schema

@router.get("/", response_model=farm_schema.FarmListResponse) # Use schema
async def read_farms(
    skip: int = 0, 
    limit: int = 100,
    db: AsyncClient = Depends(get_async_rls_client), # Use RLS client
    current_user: user_model.User = Depends(get_current_active_user) # Required for RLS client to get token
):
    # Permission checks are now handled by RLS via the get_async_rls_client
    # The current_user dependency ensures the token is available for the RLS client
    farms_models, total_count = await crud.crud_farm.get_farms_and_total(db=db, skip=skip, limit=limit) # user_id removed
    return {"farms": farms_models, "total": total_count}

@router.get("/{farm_id}", response_model=farm_schema.FarmResponse) # Use schema
async def read_farm(
    *, 
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_rls_client), # Use RLS client
    current_user: user_model.User = Depends(get_current_active_user) # Required for RLS client to get token
):
    # Permission checks are now handled by RLS via the get_async_rls_client
    farm_model_instance = await crud.crud_farm.get_farm(db=db, farm_id=farm_id) # requesting_user_id removed
    if not farm_model_instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or not accessible")
    return farm_model_instance

@router.put("/{farm_id}", response_model=farm_schema.FarmResponse) # Use schema
async def update_farm(
    *, 
    farm_id: UUID, 
    farm_in: farm_schema.FarmUpdate, # Use schema
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: user_model.User = Depends(get_current_active_user)
):
    user_id = current_user.id
    # Permission check directly in endpoint or in CRUD
    can_update = await crud.crud_user_permission.can_user_perform_action(
        db=db, farm_id=farm_id, user_id=user_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this farm")

    farm_db_model = await crud.crud_farm.get_farm(db=db, farm_id=farm_id) # Fetch by id only, uses service client from Depends
    if not farm_db_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    
    updated_farm_model = await crud.crud_farm.update_farm(db=db, farm_id=farm_id, farm_in=farm_in) # Pass farm_id
    return updated_farm_model

@router.delete("/{farm_id}", response_model=farm_schema.FarmResponse) # Use schema
async def delete_farm(
    *, 
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: user_model.User = Depends(get_current_active_user)
):
    user_id = current_user.id
    can_delete = await crud.crud_user_permission.can_user_perform_action(
        db=db, farm_id=farm_id, user_id=user_id, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this farm")

    deleted_farm_model = await crud.crud_farm.delete_farm(db=db, farm_id=farm_id)
    if not deleted_farm_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or could not be deleted")
    return deleted_farm_model

# TODO: Add endpoints for managing farm_user_permissions
# e.g., /farms/{farm_id}/permissions
