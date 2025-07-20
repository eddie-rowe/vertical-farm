from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from httpx import HTTPStatusError
from supabase import AClient as SupabaseClient

from app.models.enums import ParentType  # Added ParentType
from app.schemas.shelf import (  # Added ShelfResponse
    ShelfCreate,
    ShelfResponse,
    ShelfUpdate,
)

from .crud_sensor_device import sensor_device  # Added import for sensor_device CRUD

# import logging
# logger = logging.getLogger(__name__)


class CRUDShelf:
    table_name = "shelves"

    async def get(self, supabase: SupabaseClient, id: UUID) -> dict[str, Any] | None:
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
            # logger.error(f"Error fetching shelf {id}: {e}")
            raise
        except Exception as e:
            # logger.error(f"Unexpected error fetching shelf {id}: {e}")
            raise

    async def get_multi_by_rack(
        self,
        supabase: SupabaseClient,
        *,
        rack_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("rack_id", str(rack_id))
                .order("name")  # Example order
                .range(skip, skip + limit - 1)
                .execute()
            )
            return response.data
        except Exception as e:
            # logger.error(f"Error fetching shelves for rack {rack_id}: {e}")
            raise

    async def get_multi_by_rack_with_devices(
        self,
        supabase: SupabaseClient,
        *,
        rack_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ShelfResponse]:
        shelves_data = await self.get_multi_by_rack(
            supabase, rack_id=rack_id, skip=skip, limit=limit
        )

        shelves_with_devices = []
        for shelf_data in shelves_data:
            shelf_id = shelf_data.get("id")
            if not shelf_id:
                continue  # Or handle error

            devices_data = await sensor_device.get_multi_by_parent(
                supabase, parent_id=UUID(shelf_id), parent_type=ParentType.SHELF
            )

            # Convert shelf_data to ShelfResponse and add devices
            # The devices_data are dicts, they will be converted by Pydantic when creating ShelfResponse
            # if ShelfResponse.devices field is typed correctly (which it is, with SensorDeviceResponse)
            shelf_response_data = {
                **shelf_data,
                "devices": devices_data if devices_data else [],
            }
            shelves_with_devices.append(ShelfResponse(**shelf_response_data))

        return shelves_with_devices

    async def get_multi_by_rack_with_total(
        self,
        supabase: SupabaseClient,
        *,
        rack_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[dict[str, Any]], int]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*", count="exact")
                .eq("rack_id", str(rack_id))
                .order("name")
                .range(skip, skip + limit - 1)
                .execute()
            )
            shelves = response.data
            total = response.count if response.count is not None else 0
            return shelves, total
        except Exception as e:
            # logger.error(f"Error fetching shelves with total for rack {rack_id}: {e}")
            raise

    async def create_with_rack(
        self, supabase: SupabaseClient, *, obj_in: ShelfCreate, rack_id: UUID
    ) -> dict[str, Any]:
        try:
            shelf_data = obj_in.model_dump()
            shelf_data["rack_id"] = str(rack_id)
            response = (
                await supabase.table(self.table_name).insert(shelf_data).execute()
            )
            if not response.data:
                # logger.error(f"Failed to create shelf for rack {rack_id}: No data. Response: {response}")
                raise Exception(
                    "Failed to create shelf: No data returned from Supabase"
                )
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error creating shelf for rack {rack_id}: {e}")
            raise

    async def update(
        self, supabase: SupabaseClient, *, id: UUID, obj_in: ShelfUpdate
    ) -> dict[str, Any] | None:
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            if not update_data:
                return await self.get(supabase, id)

            response = (
                await supabase.table(self.table_name)
                .update(update_data)
                .eq("id", str(id))
                .execute()
            )
            if not response.data:
                # logger.warning(f"Update for shelf {id} returned no data. Shelf might not exist. Resp: {response}")
                return None
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error updating shelf {id}: {e}")
            raise

    async def remove(
        self, supabase: SupabaseClient, *, id: UUID
    ) -> dict[str, Any] | None:
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
            # logger.error(f"Error deleting shelf {id}: {e}")
            raise


shelf = CRUDShelf()
