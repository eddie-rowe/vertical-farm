from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from httpx import HTTPStatusError

# Use AsyncClient for asynchronous operations
from supabase import AClient as SupabaseClient  # Use AClient

from app.schemas import farm as farm_schema  # Pydantic schemas

from .crud_row import row as crud_row  # Added import for row CRUD

# from app.db.supabase_client import get_async_supabase_client # Removed direct import here, client should be injected

# Placeholder for potential error handling or logging
# import logging
# logger = logging.getLogger(__name__)


class CRUDFarm:
    table_name = "farms"

    async def get(
        self, supabase: SupabaseClient, id: UUID
    ) -> farm_schema.FarmResponse | None:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("id", str(id))
                .single()
                .execute()
            )
            farm_data = response.data
            if not farm_data:
                return None

            # Fetch rows with their nested racks, shelves, and devices
            rows_list = await crud_row.get_multi_by_farm_with_racks(
                supabase,
                farm_id=id,
                # Not passing skip/limit for rows here, assuming we want all rows for the farm details
            )

            # farm_data is a dict, rows_list is List[RowResponse]
            # We need to construct FarmResponse passing the rows_list to its `rows` field
            farm_response_data = {**farm_data, "rows": rows_list if rows_list else []}
            return farm_schema.FarmResponse(**farm_response_data)

        except HTTPStatusError as e:
            if (
                e.response.status_code == 406
            ):  # PostgREST returns 406 if a single() row is not found
                return None
            # logger.error(f"Error fetching farm {id}: {e}")
            raise
        except Exception as e:
            # logger.error(f"Unexpected error fetching farm {id}: {e}")
            raise

    async def get_multi_by_owner(
        self,
        supabase: SupabaseClient,
        *,
        owner_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("manager_id", str(owner_id))
                .order("created_at", desc=True)  # Assuming you want ordering
                .range(skip, skip + limit - 1)  # Supabase range is inclusive
                .execute()
            )
            return response.data
        except Exception as e:
            # logger.error(f"Error fetching farms for owner {owner_id}: {e}")
            raise

    async def get_multi_with_total(
        self,
        supabase: SupabaseClient,
        *,
        owner_id: UUID | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[dict[str, Any]], int]:
        try:
            query = supabase.table(self.table_name).select("*", count="exact")
            if owner_id:
                query = query.eq("manager_id", str(owner_id))

            response = (
                await query.order("created_at", desc=True)
                .range(skip, skip + limit - 1)
                .execute()
            )

            farms = response.data
            total = (
                response.count if response.count is not None else 0
            )  # Handle if count is None
            return farms, total
        except Exception as e:
            # logger.error(f"Error fetching farms with total: {e}")
            raise

    async def create_with_owner(
        self,
        supabase: SupabaseClient,
        *,
        obj_in: farm_schema.FarmCreate,
        owner_id: UUID,
    ) -> dict[str, Any]:
        try:
            farm_data = obj_in.model_dump()
            # Remove fields that don't exist in the database schema
            farm_data.pop("farm_image_url", None)  # This field doesn't exist in DB yet
            farm_data["manager_id"] = str(
                owner_id
            )  # Use manager_id to match the database schema

            response = await supabase.table(self.table_name).insert(farm_data).execute()
            if not response.data:
                # logger.error(f"Failed to create farm: No data returned. Response: {response}")
                raise Exception("Failed to create farm: No data returned from Supabase")
            return response.data[0]  # Supabase insert returns a list with one item
        except Exception as e:
            # logger.error(f"Error creating farm for owner {owner_id}: {e}")
            raise

    async def update(
        self, supabase: SupabaseClient, *, id: UUID, obj_in: farm_schema.FarmUpdate
    ) -> farm_schema.FarmResponse | None:
        try:
            update_data = obj_in.model_dump(exclude_unset=True)
            # Remove fields that don't exist in the database schema
            update_data.pop(
                "farm_image_url", None
            )  # This field doesn't exist in DB yet
            if not update_data:
                # If there's nothing to update, fetch and return the current object
                return await self.get(supabase, id)

            response = (
                await supabase.table(self.table_name)
                .update(update_data)
                .eq("id", str(id))
                .execute()
            )

            if not response.data:
                # logger.error(f"Failed to update farm {id} or farm not found. Response: {response}")
                # Depending on desired behavior, either return None or raise an error.
                # Supabase update returns an empty list if no row matches the filter.
                return None  # Or raise an appropriate exception

            # Return the full FarmResponse after update by fetching it
            return await self.get(supabase, id)
        except Exception as e:
            # logger.error(f"Error updating farm {id}: {e}")
            raise

    async def remove(
        self, supabase: SupabaseClient, *, id: UUID
    ) -> farm_schema.FarmResponse | None:
        try:
            # First fetch the object to return it, since we need the full FarmResponse
            item_to_delete = await self.get(supabase, id)
            if not item_to_delete:
                return None

            response = (
                await supabase.table(self.table_name)
                .delete()
                .eq("id", str(id))
                .execute()
            )

            if not response.data:  # If no rows were deleted (e.g., ID not found)
                return None
            return item_to_delete  # Return the full FarmResponse object
        except Exception as e:
            # logger.error(f"Error deleting farm {id}: {e}")
            raise


farm = CRUDFarm()
