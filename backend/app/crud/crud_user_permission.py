from supabase import AClient, acreate_client  # Changed
from uuid import UUID
from app.schemas import (
    user_permission as user_permission_schema,
)  # For input/output types; was app.models
from app.models import (
    user_permission as user_permission_model,
)  # For DB model instantiation
from app.models.enums import PermissionLevel

# from app.models.user import User # SQLAlchemy User model removed
from app.models.enums import (
    UserRole,
)  # This enum might still be useful if user role is stored directly
import datetime
from typing import List, Optional  # Added List, Optional

USER_PERMISSIONS_TABLE_NAME = "farm_user_permissions"


async def get_user_permission(
    db: AClient, farm_id: UUID, user_id: UUID
) -> Optional[
    "user_permission_model.UserPermissionInDB"
]:  # Changed return type to string literal
    response = await (
        db.table(USER_PERMISSIONS_TABLE_NAME)
        .select("*")
        .eq("farm_id", str(farm_id))
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )
    if response.data:
        return user_permission_model.UserPermissionInDB(
            **response.data
        )  # Changed model
    return None


async def get_user_permissions_for_farm(
    db: AClient, farm_id: UUID, skip: int = 0, limit: int = 100
) -> List[
    "user_permission_model.UserPermissionInDB"
]:  # Changed return type to string literal
    response = (
        await db.table(USER_PERMISSIONS_TABLE_NAME)
        .select("*")
        .eq("farm_id", str(farm_id))
        .range(skip, skip + limit - 1)
        .execute()
    )

    permissions_list = []
    if response.data:
        for perm_data in response.data:
            try:
                permissions_list.append(
                    user_permission_model.UserPermissionInDB(**perm_data)
                )  # Changed model
            except Exception as e:
                print(f"Error parsing permission data: {perm_data}, Error: {e}")
    return permissions_list


async def get_permissions_for_user(
    db: AClient, user_id: UUID, skip: int = 0, limit: int = 100
) -> List[
    "user_permission_model.UserPermissionInDB"
]:  # Changed return type to string literal
    response = (
        await db.table(USER_PERMISSIONS_TABLE_NAME)
        .select("*")
        .eq("user_id", str(user_id))
        .range(skip, skip + limit - 1)
        .execute()
    )
    return [
        user_permission_model.UserPermissionInDB(**perm) for perm in response.data
    ]  # Changed model


async def create_user_permission(
    db: AClient, *, perm_in: user_permission_schema.UserPermissionCreate
) -> (
    "user_permission_model.UserPermissionInDB"
):  # Changed input/output to string literal
    perm_data_dict = perm_in.model_dump()
    perm_data_dict["farm_id"] = str(perm_in.farm_id)
    perm_data_dict["user_id"] = str(perm_in.user_id)
    perm_data_dict["permission"] = (
        perm_in.permission.value
    )  # Ensure enum value is stored

    response = (
        await db.table(USER_PERMISSIONS_TABLE_NAME).insert(perm_data_dict).execute()
    )
    if response.data:
        return user_permission_model.UserPermissionInDB(
            **response.data[0]
        )  # Changed model
    raise Exception("Failed to create user permission or no data returned")


async def update_user_permission(
    db: AClient,
    *,
    farm_id: UUID,
    user_id: UUID,
    perm_in: user_permission_schema.UserPermissionUpdate,
) -> Optional[
    "user_permission_model.UserPermissionInDB"
]:  # Changed input/output to string literal
    update_data = perm_in.model_dump(exclude_unset=True)
    if "permission" in update_data and update_data["permission"] is not None:
        if isinstance(update_data["permission"], PermissionLevel):
            update_data["permission"] = update_data["permission"].value
    else:  # If permission is not in payload or is None, remove it from update_data to avoid setting it to null
        update_data.pop("permission", None)

    if not update_data:  # Nothing to update
        return await get_user_permission(db, farm_id=farm_id, user_id=user_id)

    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    response = (
        await db.table(USER_PERMISSIONS_TABLE_NAME)
        .update(update_data)
        .eq("farm_id", str(farm_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if response.data:
        return user_permission_model.UserPermissionInDB(
            **response.data[0]
        )  # Changed model
    return await get_user_permission(
        db, farm_id=farm_id, user_id=user_id
    )  # Return current state if update returned no data but row exists


async def delete_user_permission(
    db: AClient, *, farm_id: UUID, user_id: UUID
) -> Optional[
    "user_permission_model.UserPermissionInDB"
]:  # Changed return type to string literal
    perm_to_delete = await get_user_permission(db, farm_id, user_id)
    if not perm_to_delete:
        return None

    response = (
        await db.table(USER_PERMISSIONS_TABLE_NAME)
        .delete()
        .eq("farm_id", str(farm_id))
        .eq("user_id", str(user_id))
        .execute()
    )

    if response.data:  # If Supabase returns the deleted item
        return user_permission_model.UserPermissionInDB(**response.data[0])
    # If deletion was successful but no data returned, perm_to_delete can be returned
    # Check if an error would be raised by Supabase client for failed deletions
    return perm_to_delete  # Optimistic return


async def can_user_perform_action(
    db: AClient, user_id: UUID, farm_id: UUID, levels: List[PermissionLevel]
) -> bool:
    # TODO: Re-implement platform admin check without SQLAlchemy User model
    # For example, fetch user role directly from 'users' table or auth context
    # user_details = await db.table("users").select("role").eq("id", str(user_id)).maybe_single().execute()
    # if user_details.data and user_details.data.get("role") == UserRole.ADMIN.value:
    #     return True

    permission_entry = await get_user_permission(db, farm_id=farm_id, user_id=user_id)
    if not permission_entry:
        return False

    user_permission_value = permission_entry.permission
    if isinstance(user_permission_value, str):
        try:
            user_permission_value = PermissionLevel(user_permission_value)
        except ValueError:
            return False

    return user_permission_value in levels


# def is_user_platform_admin(current_user_model: User) -> bool: # Commented out as User model is removed
#     if not current_user_model or not hasattr(current_user_model, 'role') or current_user_model.role is None:
#         return False
#     return current_user_model.role is UserRole.ADMIN
