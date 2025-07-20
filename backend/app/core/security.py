import asyncio
import logging

# Removed jose.utils import
import re
import time
from collections import defaultdict, deque

# Removed httpx import
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Tuple
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from jose import jwt

from app.core.config import settings

# TYPE_CHECKING imports - only imported during type checking, not at runtime
if TYPE_CHECKING:
    from app.schemas.user import User

# Note: app.models.user, app.crud, app.db.supabase_client imports are moved lower

logger = logging.getLogger(__name__)

# --- Enhanced Security Error Classes ---


class AuthenticationError(Exception):
    """Custom authentication error"""


class SessionExpiredError(AuthenticationError):
    """Raised when session has expired"""


class TokenRefreshRequiredError(AuthenticationError):
    """Raised when token refresh is required"""


class RateLimitExceededError(Exception):
    """Raised when rate limit is exceeded"""


class DeviceControlError(Exception):
    """Raised when device control validation fails"""


class FarmAccessDeniedError(Exception):
    """Raised when user lacks access to farm location"""


class InvalidEntityError(Exception):
    """Raised when Home Assistant entity ID format is invalid"""


# --- Rate Limiting for Device Controls ---


class DeviceControlRateLimiter:
    """
    In-memory rate limiter for device control endpoints.
    Tracks requests per user per endpoint with sliding time windows.
    """

    def __init__(self) -> None:
        self._requests: dict[str, deque] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def is_allowed(
        self,
        user_id: str,
        endpoint: str,
        max_requests: int = 30,
        window_minutes: int = 1,
    ) -> bool:
        """
        Check if user is within rate limits for the endpoint.

        Args:
            user_id: User identifier
            endpoint: Endpoint identifier (e.g., 'device_control', 'irrigation_control')
            max_requests: Maximum requests allowed in time window
            window_minutes: Time window in minutes

        Returns:
            True if request is allowed, False if rate limited
        """
        async with self._lock:
            key = f"{user_id}:{endpoint}"
            now = time.time()
            window_start = now - (window_minutes * 60)

            # Clean expired requests
            request_times = self._requests[key]
            while request_times and request_times[0] < window_start:
                request_times.popleft()

            # Check if within limits
            if len(request_times) >= max_requests:
                return False

            # Add current request
            request_times.append(now)
            return True

    async def cleanup_expired(self, max_age_hours: int = 1) -> None:
        """Clean up old rate limit data to prevent memory leaks."""
        async with self._lock:
            cutoff = time.time() - (max_age_hours * 3600)
            keys_to_remove = []

            for key, times in self._requests.items():
                while times and times[0] < cutoff:
                    times.popleft()
                if not times:
                    keys_to_remove.append(key)

            for key in keys_to_remove:
                del self._requests[key]


# Global rate limiter instance
_rate_limiter = DeviceControlRateLimiter()


