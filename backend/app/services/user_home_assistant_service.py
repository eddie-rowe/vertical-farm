"""
User-specific Home Assistant Service Manager

This service manages per-user Home Assistant client instances and provides
user-isolated integration with the vertical farm system.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Set, Any
from datetime import datetime
from fastapi import HTTPException
from uuid import UUID

from app.core.config import get_settings
from app.services.home_assistant_client import (
    HomeAssistantClient,
    HomeAssistantClientError,
    AuthenticationError,
    ConnectionError as HAConnectionError
)
from app.db.supabase_client import get_async_supabase_client

logger = logging.getLogger(__name__)


class UserHomeAssistantService:
    """
    User-specific service for managing Home Assistant integration.
    
    This service creates and manages separate Home Assistant client instances
    for each user, providing complete isolation between users' devices and configurations.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.user_clients: Dict[str, HomeAssistantClient] = {}
        self.user_configs: Dict[str, Dict] = {}
        self.user_device_subscriptions: Dict[str, Set[str]] = {}
        self.user_device_cache: Dict[str, Dict[str, Dict]] = {}
        
    async def get_user_config(self, user_id: str, config_id: Optional[str] = None) -> Optional[Dict]:
        """
        Get user's Home Assistant configuration from database.
        
        Args:
            user_id: User ID
            config_id: Specific config ID, or None for default/active config
            
        Returns:
            Configuration dict or None if not found
        """
        try:
            db = await get_async_supabase_client()
            
            if config_id:
                # Get specific config by ID
                result = await db.from_("user_home_assistant_configs").select("*").eq("id", config_id).eq("user_id", user_id).execute()
                if result.data:
                    config = result.data[0]
                    # Map to expected format for client creation
                    return {
                        "id": config["id"],
                        "home_assistant_url": config["url"],  # Map url to home_assistant_url for client
                        "access_token": config["access_token"],
                        "friendly_name": config["name"],  # Map name to friendly_name
                        "cloudflare_client_id": config["cloudflare_client_id"],
                        "cloudflare_client_secret": config["cloudflare_client_secret"],
                        "cloudflare_access_protected": config["cloudflare_enabled"],  # Map cloudflare_enabled to cloudflare_access_protected
                        "is_active": config["is_default"] and config["enabled"],  # Map is_default and enabled to is_active
                        "enabled": config["enabled"]
                    }
            else:
                # Get default config first, then any enabled config
                result = await db.from_("user_home_assistant_configs").select("*").eq("user_id", user_id).eq("enabled", True).order("is_default", desc=True).order("created_at", desc=True).limit(1).execute()
                if result.data:
                    config = result.data[0]
                    # Map to expected format for client creation
                    return {
                        "id": config["id"],
                        "home_assistant_url": config["url"],  # Map url to home_assistant_url for client
                        "access_token": config["access_token"],
                        "friendly_name": config["name"],  # Map name to friendly_name
                        "cloudflare_client_id": config["cloudflare_client_id"],
                        "cloudflare_client_secret": config["cloudflare_client_secret"],
                        "cloudflare_access_protected": config["cloudflare_enabled"],  # Map cloudflare_enabled to cloudflare_access_protected
                        "is_active": config["enabled"],  # Just check if enabled, not necessarily default
                        "enabled": config["enabled"]
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user config for {user_id}: {e}")
            return None

    async def get_or_create_client(self, user_id: str, config_id: Optional[str] = None) -> Optional[HomeAssistantClient]:
        """
        Get or create a Home Assistant client for the specified user.
        
        Args:
            user_id: User ID
            config_id: Optional specific config ID
            
        Returns:
            HomeAssistantClient instance or None if no valid config
        """
        cache_key = f"{user_id}:{config_id or 'default'}"
        
        # Check if client already exists and is valid
        if cache_key in self.user_clients:
            client = self.user_clients[cache_key]
            if client and client.is_connected():
                return client
            else:
                # Remove invalid client
                if cache_key in self.user_clients:
                    del self.user_clients[cache_key]
                if cache_key in self.user_configs:
                    del self.user_configs[cache_key]
        
        # Get user configuration
        config = await self.get_user_config(user_id, config_id)
        if not config:
            logger.warning(f"No Home Assistant configuration found for user {user_id}")
            return None
        
        try:
            # Prepare client arguments
            client_kwargs = {
                "base_url": config["home_assistant_url"],
                "access_token": config["access_token"]
            }
            
            # Add Cloudflare service token if configured
            if (config.get("cloudflare_access_protected") and 
                config.get("cloudflare_client_id") and 
                config.get("cloudflare_client_secret")):
                client_kwargs.update({
                    "cloudflare_client_id": config["cloudflare_client_id"],
                    "cloudflare_client_secret": config["cloudflare_client_secret"]
                })
                logger.info(f"Configuring Home Assistant client for user {user_id} with Cloudflare Access protection")
            
            # Create client
            client = HomeAssistantClient(**client_kwargs)
            
            # Test connection
            async with client:
                health = await client.health_check()
                
                # Require REST API to work for basic functionality
                if not health.get("rest_api", False):
                    logger.error(f"Home Assistant REST API connection failed for user {user_id}: {health}")
                    await client.close()
                    return None
                
                # Cache the client and config
                self.user_clients[cache_key] = client
                self.user_configs[cache_key] = config
                
                # Initialize user-specific data structures
                if cache_key not in self.user_device_subscriptions:
                    self.user_device_subscriptions[cache_key] = set()
                if cache_key not in self.user_device_cache:
                    self.user_device_cache[cache_key] = {}
                
                logger.info(f"Successfully created Home Assistant client for user {user_id}")
                return client
                
        except Exception as e:
            logger.error(f"Failed to create Home Assistant client for user {user_id}: {e}")
            return None

    async def close_user_client(self, user_id: str, config_id: Optional[str] = None):
        """Close and cleanup a user's Home Assistant client"""
        cache_key = f"{user_id}:{config_id or 'default'}"
        
        if cache_key in self.user_clients:
            client = self.user_clients[cache_key]
            if client:
                await client.close()
            del self.user_clients[cache_key]
        
        # Cleanup related data
        if cache_key in self.user_configs:
            del self.user_configs[cache_key]
        if cache_key in self.user_device_subscriptions:
            del self.user_device_subscriptions[cache_key]
        if cache_key in self.user_device_cache:
            del self.user_device_cache[cache_key]
            
        logger.info(f"Closed Home Assistant client for user {user_id}")

    async def cleanup_all_clients(self):
        """Close all user clients and cleanup resources"""
        for cache_key, client in list(self.user_clients.items()):
            if client:
                await client.close()
        
        self.user_clients.clear()
        self.user_configs.clear()
        self.user_device_subscriptions.clear()
        self.user_device_cache.clear()
        
        logger.info("Closed all user Home Assistant clients")

    # Device Management Methods (User-Specific)
    
    async def get_user_devices(self, user_id: str, device_type: Optional[str] = None) -> List[Dict]:
        """Get all devices for a specific user"""
        client = await self.get_or_create_client(user_id)
        if not client:
            raise HTTPException(
                status_code=503,
                detail="Home Assistant integration not configured for this user"
            )
        
        try:
            if device_type:
                entities = await client.get_entities(entity_type=device_type)
            else:
                entities = await client.get_entities()
            
            # Filter for device types we care about
            relevant_entities = []
            for entity in entities:
                entity_id = entity.get("entity_id", "")
                domain = entity_id.split(".")[0] if "." in entity_id else ""
                
                if domain in ["light", "switch", "sensor", "fan", "cover", "climate"]:
                    relevant_entities.append(entity)
            
            logger.info(f"Retrieved {len(relevant_entities)} relevant devices for user {user_id}")
            return relevant_entities
            
        except HomeAssistantClientError as e:
            logger.error(f"Failed to get devices for user {user_id}: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    async def get_user_device(self, user_id: str, entity_id: str) -> Optional[Dict]:
        """Get a specific device for a user"""
        client = await self.get_or_create_client(user_id)
        if not client:
            raise HTTPException(
                status_code=503,
                detail="Home Assistant integration not configured for this user"
            )
        
        try:
            entity = await client.get_entity(entity_id)
            if entity:
                logger.debug(f"Retrieved device {entity_id} for user {user_id}")
            return entity
            
        except HomeAssistantClientError as e:
            logger.error(f"Failed to get device {entity_id} for user {user_id}: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    async def control_user_device(self, user_id: str, entity_id: str, action: str, **kwargs) -> Dict:
        """Control a device for a specific user"""
        client = await self.get_or_create_client(user_id)
        if not client:
            raise HTTPException(
                status_code=503,
                detail="Home Assistant integration not configured for this user"
            )
        
        domain = entity_id.split(".")[0] if "." in entity_id else ""
        
        if domain not in ["light", "switch", "fan", "cover"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot control device of type '{domain}'"
            )
        
        try:
            service_name = f"turn_{action}" if action in ["on", "off"] else action
            
            # Prepare service data
            service_data = {"entity_id": entity_id}
            service_data.update(kwargs)
            
            # Call the service
            result = await client.call_service(domain, service_name, service_data)
            
            logger.info(f"Successfully controlled device {entity_id} for user {user_id}: {action}")
            return {
                "success": True,
                "entity_id": entity_id,
                "action": action,
                "timestamp": datetime.now(),
                "result": result
            }
            
        except HomeAssistantClientError as e:
            logger.error(f"Failed to control device {entity_id} for user {user_id}: {e}")
            raise HTTPException(status_code=502, detail=f"Home Assistant error: {e}")

    async def test_user_connection(self, user_id: str, config: Dict) -> Dict:
        """Test Home Assistant connection for a user without saving"""
        try:
            # Prepare client arguments
            client_kwargs = {
                "base_url": config["url"],
                "access_token": config["access_token"]
            }
            
            # Add Cloudflare if configured
            if (config.get("cloudflare_enabled") and 
                config.get("cloudflare_client_id") and 
                config.get("cloudflare_client_secret")):
                client_kwargs.update({
                    "cloudflare_client_id": config["cloudflare_client_id"],
                    "cloudflare_client_secret": config["cloudflare_client_secret"]
                })
            
            # Create temporary client
            test_client = HomeAssistantClient(**client_kwargs)
            
            try:
                async with test_client:
                    # Perform health check
                    health = await test_client.health_check()
                    
                    # Get basic info
                    entities = await test_client.get_entities()
                    device_count = len([e for e in entities if e.get("entity_id", "").split(".")[0] in 
                                      ["light", "switch", "sensor", "fan", "cover", "climate"]])
                    
                    # Try to get version info
                    try:
                        ha_info = await test_client.get_ha_info()
                        version = ha_info.get("version", "Unknown")
                    except:
                        version = "Unknown"
                    
                    success = health.get("rest_api", False)
                    
                    return {
                        "success": success,
                        "url": config["url"],
                        "status": "Connected" if success else "Failed",
                        "message": "Connection successful" if success else "Connection failed",
                        "home_assistant_version": version if success else None,
                        "device_count": device_count if success else None,
                        "websocket_supported": health.get("websocket", False),
                        "rest_api_working": health.get("rest_api", False),
                        "cloudflare_working": config.get("cloudflare_enabled", False) and success,
                        "test_timestamp": datetime.now()
                    }
                    
            finally:
                await test_client.close()
                
        except Exception as e:
            logger.error(f"Connection test failed for user {user_id}: {e}")
            return {
                "success": False,
                "url": config["url"],
                "status": "Error",
                "message": f"Connection test failed: {str(e)}",
                "home_assistant_version": None,
                "device_count": None,
                "websocket_supported": False,
                "rest_api_working": False,
                "cloudflare_working": False,
                "test_timestamp": datetime.now(),
                "error_details": str(e)
            }

    async def get_user_integration_status(self, user_id: str) -> Dict:
        """Get integration status for a specific user"""
        cache_key = f"{user_id}:default"
        
        # Check if user has a client
        if cache_key not in self.user_clients:
            config = await self.get_user_config(user_id)
            if not config:
                return {
                    "enabled": False,
                    "initialized": False,
                    "healthy": False,
                    "rest_api": False,
                    "websocket": False,
                    "cached_entities": 0,
                    "subscribed_devices": 0,
                    "home_assistant_url": None,
                    "message": "No Home Assistant configuration found for user"
                }
        
        try:
            client = await self.get_or_create_client(user_id)
            if not client:
                return {
                    "enabled": False,
                    "initialized": False,
                    "healthy": False,
                    "rest_api": False,
                    "websocket": False,
                    "cached_entities": 0,
                    "subscribed_devices": 0,
                    "home_assistant_url": None,
                    "message": "Failed to create Home Assistant client"
                }
            
            # Get health status
            health = await client.health_check()
            config = self.user_configs.get(cache_key, {})
            
            return {
                "enabled": True,
                "initialized": True,
                "healthy": health.get("rest_api", False),
                "rest_api": health.get("rest_api", False),
                "websocket": health.get("websocket", False),
                "cached_entities": len(self.user_device_cache.get(cache_key, {})),
                "subscribed_devices": len(self.user_device_subscriptions.get(cache_key, set())),
                "home_assistant_url": config.get("home_assistant_url"),
                "message": "User-specific Home Assistant integration active"
            }
            
        except Exception as e:
            logger.error(f"Failed to get integration status for user {user_id}: {e}")
            return {
                "enabled": False,
                "initialized": False,
                "healthy": False,
                "rest_api": False,
                "websocket": False,
                "cached_entities": 0,
                "subscribed_devices": 0,
                "home_assistant_url": None,
                "message": f"Error getting status: {str(e)}"
            }


# Global instance
_user_ha_service: Optional[UserHomeAssistantService] = None


async def get_user_home_assistant_service() -> UserHomeAssistantService:
    """Get the global user Home Assistant service instance"""
    global _user_ha_service
    if _user_ha_service is None:
        _user_ha_service = UserHomeAssistantService()
    return _user_ha_service


async def startup_user_home_assistant_service():
    """Initialize the user Home Assistant service on startup"""
    global _user_ha_service
    _user_ha_service = UserHomeAssistantService()
    logger.info("User Home Assistant service started")


async def shutdown_user_home_assistant_service():
    """Cleanup the user Home Assistant service on shutdown"""
    global _user_ha_service
    if _user_ha_service:
        await _user_ha_service.cleanup_all_clients()
        _user_ha_service = None
    logger.info("User Home Assistant service shut down") 