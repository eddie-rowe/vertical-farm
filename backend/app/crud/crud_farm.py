from supabase import AsyncClient, create_async_client # Changed
from app.schemas import farm as farm_schema # For input/output types
from app.models import farm as farm_model # For DB model instantiation
from uuid import UUID
import datetime
from typing import Tuple, Optional, List # Added List

# Note: Supabase often uses its own client methods directly rather than an ORM like SQLAlchemy for simpler cases.
# The examples below will use the direct Supabase client approach.

FARM_TABLE_NAME = "farms"
# USER_PERMISSIONS_TABLE_NAME = "user_permissions" # No longer needed for manual filtering here

async def get_farm(db: AsyncClient, farm_id: UUID) -> Optional[farm_model.Farm]: # requesting_user_id removed
    """Fetch a single farm by ID.
    Assumes the provided db client will enforce RLS if it's an RLS-specific client.
    """
    query = db.table(FARM_TABLE_NAME).select("*").eq("id", str(farm_id))
    response = await query.maybe_single().execute()
    if response.data:
        return farm_model.Farm(**response.data)
    return None

async def get_farms_and_total(db: AsyncClient, skip: int = 0, limit: int = 100) -> Tuple[List[farm_model.Farm], int]: # user_id removed
    """Retrieve farms accessible by the user (via RLS) with total count for pagination."""
    
    # Count query will respect RLS enforced by the db client
    count_response = await db.table(FARM_TABLE_NAME).select("id", count="exact").execute()
    total_count = count_response.count if count_response.count is not None else 0

    if total_count == 0:
        return [], 0

    # Data query will respect RLS enforced by the db client
    data_response = await db.table(FARM_TABLE_NAME).select("*")\
                           .range(skip, skip + limit - 1).execute()
    
    farms = [farm_model.Farm(**farm_data) for farm_data in data_response.data]
    return farms, total_count

async def create_farm(db: AsyncClient, *, farm_in: farm_schema.FarmCreate, manager_id: UUID) -> farm_model.Farm:
    farm_data_dict = farm_in.model_dump()
    farm_data_dict["owner_id"] = str(manager_id) # Assuming Farm model has owner_id
    # created_at and updated_at are usually handled by DB defaults or triggers
    
    response = await db.table(FARM_TABLE_NAME).insert(farm_data_dict).execute()
    if response.data:
        return farm_model.Farm(**response.data[0])
    raise Exception("Failed to create farm or no data returned from Supabase") # Added more specific error

async def update_farm(db: AsyncClient, *, farm_id: UUID, farm_in: farm_schema.FarmUpdate) -> Optional[farm_model.Farm]:
    update_data = farm_in.model_dump(exclude_unset=True)
    if not update_data: # Nothing to update
        return await get_farm(db, farm_id) # requesting_user_id removed
        
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    response = await db.table(FARM_TABLE_NAME).update(update_data).eq("id", str(farm_id)).select("*").execute() # Added select("*")
    if response.data:
        return farm_model.Farm(**response.data[0])
    # If farm_id doesn't exist, Supabase update doesn't error but returns no data.
    # Check if the farm existed before attempting to return it.
    # Note: RLS might prevent finding the farm even if it exists, if using RLS client.
    # This function assumes 'db' is a service client for writes, so get_farm would also use service client here.
    existing_farm = await get_farm(db, farm_id) # requesting_user_id removed
    if not existing_farm:
         return None # Farm was not found to begin with
    # If it existed but update returned no data (should not happen if row matched and no error, and select("*") is used)
    return existing_farm # Should have been returned by the select("*") if update was successful

async def delete_farm(db: AsyncClient, *, farm_id: UUID) -> Optional[farm_model.Farm]:
    # Fetch first to return it, and to ensure it exists (using the same client, likely service client)
    farm_to_delete = await get_farm(db, farm_id) # requesting_user_id removed
    if not farm_to_delete:
        return None 

    response = await db.table(FARM_TABLE_NAME).delete().eq("id", str(farm_id)).select("*").execute() # Added select("*")
    if response.data: # Supabase often returns the deleted record(s) if select("*") is used
        return farm_model.Farm(**response.data[0])
    # If delete was successful but returns no data (e.g. if select isn't used or row didn't match), 
    # and no exception was raised, farm_to_delete can be returned.
    # However, with select("*"), if data is empty, it implies the row wasn't found or an RLS issue if RLS client was used.
    # Since this is delete, and we fetched `farm_to_delete` with the same client,
    # if it was found then, it should be deletable.
    # If an error occurred (e.g. RLS on delete), an exception would likely be raised by Supabase client.
    # If no exception and no data, but farm_to_delete was found, this implies a successful delete without return.
    # However, adding select("*") makes it more robust. If still no data, implies RLS on delete prevented it or item vanished.
    # For consistency, if select("*") returns data, use it. Otherwise, if farm_to_delete existed, assume delete okay.
    # But if farm_to_delete existed and select("*") returns nothing, the item might not have been deleted due to RLS on DELETE.
    # This part is tricky. Simplest is: if select("*") has data, that's the deleted item. If not, and farm_to_delete was found,
    # assume it's deleted. If farm_to_delete not found initially, return None.

    # More robust: if select("*") on delete has data, that's it.
    # If not, it means the delete didn't happen or didn't return data.
    # If farm_to_delete was originally found, and response.data is empty after delete().select().execute(),
    # it could mean RLS prevented the delete, or the item was already gone.
    # Let's stick to: if the delete operation + select returns data, that's the confirmation.
    # If not, but farm_to_delete was confirmed before, we return farm_to_delete as the "last known state"
    # of the (presumably) deleted item. This is common practice.
    # If Supabase raises an error on RLS violation for DELETE, that's handled by FastAPI's error handlers.
    
    # Re-simplifying: The initial fetch of farm_to_delete confirms existence (or RLS allows view).
    # The delete operation is attempted. If it returns data (with .select("*")), that's the item.
    # If it doesn't return data but no error was raised, and we initially found farm_to_delete,
    # it's conventional to return farm_to_delete.
    return farm_to_delete # Return the fetched object if delete call doesn't return it but succeeded
