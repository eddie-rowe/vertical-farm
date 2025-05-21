from typing import List, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
# from supabase_py_async import AsyncClient # Old import
from supabase import AsyncClient, create_async_client # Ensure this is imported

from app.core.security import get_current_active_user # Updated import
from app.models.user import User
from app.schemas.rack import Rack, RackCreate, RackUpdate
from app.crud import crud_rack, crud_row, crud_user_permission, crud_farm # Added necessary CRUD imports
from app.db.supabase_client import get_async_supabase_client # Corrected imports for supabase client and dependencies
from app.models.enums import PermissionLevel # For permission checks

router = APIRouter()

@router.post("/", response_model=Rack, status_code=status.HTTP_201_CREATED)
async def create_rack_endpoint(
    rack_in: RackCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create a new rack for a row."""
    parent_row = await crud_row.get_row(db=db, row_id=rack_in.row_id)
    if not parent_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent row not found")
    
    # Check permission on the farm of the parent row
    can_create = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions for the parent farm")
    return await crud_rack.create_rack(db=db, obj_in=rack_in)

@router.get("/{rack_id}", response_model=Rack)
async def read_rack_endpoint(
    rack_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get a specific rack by ID."""
    rack = await crud_rack.get_rack(db=db, id=rack_id)
    if not rack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found")
    
    parent_row = await crud_row.get_row(db=db, row_id=rack.row_id)
    if not parent_row: # Should not happen if rack exists and DB is consistent
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    can_view = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this rack")
    return rack

@router.get("/row/{row_id}", response_model=List[Rack])
async def read_racks_for_row_endpoint(
    row_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get all racks for a specific row."""
    parent_row = await crud_row.get_row(db=db, row_id=row_id)
    if not parent_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent row not found")

    can_view = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view racks for this row")
    racks = await crud_rack.get_racks_by_row(db=db, row_id=row_id, skip=skip, limit=limit)
    return racks

@router.put("/{rack_id}", response_model=Rack)
async def update_rack_endpoint(
    rack_id: UUID,
    rack_in: RackUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update a rack."""
    rack = await crud_rack.get_rack(db=db, id=rack_id)
    if not rack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found")

    parent_row = await crud_row.get_row(db=db, row_id=rack.row_id)
    if not parent_row: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    can_update = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this rack")
    
    updated_rack = await crud_rack.update_rack(db=db, id=rack_id, obj_in=rack_in)
    if not updated_rack:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found after update attempt")
    return updated_rack

@router.delete("/{rack_id}", response_model=Rack)
async def delete_rack_endpoint(
    rack_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Delete a rack."""
    rack = await crud_rack.get_rack(db=db, id=rack_id)
    if not rack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found")
    
    parent_row = await crud_row.get_row(db=db, row_id=rack.row_id)
    if not parent_row: # Should not happen
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Parent row not found for existing rack")

    can_delete = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=parent_row.farm_id, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this rack")
    
    deleted_rack = await crud_rack.delete_rack(db=db, id=rack_id)
    if not deleted_rack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rack not found for deletion attempt")
    return deleted_rack 