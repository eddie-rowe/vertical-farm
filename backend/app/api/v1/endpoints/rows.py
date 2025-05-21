from typing import List, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
# from supabase_py_async import AsyncClient # Old import, will be replaced by direct supabase import if needed for type hint
from supabase import AsyncClient, create_async_client # Ensure this is imported

from app.core.security import get_current_active_user # Updated import
from app.models.user import User
from app.schemas.row import Row, RowCreate, RowUpdate
from app.crud import crud_row, crud_user_permission, crud_farm # Added crud_user_permission and crud_farm
from app.db.supabase_client import get_async_supabase_client # Corrected import
from app.models.enums import PermissionLevel # For permission checks

router = APIRouter()

@router.post("/", response_model=Row, status_code=status.HTTP_201_CREATED)
async def create_row_endpoint(
    *, # Enforce keyword-only arguments
    row_in: RowCreate,
    db: AsyncClient = Depends(get_async_supabase_client), # Corrected dependency
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create a new row for a farm current_user has access to."""
    farm = await crud_farm.get_farm(db=db, farm_id=row_in.farm_id, requesting_user_id=current_user.id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found or not accessible to user")

    can_create = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=row_in.farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to create a row for this farm")
    return await crud_row.create_row(db=db, row=row_in, owner_id=current_user.id)

@router.get("/{row_id}", response_model=Row)
async def read_row_endpoint(
    row_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client), # Corrected dependency
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get a specific row by ID."""
    row = await crud_row.get_row(db=db, row_id=row_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")
    
    can_view = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=row.farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this row")
    return row

@router.get("/farm/{farm_id}", response_model=List[Row])
async def read_rows_for_farm_endpoint(
    farm_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client), # Corrected dependency
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get all rows for a specific farm."""
    can_view = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view rows for this farm")
    rows = await crud_row.get_rows_by_farm(db=db, farm_id=farm_id, skip=skip, limit=limit)
    return rows

@router.put("/{row_id}", response_model=Row)
async def update_row_endpoint(
    row_id: UUID,
    row_in: RowUpdate,
    db: AsyncClient = Depends(get_async_supabase_client), # Corrected dependency
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update a row."""
    row = await crud_row.get_row(db=db, row_id=row_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")

    can_update = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=row.farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this row")
    
    updated_row = await crud_row.update_row(db=db, row_id=row_id, row_in=row_in)
    if not updated_row: # Should not happen if get_row passed and update logic is sound
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found after update attempt")
    return updated_row

@router.delete("/{row_id}", response_model=Row)
async def delete_row_endpoint(
    row_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client), # Corrected dependency
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Delete a row."""
    row = await crud_row.get_row(db=db, row_id=row_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found")

    can_delete = await crud_user_permission.can_user_perform_action(
        db=db, user_id=current_user.id, farm_id=row.farm_id, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this row")

    deleted_row = await crud_row.delete_row(db=db, row_id=row_id)
    if not deleted_row: # Should not happen if get_row passed and delete logic is sound
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Row not found for deletion attempt")
    return deleted_row 