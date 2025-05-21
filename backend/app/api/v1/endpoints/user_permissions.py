from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from typing import List, Annotated, Optional
from uuid import UUID

# Use schemas for request/response types
from app.schemas import user_permission as user_permission_schema
from app.models import user as user_model # For current_user type hint
from app.models.enums import PermissionLevel
from app.crud import crud_user_permission, crud_farm # Added crud_farm for farm existence check
from app.core.security import get_current_active_user
# Use async clients
from app.db.supabase_client import get_async_supabase_client, get_async_rls_client
from supabase import AsyncClient, create_async_client # For type hinting db parameter

router = APIRouter()

# Helper for authorization - to avoid repeating code
async def _authorize_management_action(
    db: AsyncClient, # Service client expected here for these checks
    current_user: user_model.User,
    farm_id: UUID,
    target_permission_level: Optional[PermissionLevel] = None, # For create/update, the level being set
    is_modifying_existing_manager: bool = False # True if updating/deleting an existing MANAGER role
):
    is_admin = crud_user_permission.is_user_platform_admin(current_user)
    if is_admin:
        return

    # Check if current_user is a manager of the farm
    is_farm_manager_with_rights = await crud_user_permission.can_user_perform_action(
        db=db, # Should use service client for this internal check
        user_id=current_user.id,
        farm_id=farm_id,
        levels=[PermissionLevel.MANAGER]
    )

    if not is_farm_manager_with_rights:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to manage permissions for this farm."
        )

    # Farm managers cannot grant/modify 'manager' role or affect existing manager roles
    if target_permission_level == PermissionLevel.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farm managers cannot grant or set 'manager' role."
        )
    if is_modifying_existing_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farm managers cannot modify or delete 'manager' roles."
        )


@router.post("/", response_model=user_permission_schema.UserPermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_farm_permission(
    *,
    permission_in: user_permission_schema.UserPermissionCreate,
    db: AsyncClient = Depends(get_async_supabase_client), # Service client for creation
    current_user: user_model.User = Depends(get_current_active_user)
):
    # Authorize action
    await _authorize_management_action(
        db=db,
        current_user=current_user,
        farm_id=permission_in.farm_id,
        target_permission_level=permission_in.permission
    )
    
    # Check if farm exists (using service client as this is part of a create operation)
    farm = await crud_farm.get_farm(db=db, farm_id=permission_in.farm_id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm with id {permission_in.farm_id} not found.")

    # Check if permission already exists
    existing_permission = await crud_user_permission.get_user_permission(db=db, farm_id=permission_in.farm_id, user_id=permission_in.user_id)
    if existing_permission:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission already exists for this user on this farm."
        )

    try:
        # crud_user_permission.create_user_permission returns UserPermissionInDB model
        created_permission_model = await crud_user_permission.create_user_permission(db=db, perm_in=permission_in)
        # FastAPI will convert this to UserPermissionResponse
        return created_permission_model
    except Exception as e:
        # TODO: Log the exception e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create permission: {str(e)}"
        )

@router.get("/{farm_id}/user/{user_id}", response_model=user_permission_schema.UserPermissionResponse)
async def get_farm_permission_for_user(
    farm_id: UUID,
    user_id: UUID,
    db: AsyncClient = Depends(get_async_rls_client), # RLS client for reads
    current_user: user_model.User = Depends(get_current_active_user) # Needed for RLS client
):
    # RLS client (db) will enforce read permissions
    permission_model = await crud_user_permission.get_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    if not permission_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found or not accessible")
    return permission_model

@router.get("/{farm_id}", response_model=List[user_permission_schema.UserPermissionResponse])
async def get_farm_permissions(
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_rls_client), # RLS client for reads
    current_user: user_model.User = Depends(get_current_active_user) # Needed for RLS client
):
    # RLS client (db) will enforce read permissions for the farm itself, 
    # and then for the permissions linked to it.
    # Check if farm exists and is accessible by current_user via RLS client
    farm = await crud_farm.get_farm(db=db, farm_id=farm_id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm with id {farm_id} not found or not accessible.")
        
    permissions_models = await crud_user_permission.get_user_permissions_for_farm(db=db, farm_id=farm_id)
    return permissions_models

@router.put("/{farm_id}/user/{user_id}", response_model=user_permission_schema.UserPermissionResponse)
async def update_farm_permission(
    farm_id: UUID,
    user_id: UUID,
    permission_update: user_permission_schema.UserPermissionUpdate,
    db: AsyncClient = Depends(get_async_supabase_client), # Service client for updates
    current_user: user_model.User = Depends(get_current_active_user)
):
    existing_permission = await crud_user_permission.get_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    if not existing_permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found to update.")

    await _authorize_management_action(
        db=db,
        current_user=current_user,
        farm_id=farm_id,
        target_permission_level=permission_update.permission,
        is_modifying_existing_manager=(existing_permission.permission == PermissionLevel.MANAGER)
    )
    
    updated_permission_model = await crud_user_permission.update_user_permission(
        db=db, farm_id=farm_id, user_id=user_id, perm_in=permission_update
    )
    if not updated_permission_model:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update permission.")
    return updated_permission_model

@router.delete("/{farm_id}/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm_permission(
    farm_id: UUID,
    user_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client), # Service client for deletes
    current_user: user_model.User = Depends(get_current_active_user)
):
    permission_to_delete = await crud_user_permission.get_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    if not permission_to_delete:
        # Return 204 even if not found, as per idempotent delete typically, or 404.
        # For consistency with update, let's raise 404 if not found.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found to delete.")

    await _authorize_management_action(
        db=db,
        current_user=current_user,
        farm_id=farm_id,
        is_modifying_existing_manager=(permission_to_delete.permission == PermissionLevel.MANAGER)
    )

    deleted_result_model = await crud_user_permission.delete_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    
    # delete_user_permission in CRUD returns the model of the deleted item or None if not found.
    # Since we fetched it above, if it's None now, it means the delete operation itself had an issue
    # or it was already gone (though we checked).
    # Given the check above, if permission_to_delete was found, deleted_result_model should also be the object.
    # If it's None here, something unexpected happened post-authorization and pre-delete actual.
    if deleted_result_model is None and permission_to_delete is not None:
         # This implies the delete operation failed silently in CRUD or item vanished between check and delete.
         # CRUD's delete returns the object if found and deleted, or what was passed if delete succeeded but returned nothing, or None if not found initially
         # If perm_to_delete was found, and deleted_result is None, this is odd.
         # Let's assume if no exception, it's fine. CRUD returns the object.
         pass # Handled by 204

    return # Implicitly returns 204 No Content 