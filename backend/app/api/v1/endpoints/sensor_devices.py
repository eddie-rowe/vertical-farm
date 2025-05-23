from typing import List, Any, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.db.supabase_client import get_async_supabase_client
from app.core.security import get_current_active_user
from app.schemas.sensor_device import SensorDeviceCreate, SensorDeviceUpdate, SensorDeviceResponse
from app.crud import (
    sensor_device as crud_sensor_device_instance,
    rack as crud_rack_instance,
    row as crud_row_instance,
    farm as crud_farm_instance,
    can_user_perform_action
)
from app.models.enums import PermissionLevel, ParentType

router = APIRouter()

async def get_farm_id_for_sensor_parent(db: AsyncClient, parent_id: UUID, parent_type: ParentType) -> Optional[UUID]:
    """Helper to get the farm_id for a sensor device's parent (row or rack)."""
    if parent_type == ParentType.ROW:
        row = await crud_row_instance.get(db, id=parent_id)
        return UUID(row.get("farm_id")) if row else None
    elif parent_type == ParentType.RACK:
        rack = await crud_rack_instance.get(db, id=parent_id)
        if not rack: return None
        row = await crud_row_instance.get(db, id=UUID(rack.get("row_id")))
        return UUID(row.get("farm_id")) if row else None
    return None

@router.post("/", response_model=SensorDeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor_device_endpoint(
    sensor_device_in: SensorDeviceCreate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    farm_id = await get_farm_id_for_sensor_parent(db, sensor_device_in.parent_id, sensor_device_in.parent_type)
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{sensor_device_in.parent_type.value.capitalize()} parent not found or farm link broken")

    can_create = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_create:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions on the parent's farm")
    
    created_sensor_device_dict = await crud_sensor_device_instance.create_with_parent(
        db=db, obj_in=sensor_device_in, parent_id=sensor_device_in.parent_id, parent_type=sensor_device_in.parent_type
    )
    return SensorDeviceResponse(**created_sensor_device_dict)

@router.get("/{sensor_device_id}", response_model=SensorDeviceResponse)
async def read_sensor_device_endpoint(
    sensor_device_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    sensor_device_dict = await crud_sensor_device_instance.get(db=db, id=sensor_device_id)
    if not sensor_device_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device not found")

    farm_id = await get_farm_id_for_sensor_parent(db, UUID(sensor_device_dict.get("parent_id")), ParentType(sensor_device_dict.get("parent_type")))
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device's parent not found or farm link broken")

    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view this sensor device")
    return SensorDeviceResponse(**sensor_device_dict)

@router.get("/parent/{parent_id}", response_model=List[SensorDeviceResponse])
async def read_sensor_devices_for_parent_endpoint(
    parent_id: UUID,
    parent_type: ParentType,
    skip: int = 0,
    limit: int = 100,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    farm_id = await get_farm_id_for_sensor_parent(db, parent_id, parent_type)
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{parent_type.value.capitalize()} parent not found or farm link broken")

    can_view = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.VIEWER, PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_view:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to view sensor devices for this parent")
    
    sensor_devices_list = await crud_sensor_device_instance.get_multi_by_parent(
        db=db, parent_id=parent_id, parent_type=parent_type, skip=skip, limit=limit
    )
    return [SensorDeviceResponse(**sd) for sd in sensor_devices_list]

@router.put("/{sensor_device_id}", response_model=SensorDeviceResponse)
async def update_sensor_device_endpoint(
    sensor_device_id: UUID,
    sensor_device_in: SensorDeviceUpdate,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_sensor_device_dict = await crud_sensor_device_instance.get(db=db, id=sensor_device_id)
    if not existing_sensor_device_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device not found")

    farm_id = await get_farm_id_for_sensor_parent(db, UUID(existing_sensor_device_dict.get("parent_id")), ParentType(existing_sensor_device_dict.get("parent_type")))
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device's parent not found or farm link broken")

    can_update = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.EDITOR, PermissionLevel.MANAGER]
    )
    if not can_update:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this sensor device")
    
    updated_sensor_device_dict = await crud_sensor_device_instance.update(db=db, id=sensor_device_id, obj_in=sensor_device_in)
    if not updated_sensor_device_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device not found after update attempt or update failed")
    return SensorDeviceResponse(**updated_sensor_device_dict)

@router.delete("/{sensor_device_id}", response_model=SensorDeviceResponse)
async def delete_sensor_device_endpoint(
    sensor_device_id: UUID,
    db: AsyncClient = Depends(get_async_supabase_client),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Any:
    user_id_str = current_user.get("sub")
    if not user_id_str: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User ID not found")
    user_id = UUID(user_id_str)

    existing_sensor_device_dict = await crud_sensor_device_instance.get(db=db, id=sensor_device_id)
    if not existing_sensor_device_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device not found")

    farm_id = await get_farm_id_for_sensor_parent(db, UUID(existing_sensor_device_dict.get("parent_id")), ParentType(existing_sensor_device_dict.get("parent_type")))
    if not farm_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device's parent not found or farm link broken")

    can_delete = await can_user_perform_action(
        db=db, user_id=user_id, farm_id=farm_id, levels=[PermissionLevel.MANAGER]
    )
    if not can_delete:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this sensor device")

    deleted_sensor_device_dict = await crud_sensor_device_instance.remove(db=db, id=sensor_device_id)
    if not deleted_sensor_device_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor device not found for deletion or delete failed")
    return SensorDeviceResponse(**deleted_sensor_device_dict) 