from fastapi import Request, HTTPException, status, Depends
from jose import jwt, JWTError
# Removed jose.utils import
import os
# Removed httpx import
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Dict, List, Tuple, TYPE_CHECKING
import logging
# Removed time import

from app.core.config import settings

# TYPE_CHECKING imports - only imported during type checking, not at runtime
if TYPE_CHECKING:
    from app.schemas.user import User

# Note: app.models.user, app.crud, app.db.supabase_client imports are moved lower

logger = logging.getLogger(__name__)

# --- Session Management and Token Utilities ---

class AuthenticationError(Exception):
    """Custom authentication error"""
    pass

class SessionExpiredError(AuthenticationError):
    """Raised when session has expired"""
    pass

class TokenRefreshRequiredError(AuthenticationError):
    """Raised when token refresh is required"""
    pass

def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Extract expiration time from JWT token without validation.
    
    Args:
        token: JWT token string
        
    Returns:
        Expiration datetime or None if not found
    """
    try:
        # Decode without verification to get claims
        unverified_payload = jwt.get_unverified_claims(token)
        exp_timestamp = unverified_payload.get('exp')
        if exp_timestamp:
            return datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    except Exception as e:
        logger.warning(f"Failed to extract token expiration: {e}")
    return None

def is_token_expired(token: str, buffer_minutes: int = 5) -> bool:
    """
    Check if token is expired or will expire within buffer time.
    
    Args:
        token: JWT token string
        buffer_minutes: Minutes of buffer time before actual expiration
        
    Returns:
        True if token is expired or will expire soon
    """
    expiration = get_token_expiration(token)
    if not expiration:
        return True  # Assume expired if we can't determine expiration
    
    buffer_time = datetime.now(timezone.utc) + timedelta(minutes=buffer_minutes)
    return expiration <= buffer_time

def validate_session_health(payload: dict) -> Dict[str, Any]:
    """
    Validate session health and return status information.
    
    Args:
        payload: Decoded JWT payload
        
    Returns:
        Session health status dict
    """
    now = datetime.now(timezone.utc)
    exp_timestamp = payload.get('exp')
    iat_timestamp = payload.get('iat')
    
    health_status = {
        "valid": True,
        "user_id": payload.get('sub'),
        "expires_at": None,
        "issued_at": None,
        "expires_in_minutes": None,
        "requires_refresh": False,
        "session_age_hours": None
    }
    
    if exp_timestamp:
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        health_status["expires_at"] = exp_datetime.isoformat()
        
        time_until_expiry = exp_datetime - now
        health_status["expires_in_minutes"] = int(time_until_expiry.total_seconds() / 60)
        
        # Recommend refresh if less than 15 minutes remaining
        health_status["requires_refresh"] = time_until_expiry < timedelta(minutes=15)
    
    if iat_timestamp:
        iat_datetime = datetime.fromtimestamp(iat_timestamp, tz=timezone.utc)
        health_status["issued_at"] = iat_datetime.isoformat()
        
        session_age = now - iat_datetime
        health_status["session_age_hours"] = session_age.total_seconds() / 3600
    
    return health_status

# --- Enhanced Token Validation ---

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
        
        # Validate session health
        session_health = validate_session_health(payload)
        if session_health["requires_refresh"]:
            logger.warning(f"Token for user {session_health['user_id']} requires refresh soon")
        
        return payload, token # Return payload and the original token string
    except jwt.ExpiredSignatureError:
        raise SessionExpiredError("Token has expired")
    except jwt.JWTClaimsError as e: # More specific error for audience/issuer claims
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token claims validation failed: {str(e)}")
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or malformed token: {str(e)}",
        )

async def get_validated_supabase_token_with_refresh_check(request: Request) -> Tuple[dict, str, Dict[str, Any]]:
    """
    Enhanced token validation that includes refresh recommendations.
    
    Returns:
        Tuple of (payload, token, session_health)
    """
    try:
        payload, token = await get_validated_supabase_token_payload(request)
        session_health = validate_session_health(payload)
        return payload, token, session_health
    except SessionExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please refresh your token.",
            headers={"X-Refresh-Required": "true"}
        )

# --- WebSocket Session Management ---

async def validate_websocket_token(token: str) -> Tuple[dict, Dict[str, Any]]:
    """
    Validate WebSocket token and return payload with session health.
    
    Args:
        token: JWT token string
        
    Returns:
        Tuple of (payload, session_health)
        
    Raises:
        AuthenticationError: If token is invalid or expired
    """
    if not settings.SUPABASE_JWT_SECRET:
        raise AuthenticationError("SUPABASE_JWT_SECRET is not configured")

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.ALGORITHM],
            audience=settings.SUPABASE_AUDIENCE or "authenticated"
        )
        
        session_health = validate_session_health(payload)
        return payload, session_health
        
    except jwt.ExpiredSignatureError:
        raise SessionExpiredError("WebSocket token has expired")
    except jwt.JWTClaimsError as e:
        raise AuthenticationError(f"Token claims validation failed: {str(e)}")
    except JWTError as e:
        raise AuthenticationError(f"Invalid or malformed token: {str(e)}")

# --- Imports that might cause cycles if loaded before token validation functions are defined ---
# from app.models.user import User as UserModel # Remove this import
from app.crud import crud_user
# from app.db.supabase_client import get_async_supabase_client # Remove this top-level import
from supabase import AClient as SupabaseAsyncClient # acreate_client removed as not used here directly
# from app.schemas.user import User # Remove this top-level import, will use string literal or local import


# --- User Retrieval and Token Creation (Uses above functions and imports) ---

async def get_current_active_user(
    token_data: Tuple[dict, str] = Depends(get_validated_supabase_token_payload),
    # db: SupabaseAsyncClient = Depends(get_async_supabase_client) # Remove Depends from here
) -> "User":
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
    
    # Get user data from user_profiles table
    user_data = await crud_user.user.get(supabase=db, id=user_id_str)
    
    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User profile not found for ID {user_id_str}. This should have been created automatically during signup."
        )
    
    # Convert dict to User Pydantic model
    return User(**user_data)

async def get_current_active_user_with_session_health(
    token_data: Tuple[dict, str, Dict[str, Any]] = Depends(get_validated_supabase_token_with_refresh_check),
) -> Tuple["User", Dict[str, Any]]:
    """
    Get current user with session health information.
    
    Returns:
        Tuple of (user, session_health)
    """
    from app.db.supabase_client import get_async_supabase_client
    from app.schemas.user import User
    
    payload, _, session_health = token_data
    user_id_str = payload.get("sub")
    
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials, user ID (sub) missing from token payload"
        )
    
    db: SupabaseAsyncClient = await get_async_supabase_client()
    user_data = await crud_user.user.get(supabase=db, id=user_id_str)
    
    if user_data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id_str} not found")
    
    return User(**user_data), session_health

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

# --- Session Health Monitoring ---

async def get_session_health(request: Request) -> Dict[str, Any]:
    """
    Get detailed session health information.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Session health status dictionary
    """
    try:
        payload, token, session_health = await get_validated_supabase_token_with_refresh_check(request)
        return {
            "status": "healthy",
            "user_id": session_health["user_id"],
            "session_info": session_health,
            "recommendations": {
                "refresh_token": session_health["requires_refresh"],
                "action_required": session_health["expires_in_minutes"] and session_health["expires_in_minutes"] < 5
            }
        }
    except HTTPException as e:
        return {
            "status": "unhealthy",
            "error": e.detail,
            "recommendations": {
                "refresh_token": True,
                "action_required": True
            }
        }

# Note: With HS256 validation for Supabase tokens, SUPABASE_JWKS_URI and SUPABASE_ISSUER settings become less critical for this part.
# SUPABASE_JWT_SECRET and SUPABASE_AUDIENCE are the main ones from settings used here.
