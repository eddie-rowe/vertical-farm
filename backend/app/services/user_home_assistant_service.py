"""
User-specific Home Assistant Service Manager

This service manages per-user Home Assistant client instances and provides
user-isolated integration with the vertical farm system.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple, TYPE_CHECKING

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.security import (
    AuthenticationError,
    SessionExpiredError,
    is_token_expired,
    validate_websocket_token,
)
from app.db.supabase_client import get_async_supabase_client
from app.services.error_handling import global_error_handler
from app.services.home_assistant_client import HomeAssistantClient

if TYPE_CHECKING:
    from supabase import AClient as SupabaseAsyncClient

logger = logging.getLogger(__name__)


class UserHomeAssistantService:
    """
    Service for managing user-specific Home Assistant connections with enhanced session management.
    Leverages Supabase's built-in security features for credential storage and user isolation.
    """

    def __init__(self) -> None:
        self._connections: dict[str, HomeAssistantClient] = {}
        self._connection_health: dict[str, dict[str, Any]] = {}
        self.settings = get_settings()
        self.user_device_subscriptions: dict[str, set[str]] = {}
        self.user_device_cache: dict[str, dict[str, dict]] = {}

        # Register recovery callbacks with the global error handler
        global_error_handler.register_recovery_callback(
            "user_home_assistant", self._attempt_connection_recovery
        )

    async def _attempt_connection_recovery(self) -> None:
        """Automatic recovery for failing Home Assistant connections"""
        try:
            logger.info("Attempting automatic recovery of Home Assistant connections")

            # Check all existing connections and try to recover them
            failed_connections = []
            for user_id, connection in self._connections.items():
                health = self._connection_health.get(user_id, {})
                if health.get("status") != "healthy":
                    failed_connections.append(user_id)

            # Attempt to refresh failed connections
            for user_id in failed_connections:
                try:
                    await self.refresh_connection(user_id)
                    logger.info(f"Successfully recovered connection for user {user_id}")
                except Exception as e:
                    logger.warning(
                        f"Failed to recover connection for user {user_id}: {e}"
                    )

            # Clear old device caches
            current_time = datetime.now()
            for user_id in list(self.user_device_cache.keys()):
                cache = self.user_device_cache[user_id]
                if cache.get("timestamp"):
                    cache_age = (current_time - cache["timestamp"]).total_seconds()
                    if cache_age > 300:  # 5 minutes
                        del self.user_device_cache[user_id]
                        logger.debug(f"Cleared stale device cache for user {user_id}")

        except Exception as e:
            logger.error(f"Error during connection recovery: {e}")
            raise

    async def get_user_config(self, user_id: str) -> dict[str, Any] | None:
        """
        Get user's Home Assistant configuration from Supabase with RLS enforcement.

        Args:
            user_id: User ID from JWT token

        Returns:
            User configuration dict or None if not found
        """
        try:
            db: SupabaseAsyncClient = await get_async_supabase_client()

            # Supabase RLS will automatically filter to user's data
            response = (
                await db.table("user_home_assistant_configs")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )

            if response.data:
                config = response.data[0]
                logger.info(f"Retrieved HA config for user {user_id}")
                return config
            else:
                logger.info(f"No HA config found for user {user_id}")
                return None

        except Exception as e:
            logger.error(f"Error retrieving HA config for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve Home Assistant configuration: {str(e)}",
            )

    async def save_user_config(
        self, user_id: str, config: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Save user's Home Assistant configuration to Supabase with encryption.
        Leverages Supabase's built-in encryption at rest.

        Args:
            user_id: User ID from JWT token
            config: Configuration dictionary

        Returns:
            Saved configuration
        """
        try:
            db: SupabaseAsyncClient = await get_async_supabase_client()

            # Prepare config data - Supabase handles encryption at rest
            config_data = {
                "user_id": user_id,
                "url": config.get("url"),  # Fixed: use "url" to match database schema
                "access_token": config.get(
                    "access_token"
                ),  # Securely stored by Supabase
                "auth_type": config.get("auth_type", "bearer"),
                "cloudflare_client_id": config.get("cloudflare_client_id"),
                "cloudflare_client_secret": config.get("cloudflare_client_secret"),
                "is_active": config.get("is_active", True),
            }

            # Check if config exists (RLS enforces user isolation)
            existing = await self.get_user_config(user_id)

            if existing:
                # Update existing config
                response = (
                    await db.table("user_home_assistant_configs")
                    .update(config_data)
                    .eq("user_id", user_id)
                    .execute()
                )
                logger.info(f"Updated HA config for user {user_id}")
            else:
                # Insert new config
                response = (
                    await db.table("user_home_assistant_configs")
                    .insert(config_data)
                    .execute()
                )
                logger.info(f"Created new HA config for user {user_id}")

            if response.data:
                return response.data[0]
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to save Home Assistant configuration",
                )

        except Exception as e:
            logger.error(f"Error saving HA config for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save Home Assistant configuration: {str(e)}",
            )

    async def get_or_create_connection(
        self, user_id: str, session_token: str | None = None
    ) -> HomeAssistantClient:
        """
        Get or create a Home Assistant connection for the user with session validation.

        Args:
            user_id: User ID from JWT token
            session_token: Optional session token for additional validation

        Returns:
            HomeAssistantClient instance
        """
        # Validate session if token provided
        if session_token:
            try:
                if is_token_expired(session_token):
                    logger.warning(f"Session token expired for user {user_id}")
                    # Clean up any existing connections for this user
                    if user_id in self._connections:
                        await self._connections[user_id].close()
                        del self._connections[user_id]
                        del self._connection_health[user_id]

                    raise SessionExpiredError("Session expired, please refresh token")
            except Exception as e:
                logger.error(f"Token validation error for user {user_id}: {e}")
                raise AuthenticationError(f"Token validation failed: {str(e)}")

        # Check if we have an existing healthy connection
        if user_id in self._connections:
            connection = self._connections[user_id]
            health = self._connection_health.get(user_id, {})

            # Check connection health
            if health.get("status") == "healthy" and connection:
                logger.debug(f"Reusing existing HA connection for user {user_id}")
                return connection
            else:
                # Remove unhealthy connection
                logger.info(f"Removing unhealthy HA connection for user {user_id}")
                await connection.close()
                del self._connections[user_id]
                del self._connection_health[user_id]

        # Create new connection
        config = await self.get_user_config(user_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Home Assistant configuration not found. Please configure your Home Assistant connection first.",
            )

        if not config.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Home Assistant integration is disabled for this user",
            )

        try:
            # Create new client with config
            client = HomeAssistantClient(
                base_url=config["url"],  # Fixed: use "url" to match database schema
                access_token=config.get("access_token"),
                cloudflare_client_id=config.get("cloudflare_client_id"),
                cloudflare_client_secret=config.get("cloudflare_client_secret"),
            )

            # Test connection
            await client.get_entities()

            # Store connection and mark as healthy
            self._connections[user_id] = client
            self._connection_health[user_id] = {
                "status": "healthy",
                "last_check": asyncio.get_event_loop().time(),
                "user_id": user_id,
            }

            logger.info(f"Created new HA connection for user {user_id}")
            return client

        except Exception as e:
            logger.error(f"Failed to create HA connection for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to connect to Home Assistant: {str(e)}",
            )

    async def validate_websocket_session(
        self, token: str
    ) -> tuple[str, dict[str, Any]]:
        """
        Validate WebSocket session and return user info with session health.

        Args:
            token: JWT token from WebSocket connection

        Returns:
            Tuple of (user_id, session_health)
        """
        try:
            payload, session_health = await validate_websocket_token(token)
            user_id = payload.get("sub")

            if not user_id:
                raise AuthenticationError("User ID not found in token")

            return user_id, session_health

        except SessionExpiredError:
            raise AuthenticationError("WebSocket session expired")
        except Exception as e:
            logger.error(f"WebSocket session validation failed: {e}")
            raise AuthenticationError(f"Session validation failed: {str(e)}")

    async def get_connection_health(self, user_id: str) -> dict[str, Any]:
        """
        Get health status of user's Home Assistant connection.

        Args:
            user_id: User ID

        Returns:
            Health status dictionary
        """
        health_info = {
            "user_id": user_id,
            "connection_exists": user_id in self._connections,
            "connection_healthy": False,
            "last_activity": None,
            "config_exists": False,
        }

        # Check if config exists
        try:
            config = await self.get_user_config(user_id)
            health_info["config_exists"] = config is not None
        except Exception:
            pass  # Config check failed

        # Check connection health
        if user_id in self._connections:
            connection_health = self._connection_health.get(user_id, {})
            health_info.update(
                {
                    "connection_healthy": connection_health.get("status") == "healthy",
                    "last_activity": connection_health.get("last_check"),
                }
            )

        return health_info

    async def refresh_connection(self, user_id: str) -> HomeAssistantClient:
        """
        Force refresh of user's Home Assistant connection.

        Args:
            user_id: User ID

        Returns:
            New HomeAssistantClient instance
        """
        # Remove existing connection
        if user_id in self._connections:
            await self._connections[user_id].close()
            del self._connections[user_id]
            del self._connection_health[user_id]

        # Create new connection
        return await self.get_or_create_connection(user_id)

    async def cleanup_expired_connections(self) -> None:
        """
        Clean up expired or unhealthy connections.
        This method can be called periodically to maintain connection health.
        """
        current_time = asyncio.get_event_loop().time()
        expired_users = []

        for user_id, health in self._connection_health.items():
            # Consider connections stale after 1 hour of inactivity
            if current_time - health.get("last_check", 0) > 3600:
                expired_users.append(user_id)

        for user_id in expired_users:
            logger.info(f"Cleaning up expired HA connection for user {user_id}")
            if user_id in self._connections:
                await self._connections[user_id].close()
                del self._connections[user_id]
                del self._connection_health[user_id]

    async def get_user_devices(
        self, user_id: str, session_token: str | None = None
    ) -> list[dict[str, Any]]:
        """
        Get all devices/entities for a user with session validation and enhanced error handling.

        Args:
            user_id: User ID
            session_token: Optional session token for validation

        Returns:
            List of device/entity dictionaries
        """
        return await global_error_handler.execute_with_retry(
            "user_home_assistant",
            lambda: self._get_user_devices_impl(user_id, session_token),
            context={"user_id": user_id, "operation": "get_devices"},
        )

    async def _get_user_devices_impl(
        self, user_id: str, session_token: str | None = None
    ) -> list[dict[str, Any]]:
        """Implementation of get_user_devices with error handling"""
        # Check cache first
        cache_key = f"{user_id}_devices"
        if cache_key in self.user_device_cache:
            cache_data = self.user_device_cache[cache_key]
            cache_age = (datetime.now() - cache_data["timestamp"]).total_seconds()

            # Use cache if less than 5 minutes old
            if cache_age < 300:
                logger.debug(f"Using cached devices for user {user_id}")
                return cache_data["devices"]

        client = await self.get_or_create_connection(user_id, session_token)

        # Get all entities and filter for relevant device types
        states = await client.get_entities()

        # Filter for devices that can be controlled (switches, lights, etc.)
        relevant_domains = ["light", "switch", "fan", "valve", "cover"]
        devices = []

        for state in states:
            entity_id = state.get("entity_id", "")
            domain = entity_id.split(".")[0] if "." in entity_id else ""

            if domain in relevant_domains:
                devices.append(
                    {
                        "entity_id": entity_id,
                        "name": state.get("attributes", {}).get(
                            "friendly_name", entity_id
                        ),
                        "domain": domain,
                        "state": state.get("state"),
                        "attributes": state.get("attributes", {}),
                        "last_changed": state.get("last_changed"),
                        "last_updated": state.get("last_updated"),
                    }
                )

        # Update cache
        self.user_device_cache[cache_key] = {
            "devices": devices,
            "timestamp": datetime.now(),
        }

        logger.info(f"Retrieved {len(devices)} devices for user {user_id}")
        return devices

    async def get_user_device(
        self, user_id: str, entity_id: str, session_token: str | None = None
    ) -> dict[str, Any] | None:
        """
        Get a specific device/entity for a user with session validation.

        Args:
            user_id: User ID
            entity_id: Home Assistant entity ID
            session_token: Optional session token for validation

        Returns:
            Device/entity dictionary or None if not found
        """
        client = await self.get_or_create_connection(user_id, session_token)

        try:
            # Get the specific entity state
            state = await client.get_entity(entity_id)

            if not state:
                return None

            # Convert to consistent format
            domain = entity_id.split(".")[0] if "." in entity_id else ""

            device = {
                "entity_id": entity_id,
                "name": state.get("attributes", {}).get("friendly_name", entity_id),
                "domain": domain,
                "state": state.get("state"),
                "attributes": state.get("attributes", {}),
                "last_changed": state.get("last_changed"),
                "last_updated": state.get("last_updated"),
            }

            logger.info(f"Retrieved device {entity_id} for user {user_id}")
            return device

        except Exception as e:
            logger.error(f"Error retrieving device {entity_id} for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to retrieve device from Home Assistant: {str(e)}",
            )

    async def control_device(
        self,
        user_id: str,
        entity_id: str,
        action: str,
        session_token: str | None = None,
        **kwargs,
    ) -> dict[str, Any]:
        """
        Control a specific device with session validation and enhanced error handling.

        Args:
            user_id: User ID
            entity_id: Home Assistant entity ID
            action: Action to perform (turn_on, turn_off, toggle, etc.)
            session_token: Optional session token for validation
            **kwargs: Additional parameters for the action

        Returns:
            Action result dictionary
        """
        return await global_error_handler.execute_with_retry(
            "user_home_assistant",
            lambda: self._control_device_impl(
                user_id, entity_id, action, session_token, **kwargs
            ),
            context={"user_id": user_id, "entity_id": entity_id, "action": action},
        )

    async def _control_device_impl(
        self,
        user_id: str,
        entity_id: str,
        action: str,
        session_token: str | None = None,
        **kwargs,
    ) -> dict[str, Any]:
        """Implementation of control_device with error handling"""
        client = await self.get_or_create_connection(user_id, session_token)

        # Call service on the device
        domain = entity_id.split(".")[0] if "." in entity_id else "homeassistant"

        result = await client.call_service(
            domain=domain, service=action, entity_id=entity_id, **kwargs
        )

        logger.info(
            f"User {user_id} controlled device {entity_id} with action {action}"
        )
        from datetime import datetime

        return {
            "success": True,
            "entity_id": entity_id,
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
            "result": result,
        }

    async def get_user_integration_status(self, user_id: str) -> dict:
        """Get integration status for a specific user"""
        cache_key = f"{user_id}:default"

        # Check if user has a client
        if cache_key not in self._connections:
            config = await self.get_user_config(user_id)
            if not config:
                return {
                    "enabled": False,
                    "initialized": False,
                    "healthy": False,
                    "connected": False,
                    "rest_api": False,
                    "websocket": False,
                    "cached_entities": 0,
                    "subscribed_devices": 0,
                    "home_assistant_url": None,
                    "message": "No Home Assistant configuration found for user",
                }

        try:
            client = await self.get_or_create_connection(user_id)
            if not client:
                return {
                    "enabled": False,
                    "initialized": False,
                    "healthy": False,
                    "connected": False,
                    "rest_api": False,
                    "websocket": False,
                    "cached_entities": 0,
                    "subscribed_devices": 0,
                    "home_assistant_url": None,
                    "message": "Failed to create Home Assistant client",
                }

            # Get health status
            health = await client.health_check()
            config = await self.get_user_config(
                user_id
            )  # Get actual config instead of connection health

            # Extract health status from the complex health check response
            overall_healthy = health.get("overall_healthy", False)
            services = health.get("services", {})
            rest_api_healthy = (
                services.get("rest_api", {}).get("status") == "healthy"
                if "rest_api" in services
                else overall_healthy
            )
            websocket_healthy = (
                services.get("websocket", {}).get("status") == "healthy"
                if "websocket" in services
                else False
            )
            api_test_success = health.get("api_test", {}).get("status") == "success"

            # Use API test result as primary indicator of REST API health
            final_rest_api_status = (
                api_test_success if "api_test" in health else rest_api_healthy
            )

            return {
                "enabled": True,
                "initialized": True,
                "healthy": final_rest_api_status,
                "connected": final_rest_api_status,  # Add connected field for frontend compatibility
                "rest_api": final_rest_api_status,
                "websocket": websocket_healthy,
                "cached_entities": len(self.user_device_cache.get(cache_key, {})),
                "subscribed_devices": len(
                    self.user_device_subscriptions.get(cache_key, set())
                ),
                "home_assistant_url": (
                    config.get("url") if config else None
                ),  # Get URL from actual config
                "message": "User-specific Home Assistant integration active",
            }

        except Exception as e:
            logger.error(f"Failed to get integration status for user {user_id}: {e}")
            return {
                "enabled": False,
                "initialized": False,
                "healthy": False,
                "connected": False,
                "rest_api": False,
                "websocket": False,
                "cached_entities": 0,
                "subscribed_devices": 0,
                "home_assistant_url": None,
                "message": f"Error getting status: {str(e)}",
            }


# Global instance
_user_ha_service: UserHomeAssistantService | None = None


async def get_user_home_assistant_service() -> UserHomeAssistantService:
    """Get the global user Home Assistant service instance"""
    global _user_ha_service
    if _user_ha_service is None:
        _user_ha_service = UserHomeAssistantService()
    return _user_ha_service


async def startup_user_home_assistant_service() -> None:
    """Initialize the user Home Assistant service on startup"""
    global _user_ha_service
    _user_ha_service = UserHomeAssistantService()
    logger.info("User Home Assistant service started")


async def shutdown_user_home_assistant_service() -> None:
    """Cleanup the user Home Assistant service on shutdown"""
    global _user_ha_service
    if _user_ha_service:
        await _user_ha_service.cleanup_expired_connections()
        _user_ha_service = None
    logger.info("User Home Assistant service shut down")