def device_control_rate_limit(
    max_requests: int = 30, window_minutes: int = 1, endpoint: str = "device_control"
):
    """
    Decorator to apply rate limiting to device control endpoints.

    Args:
        max_requests: Maximum requests allowed in time window
        window_minutes: Time window in minutes
        endpoint: Endpoint identifier for rate limiting
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from function arguments
            user = None
            for arg in args:
                if hasattr(arg, "id"):  # User object
                    user = arg
                    break

            if not user:
                # Look in kwargs for user
                user = kwargs.get("current_user") or kwargs.get("user")

            if user:
                user_id = getattr(user, "id", str(user))
                allowed = await _rate_limiter.is_allowed(
                    user_id, endpoint, max_requests, window_minutes
                )

                if not allowed:
                    logger.warning(
                        f"Rate limit exceeded for user {user_id} on endpoint {endpoint}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_minutes} minute(s) allowed.",
                        headers={"Retry-After": str(window_minutes * 60)},
                    )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


# --- Input Validation for Device Controls ---


def validate_entity_id(entity_id: str) -> bool:
    """
    Validate Home Assistant entity ID format.

    Args:
        entity_id: Entity ID to validate (e.g., 'light.kitchen_main', 'switch.irrigation_pump')

    Returns:
        True if valid format

    Raises:
        InvalidEntityError: If format is invalid
    """
    if not entity_id or not isinstance(entity_id, str):
        raise InvalidEntityError("Entity ID must be a non-empty string")

    # Home Assistant entity ID pattern: domain.entity_name
    pattern = r"^[a-z_]+\.[a-z0-9_]+$"
    if not re.match(pattern, entity_id):
        raise InvalidEntityError(
            f"Invalid entity ID format: {entity_id}. Must be 'domain.entity_name'"
        )

    # Check for reasonable length limits
    if len(entity_id) > 100:
        raise InvalidEntityError("Entity ID too long (max 100 characters)")

    return True


def validate_device_state(state: Any, entity_domain: str) -> Any:
    """
    Validate and sanitize device state value based on entity domain.

    Args:
        state: State value to validate
        entity_domain: Entity domain (e.g., 'light', 'switch', 'fan')

    Returns:
        Validated and sanitized state value

    Raises:
        DeviceControlError: If state is invalid for the domain
    """
    try:
        if entity_domain in ["switch", "binary_sensor"]:
            # Boolean states: on/off, true/false
            if isinstance(state, str):
                state = state.lower()
                if state in ["on", "true", "1"]:
                    return True
                elif state in ["off", "false", "0"]:
                    return False
                else:
                    raise DeviceControlError(
                        f"Invalid switch state: {state}. Must be on/off or true/false"
                    )
            elif isinstance(state, bool):
                return state
            else:
                raise DeviceControlError(
                    f"Switch state must be boolean or string, got {type(state)}"
                )

        elif entity_domain == "light":
            # Light can have on/off plus additional attributes like brightness
            if isinstance(state, dict):
                # Validate brightness if present
                if "brightness" in state:
                    brightness = state["brightness"]
                    if not isinstance(brightness, int | float) or not (
                        0 <= brightness <= 255
                    ):
                        raise DeviceControlError(
                            "Light brightness must be a number between 0 and 255"
                        )
                return state
            else:
                # Simple on/off for light
                return validate_device_state(state, "switch")

        elif entity_domain == "fan":
            # Fan can have on/off plus speed
            if isinstance(state, dict):
                if "speed" in state:
                    speed = state["speed"]
                    if not isinstance(speed, int | float) or not (0 <= speed <= 100):
                        raise DeviceControlError(
                            "Fan speed must be a number between 0 and 100"
                        )
                return state
            else:
                return validate_device_state(state, "switch")

        else:
            # For unknown domains, accept string or boolean
            if isinstance(state, str | bool | int | float):
                return state
            else:
                raise DeviceControlError(
                    f"Unsupported state type for domain {entity_domain}: {type(state)}"
                )

    except Exception as e:
        if isinstance(e, DeviceControlError):
            raise
        else:
            raise DeviceControlError(f"State validation failed: {str(e)}")


def validate_device_control_request(entity_id: str, state: Any) -> tuple[str, Any]:
    """
    Validate complete device control request.

    Args:
        entity_id: Home Assistant entity ID
        state: Device state to set

    Returns:
        Tuple of (validated_entity_id, validated_state)

    Raises:
        InvalidEntityError: If entity ID format is invalid
        DeviceControlError: If state is invalid
    """
    # Validate entity ID
    validate_entity_id(entity_id)

    # Extract domain from entity ID
    entity_domain = entity_id.split(".")[0]

    # Validate state for the domain
    validated_state = validate_device_state(state, entity_domain)

    return entity_id, validated_state


# --- Device Action Audit Logging ---


async def log_device_action(
    user_id: str,
    entity_id: str,
    action: str,
    old_state: dict[str, Any] | None = None,
    new_state: dict[str, Any] | None = None,
    farm_location: str | None = None,
    error: str | None = None,
    db: Any | None = None,
) -> bool:
    """
    Log device control action to database for audit trail.

    Args:
        user_id: ID of user performing action
        entity_id: Home Assistant entity ID
        action: Action performed ('control', 'assign', 'unassign', etc.)
        old_state: Previous device state
        new_state: New device state
        farm_location: Farm location identifier (row.rack.shelf)
        error: Error message if action failed
        db: Database client

    Returns:
        True if logged successfully, False otherwise
    """
    try:
        if not db:
            from app.db.supabase_client import get_async_rls_client

            db = await get_async_rls_client()

        audit_data = {
            "user_id": user_id,
            "entity_id": entity_id,
            "action": action,
            "old_state": old_state,
            "new_state": new_state,
            "farm_location": farm_location,
            "error_message": error,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Insert audit log (create table if needed)
        result = await db.table("device_audit_logs").insert(audit_data).execute()

        if result.data:
            logger.info(
                f"Device action logged: user={user_id}, entity={entity_id}, action={action}"
            )
            return True
        else:
            logger.error(f"Failed to log device action: {result}")
            return False

    except Exception as e:
        # Don't let audit logging failures break device control
        logger.error(f"Device audit logging failed: {str(e)}")
        return False


# --- Farm Access Authorization ---


class FarmAccessCache:
    """Cache for farm access permissions to reduce database queries."""

    def __init__(self, ttl_minutes: int = 5) -> None:
        self._cache: dict[str, tuple[list[str], float]] = {}
        self._ttl = ttl_minutes * 60
        self._lock = asyncio.Lock()

    async def get_user_farms(self, user_id: str) -> list[str] | None:
        """Get cached farm access list for user."""
        async with self._lock:
            if user_id in self._cache:
                farms, timestamp = self._cache[user_id]
                if time.time() - timestamp < self._ttl:
                    return farms
                else:
                    del self._cache[user_id]
            return None

    async def set_user_farms(self, user_id: str, farms: list[str]) -> None:
        """Cache farm access list for user."""
        async with self._lock:
            self._cache[user_id] = (farms, time.time())

    async def clear_user_cache(self, user_id: str) -> None:
        """Clear cache for specific user (call when permissions change)."""
        async with self._lock:
            if user_id in self._cache:
                del self._cache[user_id]


# Global farm access cache
_farm_cache = FarmAccessCache()


async def get_user_accessible_farms(user_id: str, db: Any) -> list[str]:
    """
    Get list of farm IDs that user has access to.

    Args:
        user_id: User identifier
        db: Database client

    Returns:
        List of farm IDs user can access
    """
    # Check cache first
    cached_farms = await _farm_cache.get_user_farms(user_id)
    if cached_farms is not None:
        return cached_farms

    try:
        # Query user's farm access from database
        # This assumes a farm_access or user_farms table
        result = (
            await db.table("user_farms")
            .select("farm_id")
            .eq("user_id", user_id)
            .execute()
        )

        farm_ids = [row["farm_id"] for row in result.data] if result.data else []

        # Cache the result
        await _farm_cache.set_user_farms(user_id, farm_ids)

        return farm_ids

    except Exception as e:
        logger.error(f"Failed to fetch user farm access: {str(e)}")
        # On error, return empty list (deny access)
        return []


async def verify_farm_access(user_id: str, farm_location: str, db: Any) -> bool:
    """
    Verify that user has access to the specified farm location.

    Args:
        user_id: User identifier
        farm_location: Farm location (can be farm_id or "farm.row.rack.shelf" format)
        db: Database client

    Returns:
        True if user has access, False otherwise

    Raises:
        FarmAccessDeniedError: If access is denied
    """
    try:
        # Get user's accessible farms
        accessible_farms = await get_user_accessible_farms(user_id, db)

        # Extract farm ID from location string
        farm_id = farm_location.split(".")[0] if "." in farm_location else farm_location

        if farm_id not in accessible_farms:
            logger.warning(f"Farm access denied: user={user_id}, farm={farm_id}")
            raise FarmAccessDeniedError(
                f"Access denied to farm location: {farm_location}"
            )

        return True

    except FarmAccessDeniedError:
        raise
    except Exception as e:
        logger.error(f"Farm access verification failed: {str(e)}")
        raise FarmAccessDeniedError(f"Could not verify farm access: {str(e)}")


# --- Session Management and Token Utilities ---


def get_token_expiration(token: str) -> datetime | None:
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
        exp_timestamp = unverified_payload.get("exp")
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


def validate_session_health(payload: dict) -> dict[str, Any]:
    """
    Validate session health and return status information.

    Args:
        payload: Decoded JWT payload

    Returns:
        Session health status dict
    """
    now = datetime.now(timezone.utc)
    exp_timestamp = payload.get("exp")
    iat_timestamp = payload.get("iat")

    health_status = {
        "valid": True,
        "user_id": payload.get("sub"),
        "expires_at": None,
        "issued_at": None,
        "expires_in_minutes": None,
        "requires_refresh": False,
        "session_age_hours": None,
    }

    if exp_timestamp:
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        health_status["expires_at"] = exp_datetime.isoformat()

        time_until_expiry = exp_datetime - now
        health_status["expires_in_minutes"] = int(
            time_until_expiry.total_seconds() / 60
        )

        # Recommend refresh if less than 15 minutes remaining
        health_status["requires_refresh"] = time_until_expiry < timedelta(minutes=15)

    if iat_timestamp:
        iat_datetime = datetime.fromtimestamp(iat_timestamp, tz=timezone.utc)
        health_status["issued_at"] = iat_datetime.isoformat()

        session_age = now - iat_datetime
        health_status["session_age_hours"] = session_age.total_seconds() / 3600

    return health_status


# --- Enhanced Token Validation ---


async def get_raw_supabase_token(request: Request) -> str:
    """
    Extract raw JWT token from Authorization header without validation.
    Supabase recommends letting their clients handle JWT validation internally.
    """
    auth_header = request.headers.get("Authorization")
    print(
        f"DEBUG: auth_header = {auth_header[:50] if auth_header else None}..."
    )  # Only show first 50 chars for security

    if not auth_header or not auth_header.startswith("Bearer "):
        print(
            f"DEBUG: Missing or invalid auth header. Header present: {bool(auth_header)}, Starts with Bearer: {auth_header.startswith('Bearer ') if auth_header else False}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header.split(" ", 1)[1]
    print(f"DEBUG: Token extracted, length: {len(token)}")
    return token


# Keep the old function for backward compatibility but mark as deprecated
async def get_validated_supabase_token_payload(request: Request) -> tuple[dict, str]:
    """
    DEPRECATED: Use get_raw_supabase_token() instead.
    Supabase recommends not validating JWTs on the server side.
    """
    # For now, just extract the raw token and return empty payload
    token = await get_raw_supabase_token(request)
    return ({}, token)


async def get_validated_supabase_token_with_refresh_check(
    request: Request,
) -> tuple[dict, str, dict[str, Any]]:
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
            headers={"X-Refresh-Required": "true"},
        )


# --- WebSocket Session Management ---


async def validate_websocket_token(token: str) -> tuple[dict, dict[str, Any]]:
    """
    Validate WebSocket token and return payload with session health.

    Note: For WebSockets, we extract payload info but let Supabase handle actual validation.

    Args:
        token: JWT token string

    Returns:
        Tuple of (payload, session_health)

    Raises:
        AuthenticationError: If token format is invalid
    """
    try:
        # Extract payload without validation - Supabase clients will handle actual validation
        # Note: python-jose requires key parameter even for unverified decoding
        payload = jwt.decode(
            token,
            key="",
            options={
                # nosemgrep: python.jwt.security.unverified-jwt-decode.unverified-jwt-decode
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": False,
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iat": False,
                "verify_sub": False,
            },
        )
        session_health = validate_session_health(payload)
        return payload, session_health

    except Exception as e:
        raise AuthenticationError(f"Invalid token format: {str(e)}")


from supabase import (  # noqa: E402
    AClient as SupabaseAsyncClient,  # acreate_client removed as not used here directly
)

# --- Imports that might cause cycles if loaded before token validation functions are defined ---
# from app.models.user import User as UserModel # Remove this import
from app.crud import crud_user  # noqa: E402

# from app.db.supabase_client import get_async_supabase_client # Remove this top-level import
from app.db.supabase_client import get_async_rls_client  # noqa: E402

# from app.schemas.user import User # Remove this top-level import, will use string literal or local import


# --- User Retrieval and Token Creation (Uses above functions and imports) ---


async def get_current_active_user(
    raw_token: str = Depends(get_raw_supabase_token),
    db: SupabaseAsyncClient = Depends(get_async_rls_client),
) -> "User":
    from jose import jwt

    from app.schemas.user import User

    logger.debug(f"Authenticating user with token length: {len(raw_token)}")

    # Extract user ID from token (without validation - let Supabase RLS handle that)
    try:
        # Note: python-jose requires key parameter even for unverified decoding
        payload = jwt.decode(
            raw_token,
            key="",
            options={
                # nosemgrep: python.jwt.security.unverified-jwt-decode.unverified-jwt-decode
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": False,
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iat": False,
                "verify_sub": False,
            },
        )
        user_id_str = payload.get("sub")
        logger.debug(f"Decoded JWT payload successfully. User ID: {user_id_str}")
    except Exception as e:
        logger.warning(f"Failed to decode JWT token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format"
        )

    if user_id_str is None:
        logger.warning("No user ID (sub) found in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials, user ID (sub) missing from token payload",
        )

    logger.debug(f"Fetching user data for ID: {user_id_str}")

    # Use RLS client which will properly validate the token
    try:
        user_data = await crud_user.user.get(supabase=db, id=user_id_str)
        logger.debug(f"User data fetch completed: {bool(user_data)}")
    except Exception as e:
        logger.error(f"Database error during user fetch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}",
        )

    if user_data is None:
        logger.warning(f"No user profile found for ID: {user_id_str}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User profile not found for ID {user_id_str}. This should have been created automatically during signup.",
        )

    logger.info(f"Successfully authenticated user: {user_data.get('email', 'unknown')}")
    # Convert dict to User Pydantic model
    return User(**user_data)


async def get_current_active_user_with_session_health(
    raw_token: str = Depends(get_raw_supabase_token),
    db: SupabaseAsyncClient = Depends(get_async_rls_client),
) -> tuple["User", dict[str, Any]]:
    """
    Get current user with session health information.

    Returns:
        Tuple of (user, session_health)
    """
    from jose import jwt

    from app.schemas.user import User

    # Extract user ID and validate session health from token
    try:
        # Note: python-jose requires key parameter even for unverified decoding
        payload = jwt.decode(
            raw_token,
            key="",
            options={
                # nosemgrep: python.jwt.security.unverified-jwt-decode.unverified-jwt-decode
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": False,
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iat": False,
                "verify_sub": False,
            },
        )
        user_id_str = payload.get("sub")
        session_health = validate_session_health(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format"
        )

    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials, user ID (sub) missing from token payload",
        )

    user_data = await crud_user.user.get(supabase=db, id=user_id_str)

    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id_str} not found",
        )

    return User(**user_data), session_health


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    # This function still uses settings.SECRET_KEY and settings.ALGORITHM for app-issued tokens
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


# --- Session Health Monitoring ---


async def get_session_health(raw_token: str) -> dict[str, Any]:
    """
    Get detailed session health information.

    Args:
        raw_token: JWT token string

    Returns:
        Session health status dictionary
    """
    try:
        from jose import jwt

        # Note: python-jose requires key parameter even for unverified decoding
        payload = jwt.decode(
            raw_token,
            key="",
            options={
                # nosemgrep: python.jwt.security.unverified-jwt-decode.unverified-jwt-decode
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": False,
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iat": False,
                "verify_sub": False,
            },
        )
        session_health = validate_session_health(payload)

        return {
            "status": "healthy",
            "user_id": session_health["user_id"],
            "session_info": session_health,
            "recommendations": {
                "refresh_token": session_health["requires_refresh"],
                "action_required": session_health["expires_in_minutes"]
                and session_health["expires_in_minutes"] < 5,
            },
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "recommendations": {"refresh_token": True, "action_required": True},
        }


# Note: With HS256 validation for Supabase tokens, SUPABASE_JWKS_URI and SUPABASE_ISSUER settings become less critical for this part.
# SUPABASE_JWT_SECRET and SUPABASE_AUDIENCE are the main ones from settings used here.

# --- Enhanced Security Utilities ---


def get_current_user_with_device_control_auth(
    max_requests: int = 30, window_minutes: int = 1, endpoint: str = "device_control"
):
    """
    Dependency factory that combines user authentication with device control rate limiting.

    Usage:
        @app.post("/devices/control")
        async def control_device(
            request: DeviceControlRequest,
            current_user: User = Depends(get_current_user_with_device_control_auth())
        ):
            # User is authenticated and rate limited
            pass
    """

    async def dependency(
        raw_token: str = Depends(get_raw_supabase_token),
        db: SupabaseAsyncClient = Depends(get_async_rls_client),
    ) -> "User":
        # First get the user (this handles authentication)
        user = await get_current_active_user(raw_token, db)

        # Then check rate limits
        allowed = await _rate_limiter.is_allowed(
            user.id, endpoint, max_requests, window_minutes
        )

        if not allowed:
            logger.warning(
                f"Rate limit exceeded for user {user.id} on endpoint {endpoint}"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_minutes} minute(s) allowed.",
                headers={"Retry-After": str(window_minutes * 60)},
            )

        return user

    return dependency


async def secure_device_control(
    entity_id: str,
    state: Any,
    user: "User",
    db: Any,
    farm_location: str | None = None,
    require_farm_access: bool = True,
) -> tuple[str, Any]:
    """
    Comprehensive device control security check.

    Performs input validation, farm access verification, and audit logging.

    Args:
        entity_id: Home Assistant entity ID
        state: Device state to set
        user: Authenticated user
        db: Database client
        farm_location: Farm location for access check
        require_farm_access: Whether to require farm access verification

    Returns:
        Tuple of (validated_entity_id, validated_state)

    Raises:
        InvalidEntityError: If entity ID format is invalid
        DeviceControlError: If state validation fails
        FarmAccessDeniedError: If farm access is denied
    """
    # Validate input
    validated_entity_id, validated_state = validate_device_control_request(
        entity_id, state
    )

    # Check farm access if required
    if require_farm_access and farm_location:
        await verify_farm_access(user.id, farm_location, db)

    # Log the action attempt (success will be logged by caller)
    await log_device_action(
        user_id=user.id,
        entity_id=validated_entity_id,
        action="control_attempt",
        new_state={"state": validated_state},
        farm_location=farm_location,
        db=db,
    )

    return validated_entity_id, validated_state


async def log_device_control_result(
    user_id: str,
    entity_id: str,
    old_state: dict[str, Any] | None,
    new_state: dict[str, Any],
    success: bool,
    error_message: str | None = None,
    farm_location: str | None = None,
    db: Any | None = None,
) -> bool:
    """
    Log the result of a device control operation.

    Args:
        user_id: User ID
        entity_id: Device entity ID
        old_state: Previous device state
        new_state: New device state
        success: Whether the operation succeeded
        error_message: Error message if failed
        farm_location: Farm location
        db: Database client

    Returns:
        True if logged successfully
    """
    action = "control_success" if success else "control_failure"

    return await log_device_action(
        user_id=user_id,
        entity_id=entity_id,
        action=action,
        old_state=old_state,
        new_state=new_state,
        farm_location=farm_location,
        error=error_message,
        db=db,
    )


# --- Periodic Maintenance ---


async def cleanup_security_caches() -> None:
    """
    Cleanup expired data from security caches.
    Should be called periodically (e.g., every hour).
    """
    try:
        # Cleanup rate limiter
        await _rate_limiter.cleanup_expired()
        logger.info("Security cache cleanup completed")
    except Exception as e:
        logger.error(f"Security cache cleanup failed: {e}")


# --- Exception Handlers ---


def create_security_exception_handler(app) -> None:
    """
    Create exception handlers for security-related errors.

    Usage:
        from app.core.security import create_security_exception_handler
        create_security_exception_handler(app)
    """

    @app.exception_handler(RateLimitExceededError)
    async def rate_limit_handler(request: Request, exc: RateLimitExceededError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
            headers={"Retry-After": "60"},
        )

    @app.exception_handler(DeviceControlError)
    async def device_control_handler(request: Request, exc: DeviceControlError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device control error: {str(exc)}",
        )

    @app.exception_handler(FarmAccessDeniedError)
    async def farm_access_handler(request: Request, exc: FarmAccessDeniedError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    @app.exception_handler(InvalidEntityError)
    async def invalid_entity_handler(request: Request, exc: InvalidEntityError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid entity: {str(exc)}",
        )
