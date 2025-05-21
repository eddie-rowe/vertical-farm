from typing import List, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
# from supabase_py_async import AsyncClient # Old import
from supabase import AsyncClient, create_async_client # Ensure this is imported

from app.db.supabase_client import get_async_supabase_client
from app.core.security import get_current_active_user # Updated import
from app.models.user import User
from app.schemas.shelf import Shelf, ShelfCreate, ShelfUpdate
from app.crud import crud_shelf, crud_rack, crud_row, crud_user_permission # Added necessary CRUD imports
from app.models.enums import PermissionLevel # For permission checks

router = APIRouter()

@router.post("/", response_model=Shelf, status_code=status.HTTP_201_CREATED)
async def create_shelf_endpoint(
    shelf_in: ShelfCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create a new shelf for a rack."""
    parent_rack = await crud_rack.get_rack(db=db, id=shelf_in.rack_id)
    if not parent_rack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent rack not found")
    
    parent_row = await crud_row.get_row(db=db, row_id=parent_rack.row_id)
    if not parent_row: # Should not happen if rack exists and DB is consistent
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    can_create = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions for the parent farm")
    return await crud_shelf.create_shelf(db=db, obj_in=shelf_in)

@router.get("/{shelf_id}", response_model=Shelf)
async def read_shelf_endpoint(
    shelf_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get a specific shelf by ID."""
    shelf = await crud_shelf.get_shelf(db=db, id=shelf_id)
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")

    parent_rack = await crud_rack.get_rack(db=db, id=shelf.rack_id)
    if not parent_rack: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent rack not found")
    
    parent_row = await crud_row.get_row(db=db, row_id=parent_rack.row_id)
    if not parent_row: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    can_view = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this shelf")
    return shelf

@router.get("/rack/{rack_id}", response_model=List[Shelf])
async def read_shelves_for_rack_endpoint(
    rack_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get all shelves for a specific rack."""
    parent_rack = await crud_rack.get_rack(db=db, id=rack_id)
    if not parent_rack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent rack not found")
    
    parent_row = await crud_row.get_row(db=db, row_id=parent_rack.row_id)
    if not parent_row: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    can_view = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view shelves for this rack")
    shelves = await crud_shelf.get_shelves_by_rack(db=db, rack_id=rack_id, skip=skip, limit=limit)
    return shelves

@router.put("/{shelf_id}", response_model=Shelf)
async def update_shelf_endpoint(
    shelf_id: UUID,
    shelf_in: ShelfUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update a shelf."""
    shelf = await crud_shelf.get_shelf(db=db, id=shelf_id)
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")

    parent_rack = await crud_rack.get_rack(db=db, id=shelf.rack_id)
    if not parent_rack: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent rack not found")

    parent_row = await crud_row.get_row(db=db, row_id=parent_rack.row_id)
    if not parent_row: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    can_update = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this shelf")
    
    updated_shelf = await crud_shelf.update_shelf(db=db, id=shelf_id, obj_in=shelf_in)
    if not updated_shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found after update attempt")
    return updated_shelf

@router.delete("/{shelf_id}", response_model=Shelf)
async def delete_shelf_endpoint(
    shelf_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Delete a shelf."""
    shelf = await crud_shelf.get_shelf(db=db, id=shelf_id)
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")

    parent_rack = await crud_rack.get_rack(db=db, id=shelf.rack_id)
    if not parent_rack: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent rack not found")

    parent_row = await crud_row.get_row(db=db, row_id=parent_rack.row_id)
    if not parent_row: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found")

    can_delete = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this shelf")
    
    deleted_shelf = await crud_shelf.delete_shelf(db=db, id=shelf_id)
    if not deleted_shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found for deletion attempt")
    return deleted_shelf 