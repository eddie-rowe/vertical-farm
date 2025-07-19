"""
Home Assistant Service Manager

This service manages the Home Assistant client lifecycle and provides
high-level integration with the vertical farm system.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import HTTPException

from app.core.config import get_settings
from app.services.home_assistant_client import AuthenticationError
from app.services.home_assistant_client import ConnectionError as HAConnectionError
from app.services.home_assistant_client import (
    HomeAssistantClient,
    HomeAssistantClientError,
)

logger = logging.getLogger(__name__)


class HomeAssistantService:
    """
    High-level service for managing Home Assistant integration.

    This service provides a layer of abstraction over the Home Assistant client
    and handles integration with the vertical farm's device management system.
    """

    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[HomeAssistantClient] = None
        self.initialized = False
        self.device_subscriptions: Set[str] = set()
        self.device_cache: Dict[str, Dict] = {}

    async def initialize(self) -> bool:
        """
        Initialize the Home Assistant service.

        Returns:
            True if initialization successful, False otherwise
        """
        if not self.settings.HOME_ASSISTANT_ENABLED:
            logger.info("Home Assistant integration is disabled")
            return False

        if (
            not self.settings.HOME_ASSISTANT_URL
            or not self.settings.HOME_ASSISTANT_TOKEN
        ):
            logger.warning("Home Assistant URL or token not configured")
            return False

        try:
            # Prepare client arguments
            client_kwargs = {
                "base_url": self.settings.HOME_ASSISTANT_URL,
                "access_token": self.settings.HOME_ASSISTANT_TOKEN,
            }

            # Add Cloudflare service token if configured
            if (
                self.settings.CLOUDFLARE_ACCESS_PROTECTED
                and self.settings.CLOUDFLARE_SERVICE_CLIENT_ID
                and self.settings.CLOUDFLARE_SERVICE_CLIENT_SECRET
            ):
                client_kwargs.update(
                    {
                        "cloudflare_client_id": self.settings.CLOUDFLARE_SERVICE_CLIENT_ID,
                        "cloudflare_client_secret": self.settings.CLOUDFLARE_SERVICE_CLIENT_SECRET,
                    }
                )
                logger.info(
                    "Configuring Home Assistant client with Cloudflare Access protection"
                )

            self.client = HomeAssistantClient(**client_kwargs)

            async with self.client:
                # Test connection and authentication
                health = await self.client.health_check()

                # Only require REST API to work for basic functionality
                if not health.get("rest_api", False):
                    logger.error(f"Home Assistant REST API connection failed: {health}")
                    return False

                # WebSocket connection is optional (may fail with Cloudflare proxy)
                if health.get("websocket", False):
                    logger.info(
                        "Home Assistant service initialized successfully with WebSocket support"
                    )
                else:
                    logger.warning(
                        "Home Assistant service initialized without WebSocket support (REST API only)"
                    )

                self.initialized = True
                return True

        except Exception as e:
            logger.error(f"Failed to initialize Home Assistant service: {e}")
            return False

    async def close(self):
        """Close the Home Assistant service and cleanup resources"""
        if self.client:
            await self.client.close()
            self.client = None

        self.initialized = False
        self.device_subscriptions.clear()
        self.device_cache.clear()
        logger.info("Home Assistant service closed")

    def is_enabled(self) -> bool:
        """Check if Home Assistant integration is enabled"""
        return self.settings.HOME_ASSISTANT_ENABLED and self.initialized

    def _ensure_initialized(self):
        """Ensure the service is initialized, raise error if not"""
        if not self.is_enabled():
            raise HTTPException(
                status_code=503,
                detail="Home Assistant integration is not enabled or initialized",
            )

    # Device Discovery and Management

    async def get_all_devices(self) -> List[Dict]:
        """Get all Home Assistant devices/entities"""
        self._ensure_initialized()

        try:
            entities = await self.client.get_entities()

            # Filter for device types we care about (lights, switches, sensors, etc.)
            relevant_entities = []
            for entity in entities:
                entity_id = entity.get("entity_id", "")
                domain = entity_id.split(".")[0] if "." in entity_id else ""

                if domain in ["light", "switch", "sensor", "fan", "cover", "climate"]:
                    relevant_entities.append(entity)

            logger.info(
                f"Retrieved {len(relevant_entities)} relevant devices from Home Assistant"
            )
            return relevant_entities

        except HomeAssistantClientError as e:
            logger.error(f"Failed to get devices: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    async def get_devices_by_type(self, device_type: str) -> List[Dict]:
        """
        Get devices of a specific type.

        Args:
            device_type: Device type (light, switch, sensor, fan, etc.)
        """
        self._ensure_initialized()

        try:
            entities = await self.client.get_entities(entity_type=device_type)
            logger.info(f"Retrieved {len(entities)} {device_type} devices")
            return entities

        except HomeAssistantClientError as e:
            logger.error(f"Failed to get {device_type} devices: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    async def get_device(self, entity_id: str) -> Optional[Dict]:
        """
        Get a specific device by entity ID.

        Args:
            entity_id: Home Assistant entity ID (e.g., 'light.kitchen')
        """
        self._ensure_initialized()

        try:
            entity = await self.client.get_entity(entity_id)
            if entity:
                logger.debug(f"Retrieved device: {entity_id}")
            return entity

        except HomeAssistantClientError as e:
            logger.error(f"Failed to get device {entity_id}: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    # Device Control Methods

    async def turn_on_device(self, entity_id: str, **kwargs) -> Dict:
        """
        Turn on a device (light, switch, etc.).

        Args:
            entity_id: Home Assistant entity ID
            **kwargs: Additional service call parameters (brightness, color, etc.)
        """
        self._ensure_initialized()

        domain = entity_id.split(".")[0] if "." in entity_id else ""

        if domain not in ["light", "switch", "fan", "cover"]:
            raise HTTPException(
                status_code=400, detail=f"Cannot turn on device of type '{domain}'"
            )

        try:
            result = await self.client.call_service(
                domain=domain, service="turn_on", entity_id=entity_id, data=kwargs
            )

            logger.info(f"Turned on device: {entity_id}")
            return {"success": True, "entity_id": entity_id, "action": "turn_on"}

        except HomeAssistantClientError as e:
            logger.error(f"Failed to turn on device {entity_id}: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    async def turn_off_device(self, entity_id: str) -> Dict:
        """
        Turn off a device (light, switch, etc.).

        Args:
            entity_id: Home Assistant entity ID
        """
        self._ensure_initialized()

        domain = entity_id.split(".")[0] if "." in entity_id else ""

        if domain not in ["light", "switch", "fan", "cover"]:
            raise HTTPException(
                status_code=400, detail=f"Cannot turn off device of type '{domain}'"
            )

        try:
            result = await self.client.call_service(
                domain=domain, service="turn_off", entity_id=entity_id
            )

            logger.info(f"Turned off device: {entity_id}")
            return {"success": True, "entity_id": entity_id, "action": "turn_off"}

        except HomeAssistantClientError as e:
            logger.error(f"Failed to turn off device {entity_id}: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    async def toggle_device(self, entity_id: str) -> Dict:
        """
        Toggle a device state.

        Args:
            entity_id: Home Assistant entity ID
        """
        self._ensure_initialized()

        domain = entity_id.split(".")[0] if "." in entity_id else ""

        if domain not in ["light", "switch", "fan"]:
            raise HTTPException(
                status_code=400, detail=f"Cannot toggle device of type '{domain}'"
            )

        try:
            result = await self.client.call_service(
                domain=domain, service="toggle", entity_id=entity_id
            )

            logger.info(f"Toggled device: {entity_id}")
            return {"success": True, "entity_id": entity_id, "action": "toggle"}

        except HomeAssistantClientError as e:
            logger.error(f"Failed to toggle device {entity_id}: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    # Specialized Device Control for Vertical Farm

    async def control_irrigation_solenoid(
        self, entity_id: str, action: str, duration_seconds: Optional[int] = None
    ) -> Dict:
        """
        Control irrigation solenoid valves.

        Args:
            entity_id: Solenoid entity ID
            action: 'open', 'close', or 'pulse'
            duration_seconds: For pulse action, how long to keep open
        """
        self._ensure_initialized()

        if action == "open":
            return await self.turn_on_device(entity_id)
        elif action == "close":
            return await self.turn_off_device(entity_id)
        elif action == "pulse" and duration_seconds:
            # Open valve, wait, then close
            await self.turn_on_device(entity_id)
            await asyncio.sleep(duration_seconds)
            await self.turn_off_device(entity_id)
            return {
                "success": True,
                "entity_id": entity_id,
                "action": "pulse",
                "duration": duration_seconds,
            }
        else:
            raise HTTPException(
                status_code=400, detail="Invalid action or missing duration for pulse"
            )

    async def control_grow_light(
        self,
        entity_id: str,
        action: str,
        brightness: Optional[int] = None,
        color_temp: Optional[int] = None,
    ) -> Dict:
        """
        Control grow lights with advanced settings.

        Args:
            entity_id: Light entity ID
            action: 'on', 'off', or 'set'
            brightness: Brightness level (0-255)
            color_temp: Color temperature in Kelvin
        """
        self._ensure_initialized()

        if action == "off":
            return await self.turn_off_device(entity_id)
        elif action in ["on", "set"]:
            kwargs = {}
            if brightness is not None:
                kwargs["brightness"] = max(0, min(255, brightness))
            if color_temp is not None:
                kwargs["color_temp"] = color_temp

            return await self.turn_on_device(entity_id, **kwargs)
        else:
            raise HTTPException(
                status_code=400, detail="Invalid action for light control"
            )

    # Real-time Monitoring

    async def subscribe_to_device_updates(self, entity_id: str):
        """Subscribe to real-time updates for a specific device"""
        self._ensure_initialized()

        if entity_id not in self.device_subscriptions:

            def callback(eid: str, state: Dict):
                self.device_cache[eid] = state
                logger.debug(f"Updated cached state for {eid}")

            self.client.subscribe_to_entity(entity_id, callback)
            self.device_subscriptions.add(entity_id)
            logger.info(f"Subscribed to updates for {entity_id}")

    async def unsubscribe_from_device_updates(self, entity_id: str):
        """Unsubscribe from real-time updates for a specific device"""
        if entity_id in self.device_subscriptions:
            # Note: This would need callback reference to properly unsubscribe
            # For now, just remove from our tracking
            self.device_subscriptions.discard(entity_id)
            logger.info(f"Unsubscribed from updates for {entity_id}")

    # Integration Status and Health

    async def get_integration_status(self) -> Dict:
        """Get current integration status and health information"""
        if not self.is_enabled():
            return {
                "enabled": False,
                "initialized": False,
                "healthy": False,
                "message": "Home Assistant integration is disabled",
            }

        try:
            health = await self.client.health_check()
            return {
                "enabled": True,
                "initialized": self.initialized,
                "healthy": health.get("healthy", False),
                "rest_api": health.get("rest_api", False),
                "websocket": health.get("websocket", False),
                "cached_entities": health.get("cached_entities", 0),
                "subscribed_devices": len(self.device_subscriptions),
                "home_assistant_url": self.settings.HOME_ASSISTANT_URL,
            }
        except Exception as e:
            logger.error(f"Failed to get integration status: {e}")
            return {
                "enabled": True,
                "initialized": self.initialized,
                "healthy": False,
                "error": str(e),
            }

    async def get_available_services(self) -> Dict:
        """Get all available Home Assistant services"""
        self._ensure_initialized()

        try:
            services = await self.client.get_services()

            # Filter for services relevant to device control
            relevant_services = {}
            for domain, domain_services in services.items():
                if domain in [
                    "light",
                    "switch",
                    "fan",
                    "cover",
                    "climate",
                    "homeassistant",
                ]:
                    relevant_services[domain] = domain_services

            return relevant_services

        except HomeAssistantClientError as e:
            logger.error(f"Failed to get services: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")


# Global Home Assistant service removed - now using user-specific UserHomeAssistantService
#
# The old global service has been replaced with per-user configurations.
# Use UserHomeAssistantService for all Home Assistant operations.
#
# Global service instance - REMOVED
# home_assistant_service = HomeAssistantService()
#
# Startup/shutdown functions - REMOVED (now user-specific)
