from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from supabase import AClient as SupabaseClient
from httpx import HTTPStatusError

from app.schemas.sensor_device import SensorDeviceCreate, SensorDeviceUpdate # Pydantic schemas
from app.models.enums import ParentType, SensorType # For enum usage

# import logging
# logger = logging.getLogger(__name__)

class CRUDSensorDevice:
    table_name = "sensor_devices"

    async def get(self, supabase: SupabaseClient, id: UUID) -> Optional[Dict[str, Any]]:
        try:
            response = await supabase.table(self.table_name).select("*").eq("id", str(id)).single().execute()
            return response.data
        except HTTPStatusError as e:
            if e.response.status_code == 406:
                return None
            raise
        except Exception as e:
            raise

    async def get_multi_by_parent(
        self, supabase: SupabaseClient, *, parent_id: UUID, parent_type: ParentType, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("parent_id", str(parent_id))
                .eq("parent_type", parent_type.value)
                .order("name") # Example order
                .range(skip, skip + limit - 1)
                .execute()
            )
            return response.data
        except Exception as e:
            # logger.error(f"Error fetching sensor devices for parent {parent_id} ({parent_type.value}): {e}")
            raise

    async def get_multi_by_parent_with_total(
        self, supabase: SupabaseClient, *, parent_id: UUID, parent_type: ParentType, skip: int = 0, limit: int = 100
    ) -> Tuple[List[Dict[str, Any]], int]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*", count="exact")
                .eq("parent_id", str(parent_id))
                .eq("parent_type", parent_type.value)
                .order("name")
                .range(skip, skip + limit - 1)
                .execute()
            )
            sensor_devices = response.data
            total = response.count if response.count is not None else 0
            return sensor_devices, total
        except Exception as e:
            # logger.error(f"Error fetching sensor devices with total for parent {parent_id} ({parent_type.value}): {e}")
            raise

    async def create_with_parent(
        self, supabase: SupabaseClient, *, obj_in: SensorDeviceCreate, parent_id: UUID, parent_type: ParentType
    ) -> Dict[str, Any]:
        try:
            sensor_data = obj_in.model_dump()
            sensor_data["parent_id"] = str(parent_id)
            sensor_data["parent_type"] = parent_type.value
            if obj_in.sensor_type:
                sensor_data["sensor_type"] = obj_in.sensor_type.value
            
            response = await supabase.table(self.table_name).insert(sensor_data).execute()
            if not response.data:
                raise Exception("Failed to create sensor device: No data returned from Supabase")
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error creating sensor device for parent {parent_id} ({parent_type.value}): {e}")
            raise

    async def update(
        self, supabase: SupabaseClient, *, id: UUID, obj_in: SensorDeviceUpdate
    ) -> Optional[Dict[str, Any]]:
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            if not update_data:
                return await self.get(supabase, id)

            if "sensor_type" in update_data and update_data["sensor_type"]:
                update_data["sensor_type"] = update_data["sensor_type"].value
            if "parent_type" in update_data and update_data["parent_type"]:
                update_data["parent_type"] = update_data["parent_type"].value

            response = await supabase.table(self.table_name).update(update_data).eq("id", str(id)).execute()
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error updating sensor device {id}: {e}")
            raise

    async def remove(self, supabase: SupabaseClient, *, id: UUID) -> Optional[Dict[str, Any]]:
        try:
            response = await supabase.table(self.table_name).delete().eq("id", str(id)).execute()
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error deleting sensor device {id}: {e}")
            raise

sensor_device = CRUDSensorDevice() 