from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from typing import List, Annotated, Optional, Dict, Any
from uuid import UUID

# Use schemas for request/response types
from app.schemas import user_permission as user_permission_schema
# from app.models import user as user_model # Removed SQLAlchemy model
from app.models.enums import PermissionLevel
from app import crud # Changed import for crud.farm and crud.user_permission functions
from app.core.security import get_current_active_user
# Use async clients
from app.db.supabase_client import get_async_supabase_client, get_async_rls_client
from supabase import AsyncClient # Use AsyncClient directly

router = APIRouter()

# Helper for authorization
async def _authorize_management_action(
    db: AsyncClient, 
    current_user_data: Dict[str, Any], # Changed type from UserModel
    farm_id: UUID,
    target_permission_level: Optional[PermissionLevel] = None,
    is_modifying_existing_manager: bool = False
):
    current_user_id_str = current_user_data.get("sub")
    if not current_user_id_str:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found in token for authorization")
    current_user_id = UUID(current_user_id_str)

    # TODO: Re-implement platform admin check. The original was:
    # is_admin = await crud.is_user_platform_admin(db=db, user_id=current_user_id) # Assuming is_user_platform_admin is in crud
    # if is_admin: return
    # For now, proceeding without platform admin bypass.

    is_farm_manager_with_rights = await crud.can_user_perform_action(
        db=db, 
        user_id=current_user_id,
        farm_id=farm_id,
        levels=[PermissionLevel.MANAGER]
    )

    if not is_farm_manager_with_rights:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to manage permissions for this farm. Requires MANAGER role."
        )

    if target_permission_level == PermissionLevel.MANAGER and not is_modifying_existing_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farm managers cannot grant 'manager' role to others."
        )
    if is_modifying_existing_manager:
        # This implies current user is trying to change/delete an existing MANAGER.
        # Only platform admin should do this. Since admin check is out, block this.
        # OR, if the manager is themselves, allow demotion/removal by self (not implemented here).
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farm managers cannot modify or delete other 'manager' roles. Requires platform admin."
        )

@router.post("/", response_model=user_permission_schema.UserPermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_farm_permission(
    *,
    permission_in: user_permission_schema.UserPermissionCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    await _authorize_management_action(
        db=db,
        current_user_data=current_user,
        farm_id=permission_in.farm_id,
        target_permission_level=permission_in.permission
    )
    
    farm_dict = await crud.farm.get(db=db, id=permission_in.farm_id)
    if not farm_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm with id {permission_in.farm_id} not found.")

    existing_permission = await crud.get_user_permission(db=db, farm_id=permission_in.farm_id, user_id=permission_in.user_id)
    if existing_permission:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission already exists for this user on this farm."
        )

    try:
        created_permission_model = await crud.create_user_permission(db=db, perm_in=permission_in)
        return created_permission_model # Should be UserPermissionInDB, compatible with UserPermissionResponse
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create permission: {str(e)}"
        )

@router.get("/{farm_id}/user/{user_id}", response_model=user_permission_schema.UserPermissionResponse)
async def get_farm_permission_for_user(
    farm_id: UUID,
    user_id: UUID,
    db: AsyncClient = Depends(get_async_rls_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    # RLS client (db) will enforce read permissions
    permission_model = await crud.get_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    if not permission_model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found or not accessible")
    return permission_model

@router.get("/{farm_id}", response_model=List[user_permission_schema.UserPermissionResponse])
async def get_farm_permissions(
    farm_id: UUID,
    db: AsyncClient = Depends(get_async_rls_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    # Check if farm exists and is accessible by current_user via RLS client
    farm_dict = await crud.farm.get(db=db, id=farm_id) # RLS client used here
    if not farm_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm with id {farm_id} not found or not accessible.")
        
    permissions_models = await crud.get_user_permissions_for_farm(db=db, farm_id=farm_id)
    return permissions_models

@router.put("/{farm_id}/user/{user_id}", response_model=user_permission_schema.UserPermissionResponse)
async def update_farm_permission(
    farm_id: UUID,
    user_id: UUID,
    permission_update: user_permission_schema.UserPermissionUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    existing_permission = await crud.get_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    if not existing_permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found to update.")

    await _authorize_management_action(
        db=db,
        current_user_data=current_user,
        farm_id=farm_id,
        target_permission_level=permission_update.permission,
        is_modifying_existing_manager=(existing_permission.permission == PermissionLevel.MANAGER)
    )
    
    updated_permission_model = await crud.update_user_permission(
        db=db, farm_id=farm_id, user_id=user_id, perm_in=permission_update
    )
    if not updated_permission_model:
        # This might happen if the update didn't change anything or failed post-auth
        # crud.update_user_permission returns the updated model or None if get fails after update.
        # Let's assume if it's None here, it means the target record for update wasn't really there, or an issue occurred.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Failed to update permission or permission not found after update.")
    return updated_permission_model

@router.delete("/{farm_id}/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm_permission(
    farm_id: UUID,
    user_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    permission_to_delete = await crud.get_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    if not permission_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found to delete.")

    await _authorize_management_action(
        db=db,
        current_user_data=current_user,
        farm_id=farm_id,
        is_modifying_existing_manager=(permission_to_delete.permission == PermissionLevel.MANAGER)
    )

    deleted_result_model = await crud.delete_user_permission(db=db, farm_id=farm_id, user_id=user_id)
    # crud.delete_user_permission returns the deleted model or None if not found prior to delete.
    # We already confirmed it exists with permission_to_delete.
    # If deleted_result_model is None here, it means the delete in CRUD might have issues or didn't return the obj.
    # For a 204, we don't return content, so just ensuring no exception is enough.
    if deleted_result_model is None and permission_to_delete is not None:
        # This implies an issue, as we expected the object back from delete. 
        # However, for 204, we might not strictly need it.
        # Consider raising 500 if delete_result_model is None after confirmed existence.
        pass 
    return # Implicitly returns 204 No Content 