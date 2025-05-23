from typing import List, Any, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.db.supabase_client import get_async_supabase_client
from app.core.security import get_current_active_user
from app.schemas.shelf import ShelfCreate, ShelfUpdate, ShelfResponse
from app.crud import shelf as crud_shelf_instance, rack as crud_rack_instance, row as crud_row_instance, can_user_perform_action
from app.models.enums import PermissionLevel

router = APIRouter()

@router.post("/", response_model=ShelfResponse, status_code=status.HTTP_201_CREATED)
async def create_shelf_endpoint(
    shelf_in: ShelfCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Create a new shelf for a rack."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    parent_rack_dict = await crud_rack_instance.get(db=db, id=shelf_in.rack_id)
    if not parent_rack_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent rack not found")
    
    parent_row_id = UUID(parent_rack_dict.get("row_id"))
    parent_row_dict = await crud_row_instance.get(db=db, id=parent_row_id)
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_create = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions for the parent farm")
    
    created_shelf_dict = await crud_shelf_instance.create_with_rack(db=db, obj_in=shelf_in, rack_id=shelf_in.rack_id)
    return ShelfResponse(**created_shelf_dict)

@router.get("/{shelf_id}", response_model=ShelfResponse)
async def read_shelf_endpoint(
    shelf_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Get a specific shelf by ID."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    shelf_dict = await crud_shelf_instance.get(db=db, id=shelf_id)
    if not shelf_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")

    parent_rack_id = UUID(shelf_dict.get("rack_id"))
    parent_rack_dict = await crud_rack_instance.get(db=db, id=parent_rack_id)
    if not parent_rack_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent rack not found")
    
    parent_row_id = UUID(parent_rack_dict.get("row_id"))
    parent_row_dict = await crud_row_instance.get(db=db, id=parent_row_id)
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this shelf")
    return ShelfResponse(**shelf_dict)

@router.get("/rack/{rack_id}", response_model=List[ShelfResponse])
async def read_shelves_for_rack_endpoint(
    rack_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Get all shelves for a specific rack."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    parent_rack_dict = await crud_rack_instance.get(db=db, id=rack_id)
    if not parent_rack_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent rack not found")
    
    parent_row_id = UUID(parent_rack_dict.get("row_id"))
    parent_row_dict = await crud_row_instance.get(db=db, id=parent_row_id)
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view shelves for this rack")
    
    shelves_list = await crud_shelf_instance.get_multi_by_rack(db=db, rack_id=rack_id, skip=skip, limit=limit)
    return [ShelfResponse(**s) for s in shelves_list]

@router.put("/{shelf_id}", response_model=ShelfResponse)
async def update_shelf_endpoint(
    shelf_id: UUID,
    shelf_in: ShelfUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Update a shelf."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_shelf_dict = await crud_shelf_instance.get(db=db, id=shelf_id)
    if not existing_shelf_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")

    parent_rack_id = UUID(existing_shelf_dict.get("rack_id"))
    parent_rack_dict = await crud_rack_instance.get(db=db, id=parent_rack_id)
    if not parent_rack_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent rack not found")

    parent_row_id = UUID(parent_rack_dict.get("row_id"))
    parent_row_dict = await crud_row_instance.get(db=db, id=parent_row_id)
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_update = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this shelf")
    
    updated_shelf_dict = await crud_shelf_instance.update(db=db, id=shelf_id, obj_in=shelf_in)
    if not updated_shelf_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found after update attempt or update failed")
    return ShelfResponse(**updated_shelf_dict)

@router.delete("/{shelf_id}", response_model=ShelfResponse)
async def delete_shelf_endpoint(
    shelf_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    """Delete a shelf."""
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_shelf_dict = await crud_shelf_instance.get(db=db, id=shelf_id)
    if not existing_shelf_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")

    parent_rack_id = UUID(existing_shelf_dict.get("rack_id"))
    parent_rack_dict = await crud_rack_instance.get(db=db, id=parent_rack_id)
    if not parent_rack_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent rack not found")

    parent_row_id = UUID(parent_rack_dict.get("row_id"))
    parent_row_dict = await crud_row_instance.get(db=db, id=parent_row_id)
    if not parent_row_dict: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    farm_id_of_parent_row = UUID(parent_row_dict.get("farm_id"))
    can_delete = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id_of_parent_row, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this shelf")
    
    deleted_shelf_dict = await crud_shelf_instance.remove(db=db, id=shelf_id)
    if not deleted_shelf_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found for deletion or delete failed")
    return ShelfResponse(**deleted_shelf_dict) 