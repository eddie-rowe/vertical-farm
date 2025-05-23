from typing import List, Any, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.core.security import get_current_active_user
from app.schemas.row import RowCreate, RowUpdate, RowResponse
from app.crud import row as crud_row_instance, can_user_perform_action, farm as crud_farm_instance
from app.db.supabase_client import get_async_supabase_client, get_async_rls_client
from app.models.enums import PermissionLevel

router = APIRouter()

@router.post("/", response_model=RowResponse, status_code=status.HTTP_201_CREATED)
async def create_row_endpoint(
    *,
    row_in: RowCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    # Check farm existence (using service client for this check before permission)
    farm_dict = await crud_farm_instance.get(db=db, id=row_in.farm_id)
    if not farm_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    can_create = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=row_in.farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to create a row for this farm")
    
    created_row_dict = await crud_row_instance.create_with_farm(db=db, obj_in=row_in, farm_id=row_in.farm_id)
    return RowResponse(**created_row_dict)

@router.get("/{row_id}", response_model=RowResponse)
async def read_row_endpoint(
    row_id: UUID,
    # Using service client and manual permission check for now. RLS could be an option later.
    db: AsyncClient = Depends(get_async_supabase_client), 
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    row_dict = await crud_row_instance.get(db=db, id=row_id)
    if not row_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")
    
    # Row dict contains farm_id, which is needed for permission check
    farm_id_of_row = UUID(row_dict.get("farm_id"))
    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_row, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this row")
    return RowResponse(**row_dict)

@router.get("/farm/{farm_id}", response_model=List[RowResponse])
async def read_rows_for_farm_endpoint(
    farm_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    # Check farm existence and view permission for the farm itself first
    farm_dict = await crud_farm_instance.get(db=db, id=farm_id) # Check if farm exists
    if not farm_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    can_view_farm = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view_farm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view rows for this farm")
    
    rows_list = await crud_row_instance.get_multi_by_farm(db=db, farm_id=farm_id, skip=skip, limit=limit)
    return [RowResponse(**r) for r in rows_list]

@router.put("/{row_id}", response_model=RowResponse)
async def update_row_endpoint(
    row_id: UUID,
    row_in: RowUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_row_dict = await crud_row_instance.get(db=db, id=row_id)
    if not existing_row_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")

    farm_id_of_row = UUID(existing_row_dict.get("farm_id"))
    can_update = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_row, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this row")
    
    updated_row_dict = await crud_row_instance.update(db=db, id=row_id, obj_in=row_in)
    if not updated_row_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found after update attempt or update failed")
    return RowResponse(**updated_row_dict)

@router.delete("/{row_id}", response_model=RowResponse) # Supabase delete returns the deleted item(s)
async def delete_row_endpoint(
    row_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_row_dict = await crud_row_instance.get(db=db, id=row_id)
    if not existing_row_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")

    farm_id_of_row = UUID(existing_row_dict.get("farm_id"))
    can_delete = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_row, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this row")

    deleted_row_dict = await crud_row_instance.remove(db=db, id=row_id)
    if not deleted_row_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found for deletion or delete failed")
    return RowResponse(**deleted_row_dict) 