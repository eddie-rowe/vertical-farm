from fastapi import Request, HTTPException, status, Depends
from jose import jwt, JWTError
# Removed jose.utils import
import os
# Removed httpx import
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Dict, List, Tuple
# Removed time import

from app.core.config import settings
# Note: app.models.user, app.crud, app.db.supabase_client imports are moved lower

# --- JWKS Handling (REMOVED) ---
# jwks_cache: Optional[List[Dict[str, Any]]] = None
# jwks_cache_expiry: Optional[float] = None
# JWKS_CACHE_TTL_SECONDS = 60 * 60  # Cache JWKS for 1 hour

# async def get_jwks() -> List[Dict[str, Any]]:
#     ...

async def get_validated_supabase_token_payload(request: Request) -> Tuple[dict, str]: # Returns (payload, token_string)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = auth_header.split(" ", 1)[1]

    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured on the server."
        )

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET, # Use the shared secret
            algorithms=[settings.ALGORITHM],  # Use ALGORITHM from settings (HS256)
            audience=settings.SUPABASE_AUDIENCE or "authenticated", # Validate audience
            # Issuer check is less common/critical with HS256 if you trust the secret, 
            # but can be added if Supabase consistently provides it and you want an extra layer.
            # issuer=settings.SUPABASE_ISSUER 
        )
        return payload, token # Return payload and the original token string
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.JWTClaimsError as e: # More specific error for audience/issuer claims
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token claims validation failed: {str(e)}")
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or malformed token: {str(e)}",
        )

# --- Imports that might cause cycles if loaded before token validation functions are defined ---
# from app.models.user import User as UserModel # Remove this import
from app.crud import crud_user
# from app.db.supabase_client import get_async_supabase_client # Remove this top-level import
from supabase import AsyncClient as SupabaseAsyncClient # create_async_client removed as not used here directly
# from app.schemas.user import User # Remove this top-level import, will use string literal or local import


# --- User Retrieval and Token Creation (Uses above functions and imports) ---

async def get_current_active_user(
    token_data: Tuple[dict, str] = Depends(get_validated_supabase_token_payload),
    # db: SupabaseAsyncClient = Depends(get_async_supabase_client) # Remove Depends from here
) -> 'User': # Change return type to string literal 'User'
    from app.db.supabase_client import get_async_supabase_client # Import locally
    from app.schemas.user import User # Import User locally
    db: SupabaseAsyncClient = await get_async_supabase_client() # Get client instance

    payload, _ = token_data # Unpack tuple
    user_id_str = payload.get("sub") 
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Could not validate credentials, user ID (sub) missing from token payload"
        )
    
    # Ensure user_id is correctly formatted if it needs to be UUID
    # user_id_uuid = uuid.UUID(user_id_str) # If crud_user.get_user expects UUID
    
    user_data = await crud_user.user.get(supabase=db, id=user_id_str) # Use crud_user.user.get and pass supabase client as 'supabase'
    if user_data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id_str} not found")
    
    # Assuming user_data contains is_active, if not, this check needs adjustment
    # For Supabase, active status is usually implicit unless you have a specific 'is_active' column you manage
    # if not user_data.get("is_active", True): # Default to True if not present, or adjust as per your schema
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    # Convert dict to UserResponse Pydantic model
    # This assumes the keys in user_data match the fields in UserResponse
    # You might need to map fields if they don't match directly
    return User(**user_data)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # This function still uses settings.SECRET_KEY and settings.ALGORITHM for app-issued tokens
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Note: With HS256 validation for Supabase tokens, SUPABASE_JWKS_URI and SUPABASE_ISSUER settings become less critical for this part.
# SUPABASE_JWT_SECRET and SUPABASE_AUDIENCE are the main ones from settings used here.
