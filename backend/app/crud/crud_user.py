from typing import Any, Dict, Optional
from uuid import UUID

from gotrue.errors import AuthApiError as APIError
from httpx import HTTPStatusError
from supabase import AClient as SupabaseClient  # Use AClient

# from app.schemas import user as user_schema # Remove top-level import

# from app.db.supabase_client import get_async_supabase_client # Client should be injected or handled by API layer

# import logging
# logger = logging.getLogger(__name__)


class CRUDUser:
    # Note: User operations are often handled by Supabase Auth.
    # These CRUD methods might interact with the 'users' table for custom data or act as wrappers.

    async def get(self, supabase: SupabaseClient, id: UUID) -> Optional[Dict[str, Any]]:
        """Fetches a user directly from the 'users' table. Useful if Supabase Auth user object is not sufficient."""
        try:
            response = (
                await supabase.table("user_profiles")
                .select("*")
                .eq("id", str(id))
                .single()
                .execute()
            )
            return response.data
        except HTTPStatusError as e:
            if e.response.status_code == 406:  # PostgREST Not Found
                return None
            # logger.error(f"Error fetching user {id} from table: {e}")
            raise
        except Exception as e:
            # Handle the postgrest.exceptions.APIError for "no rows returned"
            if "no rows returned" in str(e).lower() or "pgrst116" in str(e).lower():
                print(f"DEBUG: User {id} not found in user_profiles table")
                return None
            # logger.error(f"Unexpected error fetching user {id} from table: {e}")
            print(f"DEBUG: Unexpected error in crud_user.get: {e}")
            raise

    async def get_by_email(
        self, supabase: SupabaseClient, *, email: str
    ) -> Optional[Dict[str, Any]]:
        """Fetches a user by email directly from the 'users' table."""
        try:
            response = (
                await supabase.table("user_profiles")
                .select("*")
                .eq("email", email)
                .single()
                .execute()
            )
            return response.data
        except HTTPStatusError as e:
            if e.response.status_code == 406:
                return None
            # logger.error(f"Error fetching user by email {email} from table: {e}")
            raise
        except Exception as e:
            # logger.error(f"Unexpected error fetching user by email {email} from table: {e}")
            raise

    async def create(
        self, supabase: SupabaseClient, obj_in: Any
    ) -> Dict[str, Any]:  # Use Any for obj_in type hint
        from app.schemas import user as user_schema  # Import locally

        """Creates a new user using Supabase Auth and then potentially updates the users table with additional info."""
        if not isinstance(obj_in, user_schema.UserCreate):
            raise TypeError("obj_in must be an instance of UserCreate")
        try:
            # Supabase Auth handles password hashing.
            options = {
                "data": {  # This 'data' is for Supabase Auth's user_metadata
                    "full_name": obj_in.full_name,
                }
            }
            if hasattr(obj_in, "role") and obj_in.role:
                # Assuming role is for app_metadata, not directly in user_profiles table during this step
                options["data"]["app_metadata"] = {"role": obj_in.role.value}

            auth_response = await supabase.auth.sign_up(
                {"email": obj_in.email, "password": obj_in.password, "options": options}
            )

            if auth_response.user:
                user_auth_data = auth_response.user.model_dump()
                user_id = auth_response.user.id

                # Create the corresponding user profile in public.user_profiles
                profile_payload = {"id": user_id}
                if hasattr(obj_in, "full_name") and obj_in.full_name:
                    profile_payload["name"] = obj_in.full_name
                # role will use its DB default ('operator')
                # created_at and updated_at will use DB defaults

                try:
                    profile_insert_response = (
                        await supabase.table("user_profiles")
                        .insert(profile_payload)
                        .execute()
                    )
                    if profile_insert_response.data:
                        # Profile created successfully
                        pass
                    else:
                        # Profile insert failed or returned no data, this is an issue.
                        # logger.error(f"Failed to create user profile data for {user_id}: {profile_insert_response.error}")
                        raise APIError(
                            f"User signed up in auth, but failed to create profile data for {user_id}.",
                            status_code=500,
                        )
                except Exception as profile_creation_e:
                    # logger.error(f"Exception creating user profile for {user_id} after auth signup: {profile_creation_e}")
                    # Attempt to clean up the auth user if profile creation fails to maintain consistency
                    try:
                        await supabase.auth.admin.delete_user(user_id)
                        # logger.info(f"Cleaned up auth user {user_id} after failed profile creation.")
                    except Exception as admin_delete_e:
                        # logger.error(f"Failed to clean up auth user {user_id} after profile error: {admin_delete_e}")
                        pass  # Log and continue to raise the profile creation error
                    raise APIError(
                        f"User signed up in auth, but failed to create profile for {user_id}: {profile_creation_e}",
                        status_code=500,
                    ) from profile_creation_e

                # The commented out section for updating "users" table is not needed here for initial profile creation.
                # If additional fields (is_active, is_superuser) were meant for user_profiles,
                # they could be part of the profile_payload or a subsequent update if necessary.

                return user_auth_data  # Return the auth user data as before
            elif auth_response.session:
                # logger.warning(f"User sign up for {obj_in.email} returned session but no user object, might exist.")
                raise APIError(
                    f"User already registered or confirmation required for {obj_in.email}",
                    status_code=409,
                )
            else:
                # logger.error(f"Supabase Auth sign_up failed for {obj_in.email}: {auth_response}")
                error_message = (
                    auth_response.error.message
                    if auth_response.error
                    else "Unknown auth error during sign_up"
                )
                raise APIError(
                    f"Failed to create user {obj_in.email}. Response: {error_message}",
                    status_code=500,
                )

        except APIError as e:
            # logger.error(f"Supabase APIError during user creation for {obj_in.email}: {e.message}")
            raise
        except Exception as e:
            # logger.error(f"Unexpected error during user creation for {obj_in.email}: {e}")
            raise

    async def update(
        self,
        supabase: SupabaseClient,
        *,
        user_id: UUID,
        obj_in: Any,  # Use Any for obj_in type hint
    ) -> Optional[Dict[str, Any]]:
        from app.schemas import user as user_schema  # Import locally

        """Updates user attributes using Supabase Auth and/or direct table update."""
        if not isinstance(obj_in, user_schema.UserUpdate):
            raise TypeError("obj_in must be an instance of UserUpdate")
        try:
            auth_update_payload = {}
            if obj_in.email:
                auth_update_payload["email"] = obj_in.email
            if obj_in.password:
                auth_update_payload["password"] = obj_in.password

            user_data_payload = {}
            if obj_in.full_name is not None:
                user_data_payload["full_name"] = obj_in.full_name
            # if obj_in.role is not None:
            #    user_data_payload['role'] = obj_in.role.value # if role is in user_metadata

            if user_data_payload:  # Add to user_metadata
                auth_update_payload["data"] = user_data_payload

            if auth_update_payload:
                # Note: Updating user via Supabase Auth requires the user to be authenticated.
                # This function assumes the `supabase` client has an active session for the user being updated OR it's a service role client that can update any user.
                # If it's a user-context update, the JWT should be set on the supabase client before calling this.
                auth_response = await supabase.auth.admin.update_user_by_id(
                    user_id, auth_update_payload
                )  # Use admin if service key
                # If using user context: await supabase.auth.update_user(auth_update_payload)
                if auth_response.user:
                    updated_user_data = auth_response.user.model_dump()
                    # If other fields (is_active, is_superuser) are in public.users table and need updating:
                    # table_update_payload = {}
                    # if obj_in.is_active is not None: table_update_payload['is_active'] = obj_in.is_active
                    # if obj_in.is_superuser is not None: table_update_payload['is_superuser'] = obj_in.is_superuser
                    # if table_update_payload:
                    #    await supabase.table("users").update(table_update_payload).eq("id", user_id).execute()
                    return updated_user_data
                else:
                    # logger.error(f"Supabase Auth user update failed for {user_id}: {auth_response.error.message if auth_response.error else 'No user data returned'}")
                    return None  # Or raise error
            # elif table_update_payload: # If only table fields were updated, not auth fields
            # await supabase.table("users").update(table_update_payload).eq("id", user_id).execute()
            # return await self.get(supabase, user_id) # Fetch and return updated user from table
            else:  # Nothing to update
                return await self.get(supabase, user_id)  # Return current user data

        except APIError as e:
            # logger.error(f"Supabase APIError during user update for {user_id}: {e.message}")
            if "User not found" in e.message:
                return None
            raise
        except Exception as e:
            # logger.error(f"Unexpected error during user update for {user_id}: {e}")
            raise
        return None

    async def authenticate(
        self, supabase: SupabaseClient, *, email: str, password: str
    ) -> Optional[Dict[str, Any]]:
        """Authenticates a user using Supabase Auth."""
        try:
            auth_response = await supabase.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            if auth_response.user:
                # Optionally, you can augment the user data with info from your public.users table if needed
                # user_details_from_table = await self.get(supabase, auth_response.user.id)
                # combined_user_data = {**auth_response.user.model_dump(), **(user_details_from_table or {})}
                # return combined_user_data
                return auth_response.user.model_dump()
            # logger.info(f"Authentication failed for {email}: {auth_response.error.message if auth_response.error else 'No user data'}")
            return None
        except APIError as e:
            # logger.warning(f"Supabase APIError during authentication for {email}: {e.message}")
            return None  # Common for auth errors like invalid credentials
        except Exception as e:
            # logger.error(f"Unexpected error during authentication for {email}: {e}")
            raise

    # is_active and is_superuser checks might be derived from user's JWT claims or user_metadata in a real scenario
    # These direct model checks are no longer applicable with Supabase Auth managing the user object.
    # def is_active(self, user_data: Dict[str, Any]) -> bool:
    #     """Checks if the user is active. Assumes 'is_active' key in user_data."""
    #     return user_data.get("is_active", True) # Default to True if not specified

    # def is_superuser(self, user_data: Dict[str, Any]) -> bool:
    #     """Checks if the user is a superuser. Assumes 'is_superuser' key in user_data or in app_metadata.role."""
    #     # Example: check app_metadata for a role
    #     # if user_data.get("app_metadata", {}).get("role") == "admin":
    #     #     return True
    #     return user_data.get("is_superuser", False)


user = CRUDUser()
