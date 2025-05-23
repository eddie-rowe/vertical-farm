from typing import List, Any, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.core.security import get_current_active_user
from app.schemas.rack import RackCreate, RackUpdate, RackResponse
from app.crud import rack as crud_rack_instance, row as crud_row_instance, can_user_perform_action
from app.db.supabase_client import get_async_supabase_client
from app.models.enums import PermissionLevel

router = APIRouter()

@router.post("/", response_model=RackResponse, status_code=status.HTTP_201_CREATED)
async def create_rack_endpoint(
    rack_in: RackCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Create a new rack for a row."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    parent_row_dict = await crud_row_instance.get(db=db, id=rack_in.row_id)
    if not parent_row_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent row not found")
    
    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_create = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions for the parent farm")
    
    created_rack_dict = await crud_rack_instance.create_with_row(db=db, obj_in=rack_in, row_id=rack_in.row_id)
    return RackResponse(**created_rack_dict)

@router.get("/{rack_id}", response_model=RackResponse)
async def read_rack_endpoint(
    rack_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Get a specific rack by ID."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    rack_dict = await crud_rack_instance.get(db=db, id=rack_id)
    if not rack_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found")
    
    parent_row_dict = await crud_row_instance.get(db=db, id=UUID(rack_dict.get("row_id")))
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this rack")
    return RackResponse(**rack_dict)

@router.get("/row/{row_id}", response_model=List[RackResponse])
async def read_racks_for_row_endpoint(
    row_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Get all racks for a specific row."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    parent_row_dict = await crud_row_instance.get(db=db, id=row_id)
    if not parent_row_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent row not found")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view racks for this row")
    
    racks_list = await crud_rack_instance.get_multi_by_row(db=db, row_id=row_id, skip=skip, limit=limit)
    return [RackResponse(**r) for r in racks_list]

@router.put("/{rack_id}", response_model=RackResponse)
async def update_rack_endpoint(
    rack_id: UUID,
    rack_in: RackUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Update a rack."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_rack_dict = await crud_rack_instance.get(db=db, id=rack_id)
    if not existing_rack_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found")

    parent_row_dict = await crud_row_instance.get(db=db, id=UUID(existing_rack_dict.get("row_id")))
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_update = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this rack")
    
    updated_rack_dict = await crud_rack_instance.update(db=db, id=rack_id, obj_in=rack_in)
    if not updated_rack_dict:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found after update attempt or update failed")
    return RackResponse(**updated_rack_dict)

@router.delete("/{rack_id}", response_model=RackResponse)
async def delete_rack_endpoint(
    rack_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Delete a rack."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_rack_dict = await crud_rack_instance.get(db=db, id=rack_id)
    if not existing_rack_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found")
    
    parent_row_dict = await crud_row_instance.get(db=db, id=UUID(existing_rack_dict.get("row_id")))
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_delete = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this rack")
    
    deleted_rack_dict = await crud_rack_instance.remove(db=db, id=rack_id)
    if not deleted_rack_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found for deletion or delete failed")
    return RackResponse(**deleted_rack_dict) 