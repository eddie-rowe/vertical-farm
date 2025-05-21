from fastapi import Request, HTTPException, status, Depends
from jose import jwt, JWTError
from jose.utils import base64url_decode # For JWKS kid matching
import os
import httpx # For fetching JWKS
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Dict, List, Tuple
import time # For JWKS cache expiry

from app.core.config import settings
# Note: app.models.user, app.crud, app.db.supabase_client imports are moved lower

# --- JWKS Handling (Moved Up) ---
jwks_cache: Optional[List[Dict[str, Any]]] = None
jwks_cache_expiry: Optional[float] = None
JWKS_CACHE_TTL_SECONDS = 60 * 60  # Cache JWKS for 1 hour

async def get_jwks() -> List[Dict[str, Any]]:
    global jwks_cache, jwks_cache_expiry
    current_time = time.monotonic()

    if settings.SUPABASE_JWKS_URI is None:
        raise HTTPException(status_code=500, detail="SUPABASE_JWKS_URI not configured")

    if jwks_cache is not None and jwks_cache_expiry is not None and current_time < jwks_cache_expiry:
        return jwks_cache

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(settings.SUPABASE_JWKS_URI)
            response.raise_for_status()
            jwks_data = response.json() # Ensure this is what Supabase returns
            actual_jwks_keys = jwks_data.get("keys", []) # Check if "keys" is the correct field
            if not isinstance(actual_jwks_keys, list):
                # Log error: unexpected JWKS format
                raise HTTPException(status_code=500, detail="Invalid JWKS format received from URI")

            jwks_cache = actual_jwks_keys
            jwks_cache_expiry = current_time + JWKS_CACHE_TTL_SECONDS
            return actual_jwks_keys
        except httpx.HTTPStatusError as e:
            # Log error e
            raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: HTTP Status Error - {e.request.url} - {e.response.status_code}")
        except Exception as e:
            # Log error e
            raise HTTPException(status_code=500, detail=f"An error occurred while fetching JWKS: {str(e)}")

async def get_validated_supabase_token_payload(request: Request) -> Tuple[dict, str]: # Returns (payload, token_string)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = auth_header.split(" ", 1)[1]

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header: Malformed")
    
    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 'kid' header missing")

    jwks = await get_jwks()
    rsa_key = {}
    for key_spec in jwks:
        if key_spec.get("kid") == kid: # Use .get for safety
            # Ensure all required fields for an RSA key are present
            if all(k in key_spec for k in ("kty", "n", "e")):
                 rsa_key = {
                    "kty": key_spec["kty"],
                    "kid": key_spec.get("kid"), # kid might be optional in some JWK formats, though expected here
                    "use": key_spec.get("use"), # use is optional
                    "n": key_spec["n"],
                    "e": key_spec["e"],
                }
                 break
            else:
                # Log error: key spec for kid is missing required RSA components
                pass # Continue searching for a valid key
    
    if not rsa_key:
        # Log error: no matching & valid key found in JWKS
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to find a valid corresponding JWS key for token 'kid'")

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"], 
            audience=settings.SUPABASE_AUDIENCE or "authenticated", # Use configured audience
            issuer=settings.SUPABASE_ISSUER # Verify issuer
        )
        return payload, token # Return payload and the original token string
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.JWTClaimsError as e: # More specific error for audience/issuer
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token claims validation failed: {str(e)}")
    except JWTError as e:
        # Log detailed error e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or malformed token during decode: {str(e)}",
        )

# --- Imports that might cause cycles if loaded before token validation functions are defined ---
from app.models.user import User as UserModel
from app.crud import crud_user
from app.db.supabase_client import get_async_supabase_client # This import is fine if db_client doesn't import from security's top level before validation funcs
from supabase import AsyncClient as SupabaseAsyncClient, create_async_client


# --- User Retrieval and Token Creation (Uses above functions and imports) ---

async def get_current_active_user(
    token_data: Tuple[dict, str] = Depends(get_validated_supabase_token_payload),
    db: SupabaseAsyncClient = Depends(get_async_supabase_client)
) -> UserModel:
    payload, _ = token_data # Unpack tuple
    user_id_str = payload.get("sub") 
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Could not validate credentials, user ID (sub) missing from token payload"
        )
    
    # Ensure user_id is correctly formatted if it needs to be UUID
    # user_id_uuid = uuid.UUID(user_id_str) # If crud_user.get_user expects UUID
    
    user = await crud_user.get_user(db=db, user_id=user_id_str) # Assuming get_user can handle string ID or converts it
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id_str} not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Ensure SUPABASE_AUDIENCE and SUPABASE_ISSUER are in your settings for robust validation.
# Example settings in config.py:
# SUPABASE_AUDIENCE: Optional[str] = os.getenv("SUPABASE_AUDIENCE") # e.g., 'authenticated' or your project_ref
# SUPABASE_ISSUER: Optional[str] = os.getenv("SUPABASE_ISSUER") # e.g., f"https://{project_ref}.supabase.co/auth/v1"
# SUPABASE_JWKS_URI: Optional[str] = os.getenv("SUPABASE_JWKS_URI") # e.g., f"https://{project_ref}.supabase.co/auth/v1/.well-known/jwks"
