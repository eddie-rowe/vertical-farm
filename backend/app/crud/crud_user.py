from typing import Optional, Dict, Any, Union
from uuid import UUID
from supabase import AsyncClient as SupabaseClient # Use AsyncClient
from supabase.lib.client_options import ClientOptions
from httpx import HTTPStatusError
from gotrue.errors import AuthApiError as APIError
from pydantic import EmailStr

# from app.schemas import user as user_schema # Remove top-level import
from app.core.password_utils import get_password_hash, verify_password # Keep for direct password check if needed, though Supabase handles most auth
# from app.db.supabase_client import get_async_supabase_client # Client should be injected or handled by API layer

# import logging
# logger = logging.getLogger(__name__)

class CRUDUser:
    # Note: User operations are often handled by Supabase Auth.
    # These CRUD methods might interact with the 'users' table for custom data or act as wrappers.

    async def get(self, supabase: SupabaseClient, id: UUID) -> Optional[Dict[str, Any]]:
        """Fetches a user directly from the 'users' table. Useful if Supabase Auth user object is not sufficient."""
        try:
            response = await supabase.table("users").select("*").eq("id", str(id)).single().execute()
            return response.data
        except HTTPStatusError as e:
            if e.response.status_code == 406: # PostgREST Not Found
                return None
            # logger.error(f"Error fetching user {id} from table: {e}")
            raise
        except Exception as e:
            # logger.error(f"Unexpected error fetching user {id} from table: {e}")
            raise

    async def get_by_email(self, supabase: SupabaseClient, *, email: str) -> Optional[Dict[str, Any]]:
        """Fetches a user by email directly from the 'users' table."""
        try:
            response = await supabase.table("users").select("*").eq("email", email).single().execute()
            return response.data
        except HTTPStatusError as e:
            if e.response.status_code == 406:
                return None
            # logger.error(f"Error fetching user by email {email} from table: {e}")
            raise
        except Exception as e:
            # logger.error(f"Unexpected error fetching user by email {email} from table: {e}")
            raise

    async def create(self, supabase: SupabaseClient, *, obj_in: Any) -> Dict[str, Any]: # Use Any for obj_in type hint
        from app.schemas import user as user_schema # Import locally
        """Creates a new user using Supabase Auth and then potentially updates the users table with additional info."""
        if not isinstance(obj_in, user_schema.UserCreate):
            raise TypeError("obj_in must be an instance of UserCreate")
        try:
            # Supabase Auth handles password hashing.
            # user_metadata can store full_name, custom role, etc.
            options = {
                'data': {
                    'full_name': obj_in.full_name,
                    # 'role': obj_in.role.value if obj_in.role else None, # Example if role is an enum
                    # Add other custom fields to be stored in user_metadata or public.users table here
                }
            }
            if hasattr(obj_in, 'role') and obj_in.role:
                 options['data']['app_metadata'] = {'role': obj_in.role.value } # roles often in app_metadata

            auth_response = await supabase.auth.sign_up(
                {
                    "email": obj_in.email,
                    "password": obj_in.password,
                    "options": options
                }
            )

            if auth_response.user:
                # If sign_up is successful and returns a user object
                user_data = auth_response.user.model_dump()
                
                # If 'is_active' or 'is_superuser' are actual columns in your 'users' table 
                # not managed by Supabase Auth directly, you might need an update here.
                # However, these are often handled via RLS or custom claims.
                # For example, to update the public.users table after signup:
                # update_payload = {}
                # if hasattr(obj_in, 'is_active') and obj_in.is_active is not None:
                #    update_payload['is_active'] = obj_in.is_active
                # if hasattr(obj_in, 'is_superuser') and obj_in.is_superuser is not None:
                #    update_payload['is_superuser'] = obj_in.is_superuser
                # if update_payload:
                #    await supabase.table("users").update(update_payload).eq("id", auth_response.user.id).execute()

                # Combine auth response with any direct table data if necessary
                # For now, returning the auth user object model_dump
                return user_data
            elif auth_response.session:
                # This case might happen if user already exists but session is returned (e.g. auto-confirm off and sign-in)
                 # logger.warning(f"User sign up for {obj_in.email} returned session but no user object, might exist.")
                 # Consider this an error or handle as re-authentication
                 raise APIError(f"User already registered or confirmation required for {obj_in.email}", status_code=409) # 409 Conflict
            else:
                # logger.error(f"Supabase Auth sign_up failed for {obj_in.email}: {auth_response}")
                raise APIError(f"Failed to create user {obj_in.email}. Response: {auth_response.error.message if auth_response.error else 'Unknown error'}", status_code=500)

        except APIError as e:
            # logger.error(f"Supabase APIError during user creation for {obj_in.email}: {e.message}")
            raise # Re-raise APIError to be caught by FastAPI error handlers
        except Exception as e:
            # logger.error(f"Unexpected error during user creation for {obj_in.email}: {e}")
            raise

    async def update(
        self, supabase: SupabaseClient, *, user_id: UUID, obj_in: Any # Use Any for obj_in type hint
    ) -> Optional[Dict[str, Any]]:
        from app.schemas import user as user_schema # Import locally
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
                user_data_payload['full_name'] = obj_in.full_name
            # if obj_in.role is not None:
            #    user_data_payload['role'] = obj_in.role.value # if role is in user_metadata
            
            if user_data_payload: # Add to user_metadata
                auth_update_payload["data"] = user_data_payload

            if auth_update_payload:
                # Note: Updating user via Supabase Auth requires the user to be authenticated.
                # This function assumes the `supabase` client has an active session for the user being updated OR it's a service role client that can update any user.
                # If it's a user-context update, the JWT should be set on the supabase client before calling this.
                auth_response = await supabase.auth.admin.update_user_by_id(user_id, auth_update_payload) # Use admin if service key
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
                    return None # Or raise error
            # elif table_update_payload: # If only table fields were updated, not auth fields
                # await supabase.table("users").update(table_update_payload).eq("id", user_id).execute()
                # return await self.get(supabase, user_id) # Fetch and return updated user from table
            else: # Nothing to update
                return await self.get(supabase, user_id) # Return current user data

        except APIError as e:
            # logger.error(f"Supabase APIError during user update for {user_id}: {e.message}")
            if "User not found" in e.message:
                return None
            raise
        except Exception as e:
            # logger.error(f"Unexpected error during user update for {user_id}: {e}")
            raise
        return None

    async def authenticate(self, supabase: SupabaseClient, *, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticates a user using Supabase Auth."""
        try:
            auth_response = await supabase.auth.sign_in_with_password({"email": email, "password": password})
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
            return None # Common for auth errors like invalid credentials
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