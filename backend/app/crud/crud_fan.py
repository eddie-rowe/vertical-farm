from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from httpx import HTTPStatusError
from supabase import AClient as SupabaseClient

from app.models.enums import ParentType  # For parent_type validation/enum usage
from app.schemas.fan import FanCreate, FanUpdate  # Pydantic schemas

# import logging
# logger = logging.getLogger(__name__)


class CRUDFan:
    table_name = "fans"

    async def get(self, supabase: SupabaseClient, id: UUID) -> Optional[Dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("id", str(id))
                .single()
                .execute()
            )
            return response.data
        except HTTPStatusError as e:
            if e.response.status_code == 406:
                return None
            raise
        except Exception as e:
            raise

    async def get_multi_by_parent(
        self,
        supabase: SupabaseClient,
        *,
        parent_id: UUID,
        parent_type: ParentType,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("parent_id", str(parent_id))
                .eq("parent_type", parent_type.value)
                .order("name")  # Example order
                .range(skip, skip + limit - 1)
                .execute()
            )
            return response.data
        except Exception as e:
            # logger.error(f"Error fetching fans for parent {parent_id} ({parent_type.value}): {e}")
            raise

    async def get_multi_by_parent_with_total(
        self,
        supabase: SupabaseClient,
        *,
        parent_id: UUID,
        parent_type: ParentType,
        skip: int = 0,
        limit: int = 100,
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
            fans = response.data
            total = response.count if response.count is not None else 0
            return fans, total
        except Exception as e:
            # logger.error(f"Error fetching fans with total for parent {parent_id} ({parent_type.value}): {e}")
            raise

    async def create_with_parent(
        self,
        supabase: SupabaseClient,
        *,
        obj_in: FanCreate,
        parent_id: UUID,
        parent_type: ParentType,
    ) -> Dict[str, Any]:
        try:
            fan_data = obj_in.model_dump()
            fan_data["parent_id"] = str(parent_id)
            fan_data["parent_type"] = parent_type.value
            # Ensure enum values from Pydantic model are correctly passed if they exist
            if obj_in.type:
                fan_data["type"] = obj_in.type.value

            response = await supabase.table(self.table_name).insert(fan_data).execute()
            if not response.data:
                raise Exception("Failed to create fan: No data returned from Supabase")
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error creating fan for parent {parent_id} ({parent_type.value}): {e}")
            raise

    async def update(
        self, supabase: SupabaseClient, *, id: UUID, obj_in: FanUpdate
    ) -> Optional[Dict[str, Any]]:
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            if not update_data:
                return await self.get(supabase, id)

            # Handle enums if they are part of the update payload
            if "type" in update_data and update_data["type"]:
                update_data["type"] = update_data["type"].value
            if "parent_type" in update_data and update_data["parent_type"]:
                update_data["parent_type"] = update_data["parent_type"].value

            response = (
                await supabase.table(self.table_name)
                .update(update_data)
                .eq("id", str(id))
                .execute()
            )
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error updating fan {id}: {e}")
            raise

    async def remove(
        self, supabase: SupabaseClient, *, id: UUID
    ) -> Optional[Dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .delete()
                .eq("id", str(id))
                .execute()
            )
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error deleting fan {id}: {e}")
            raise


fan = CRUDFan()
