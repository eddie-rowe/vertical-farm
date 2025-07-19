from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from httpx import HTTPStatusError
from supabase import AClient as SupabaseClient

from app.schemas.row import RowCreate, RowResponse, RowUpdate  # Added RowResponse

# from app.db.supabase_client import get_async_supabase_client # Client should be injected
from .crud_rack import rack  # Added import for rack CRUD

# import logging
# logger = logging.getLogger(__name__)


class CRUDRow:
    table_name = "rows"

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
            if e.response.status_code == 406:  # PostgREST Not Found
                return None
            # logger.error(f"Error fetching row {id}: {e}")
            raise
        except Exception as e:
            # logger.error(f"Unexpected error fetching row {id}: {e}")
            raise

    async def get_multi_by_farm(
        self,
        supabase: SupabaseClient,
        *,
        farm_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("farm_id", str(farm_id))
                .order("name")  # Example: order by name, adjust as needed
                .range(skip, skip + limit - 1)
                .execute()
            )
            return response.data
        except Exception as e:
            # logger.error(f"Error fetching rows for farm {farm_id}: {e}")
            raise

    async def get_multi_by_farm_with_racks(
        self,
        supabase: SupabaseClient,
        *,
        farm_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[RowResponse]:
        rows_data = await self.get_multi_by_farm(
            supabase, farm_id=farm_id, skip=skip, limit=limit
        )

        rows_with_racks = []
        for row_data in rows_data:
            row_id = row_data.get("id")
            if not row_id:
                continue

            racks_list = await rack.get_multi_by_row_with_shelves(
                supabase,
                row_id=UUID(row_id),
                # Not passing skip/limit for racks here, assuming we want all racks for the row
            )

            row_response_data = {**row_data, "racks": racks_list if racks_list else []}
            rows_with_racks.append(RowResponse(**row_response_data))

        return rows_with_racks

    async def get_multi_by_farm_with_total(
        self,
        supabase: SupabaseClient,
        *,
        farm_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Dict[str, Any]], int]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*", count="exact")
                .eq("farm_id", str(farm_id))
                .order("name")
                .range(skip, skip + limit - 1)
                .execute()
            )
            rows = response.data
            total = response.count if response.count is not None else 0
            return rows, total
        except Exception as e:
            # logger.error(f"Error fetching rows with total for farm {farm_id}: {e}")
            raise

    async def create_with_farm(
        self, supabase: SupabaseClient, *, obj_in: RowCreate, farm_id: UUID
    ) -> Dict[str, Any]:
        try:
            row_data = obj_in.model_dump()
            row_data["farm_id"] = str(farm_id)

            # Handle enum for orientation if it's part of obj_in and needs to be stored as value
            if hasattr(obj_in, "orientation") and obj_in.orientation:
                row_data["orientation"] = obj_in.orientation.value

            response = await supabase.table(self.table_name).insert(row_data).execute()
            if not response.data:
                # logger.error(f"Failed to create row for farm {farm_id}: No data. Response: {response}")
                raise Exception("Failed to create row: No data returned from Supabase")
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error creating row for farm {farm_id}: {e}")
            raise

    async def update(
        self, supabase: SupabaseClient, *, id: UUID, obj_in: RowUpdate
    ) -> Optional[Dict[str, Any]]:
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            if not update_data:
                return await self.get(supabase, id)

            # Handle enum for orientation if it's part of obj_in and needs to be stored as value
            if "orientation" in update_data and update_data["orientation"]:
                update_data["orientation"] = update_data["orientation"].value

            response = (
                await supabase.table(self.table_name)
                .update(update_data)
                .eq("id", str(id))
                .execute()
            )
            if not response.data:
                # logger.warning(f"Update for row {id} returned no data. Row might not exist or no change made. Resp: {response}")
                return None  # Or fetch current to confirm existence: await self.get(supabase, id)
            return response.data[0]
        except Exception as e:
            # logger.error(f"Error updating row {id}: {e}")
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
            # logger.error(f"Error deleting row {id}: {e}")
            raise


row = CRUDRow()
