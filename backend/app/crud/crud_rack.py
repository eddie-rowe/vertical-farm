from typing import Any
from uuid import UUID

from httpx import HTTPStatusError
from supabase import AClient as SupabaseClient

from app.schemas.rack import RackCreate, RackResponse, RackUpdate

from .crud_shelf import shelf  # Added import for shelf CRUD

# import logging
# logger = logging.getLogger(__name__)


class CRUDRack:
    table_name = "racks"

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
            # logger.error(f"Error fetching rack {id}: {e}")
            raise
        except Exception:
            # logger.error(f"Unexpected error fetching rack {id}: {e}")
            raise

    async def get_multi_by_row(
        self, supabase: SupabaseClient, *, row_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[dict[str, Any]]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*")
                .eq("row_id", str(row_id))
                .order("name")
                .range(skip, skip + limit - 1)
                .execute()
            )
            return response.data
        except Exception:
            # logger.error(f"Error fetching racks for row {row_id}: {e}")
            raise

    async def get_multi_by_row_with_shelves(
        self, supabase: SupabaseClient, *, row_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[RackResponse]:
        racks_data = await self.get_multi_by_row(
            supabase, row_id=row_id, skip=skip, limit=limit
        )

        racks_with_shelves = []
        for rack_data in racks_data:
            rack_id = rack_data.get("id")
            if not rack_id:
                continue

            # Use the new method from CRUDShelf
            shelves_list = await shelf.get_multi_by_rack_with_devices(
                supabase,
                rack_id=UUID(rack_id),
                # Not passing skip/limit for shelves here, assuming we want all shelves for the rack
            )

            rack_response_data = {
                **rack_data,
                "shelves": shelves_list if shelves_list else [],
            }
            racks_with_shelves.append(RackResponse(**rack_response_data))

        return racks_with_shelves

    async def get_multi_by_row_with_total(
        self, supabase: SupabaseClient, *, row_id: UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[dict[str, Any]], int]:
        try:
            response = (
                await supabase.table(self.table_name)
                .select("*", count="exact")
                .eq("row_id", str(row_id))
                .order("name")
                .range(skip, skip + limit - 1)
                .execute()
            )
            racks = response.data
            total = response.count if response.count is not None else 0
            return racks, total
        except Exception:
            # logger.error(f"Error fetching racks with total for row {row_id}: {e}")
            raise

    async def create_with_row(
        self, supabase: SupabaseClient, *, obj_in: RackCreate, row_id: UUID
    ) -> dict[str, Any]:
        try:
            rack_data = obj_in.model_dump()
            rack_data["row_id"] = str(row_id)
            response = await supabase.table(self.table_name).insert(rack_data).execute()
            if not response.data:
                # logger.error(f"Failed to create rack for row {row_id}: No data. Response: {response}")
                raise Exception("Failed to create rack: No data returned from Supabase")
            return response.data[0]
        except Exception:
            # logger.error(f"Error creating rack for row {row_id}: {e}")
            raise

    async def update(
        self, supabase: SupabaseClient, *, id: UUID, obj_in: RackUpdate
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
                # logger.warning(f"Update for rack {id} returned no data. Rack might not exist or no change made. Resp: {response}")
                return None
            return response.data[0]
        except Exception:
            # logger.error(f"Error updating rack {id}: {e}")
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
        except Exception:
            # logger.error(f"Error deleting rack {id}: {e}")
            raise


rack = CRUDRack()

# Placeholder CRUD operations for Rack
# These would typically interact with a Supabase table named 'racks'


async def get_rack(db: SupabaseClient, id: UUID) -> RackResponse | None:
    """Get a single rack by ID."""
    # response = await db.table(settings.SUPABASE_TABLE_RACKS).select("*").eq("id", str(id)).execute()
    # if response.data:
    #     return RackResponse(**response.data[0])
    print(f"CRUD: Get rack with id: {id}")  # Placeholder
    return None  # Placeholder


async def get_racks_by_row(
    db: SupabaseClient, row_id: UUID, skip: int = 0, limit: int = 100
) -> list[RackResponse]:
    """Get all racks for a specific row."""
    # response = await db.table(settings.SUPABASE_TABLE_RACKS).select("*").eq("row_id", str(row_id)).offset(skip).limit(limit).execute()
    # return [RackResponse(**item) for item in response.data]
    print(
        f"CRUD: Get racks for row_id: {row_id}, skip: {skip}, limit: {limit}"
    )  # Placeholder
    return []  # Placeholder


async def create_rack(db: SupabaseClient, obj_in: RackCreate) -> RackResponse:
    """Create a new rack."""
    # data, count = await db.table(settings.SUPABASE_TABLE_RACKS).insert(obj_in.model_dump()).execute()
    # return RackResponse(**data[0])
    print(f"CRUD: Create rack with data: {obj_in}")  # Placeholder
    return RackResponse(
        id=UUID("00000000-0000-0000-0000-000000000000"),
        name=obj_in.name,
        row_id=obj_in.row_id,
        position_in_row=obj_in.position_in_row,
        width=obj_in.width,
        depth=obj_in.depth,
        height=obj_in.height,
    )  # Placeholder


async def update_rack(
    db: SupabaseClient, id: UUID, obj_in: RackUpdate
) -> RackResponse | None:
    """Update an existing rack."""
    # update_data = obj_in.model_dump(exclude_unset=True)
    # response = await db.table(settings.SUPABASE_TABLE_RACKS).update(update_data).eq("id", str(id)).execute()
    # if response.data:
    #     return RackResponse(**response.data[0])
    print(f"CRUD: Update rack with id: {id}, data: {obj_in}")  # Placeholder
    return None  # Placeholder


async def delete_rack(db: SupabaseClient, id: UUID) -> RackResponse | None:
    """Delete a rack."""
    # response = await db.table(settings.SUPABASE_TABLE_RACKS).delete().eq("id", str(id)).execute()
    # if response.data:
    #     return RackResponse(**response.data[0])
    print(f"CRUD: Delete rack with id: {id}")  # Placeholder
    return None  # Placeholder
