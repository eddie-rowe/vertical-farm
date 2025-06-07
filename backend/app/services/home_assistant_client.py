"""
Home Assistant Client Service

This service provides a comprehensive interface for communicating with Home Assistant
via both WebSocket and REST API, handling authentication, connection management,
and real-time updates.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
import aiohttp
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException
from asyncio_throttle import Throttler

logger = logging.getLogger(__name__)


class HomeAssistantClientError(Exception):
    """Base exception for Home Assistant client errors"""
    pass


class AuthenticationError(HomeAssistantClientError):
    """Raised when authentication fails"""
    pass


class ConnectionError(HomeAssistantClientError):
    """Raised when connection to Home Assistant fails"""
    pass


class HomeAssistantClient:
    """
    Home Assistant client with WebSocket and REST API support.
    
    Features:
    - WebSocket connection with automatic reconnection
    - REST API client with rate limiting
    - Authentication management
    - Real-time entity state updates
    - Caching layer for entity states
    - Error handling and recovery
    """
    
    def __init__(
        self,
        base_url: str,
        access_token: str,
        websocket_url: Optional[str] = None,
        max_retry_attempts: int = 5,
        retry_delay: float = 1.0,
        cache_ttl: int = 300,  # 5 minutes
        cloudflare_client_id: Optional[str] = None,
        cloudflare_client_secret: Optional[str] = None
    ):
        """
        Initialize Home Assistant client.
        
        Args:
            base_url: Home Assistant base URL (e.g., http://homeassistant.local:8123)
            access_token: Long-lived access token
            websocket_url: WebSocket URL (defaults to base_url/api/websocket)
            max_retry_attempts: Maximum number of retry attempts for connections
            retry_delay: Base delay between retry attempts (with exponential backoff)
            cache_ttl: Cache time-to-live in seconds
            cloudflare_client_id: Cloudflare service token client ID (if behind Cloudflare Access)
            cloudflare_client_secret: Cloudflare service token client secret (if behind Cloudflare Access)
        """
        self.base_url = base_url.rstrip('/')
        self.access_token = access_token
        self.websocket_url = websocket_url or f"{self.base_url.replace('http', 'ws')}/api/websocket"
        
        self.max_retry_attempts = max_retry_attempts
        self.retry_delay = retry_delay
        self.cache_ttl = cache_ttl
        
        # HTTP client setup
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Add Cloudflare service token headers if provided
        if cloudflare_client_id and cloudflare_client_secret:
            self.headers.update({
                "CF-Access-Client-Id": cloudflare_client_id,
                "CF-Access-Client-Secret": cloudflare_client_secret
            })
            logger.info("Cloudflare Access service token configured")
        
        # WebSocket connection state
        self.websocket = None
        self.connected = False
        self.message_id = 1
        self.subscribers: Dict[str, List[Callable]] = {}
        
        # Rate limiting
        self.throttler = Throttler(rate_limit=10, period=1)  # 10 requests per second
        
        # Entity state cache
        self.entity_cache: Dict[str, Dict] = {}
        self.cache_timestamps: Dict[str, datetime] = {}
        
        # Background tasks
        self.background_tasks: List[asyncio.Task] = []
        self.connection_task: Optional[asyncio.Task] = None
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()

    async def initialize(self):
        """Initialize the client and establish connections"""
        try:
            # Create HTTP session
            connector = aiohttp.TCPConnector(limit=100)
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(
                headers=self.headers,
                connector=connector,
                timeout=timeout
            )
            
            # Test authentication with a simple API call
            await self._test_authentication()
            
            # Start WebSocket connection
            self.connection_task = asyncio.create_task(self._maintain_websocket_connection())
            
            logger.info("Home Assistant client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Home Assistant client: {e}")
            await self.close()
            raise ConnectionError(f"Failed to initialize: {e}")

    async def close(self):
        """Close all connections and cleanup resources"""
        logger.info("Closing Home Assistant client...")
        
        # Cancel background tasks
        if self.connection_task:
            self.connection_task.cancel()
            try:
                await self.connection_task
            except asyncio.CancelledError:
                pass
        
        for task in self.background_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Close WebSocket
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
        
        # Close HTTP session
        if self.session:
            await self.session.close()
            self.session = None
        
        self.connected = False
        logger.info("Home Assistant client closed")

    async def _test_authentication(self):
        """Test authentication by making a simple API call"""
        try:
            async with self.session.get(f"{self.base_url}/api/") as response:
                if response.status == 401:
                    raise AuthenticationError("Invalid access token")
                elif response.status != 200:
                    raise ConnectionError(f"Authentication test failed with status {response.status}")
                
                data = await response.json()
                logger.info(f"Successfully authenticated with Home Assistant {data.get('version', 'unknown')}")
                
        except aiohttp.ClientError as e:
            raise ConnectionError(f"Failed to connect to Home Assistant: {e}")

    async def _maintain_websocket_connection(self):
        """Maintain WebSocket connection with automatic reconnection"""
        retry_count = 0
        
        while retry_count < self.max_retry_attempts:
            try:
                await self._connect_websocket()
                retry_count = 0  # Reset on successful connection
                
            except Exception as e:
                retry_count += 1
                delay = self.retry_delay * (2 ** (retry_count - 1))  # Exponential backoff
                
                logger.warning(
                    f"WebSocket connection failed (attempt {retry_count}/{self.max_retry_attempts}): {e}. "
                    f"Retrying in {delay} seconds..."
                )
                
                if retry_count < self.max_retry_attempts:
                    await asyncio.sleep(delay)
                else:
                    logger.error("Max retry attempts reached. WebSocket connection failed permanently.")
                    break

    async def _connect_websocket(self):
        """Establish WebSocket connection and handle messages"""
        logger.info(f"Connecting to WebSocket: {self.websocket_url}")
        
        try:
            # Prepare headers for WebSocket connection
            ws_headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Add Cloudflare headers if available (from self.headers)
            if hasattr(self, 'headers') and self.headers:
                if "CF-Access-Client-Id" in self.headers:
                    ws_headers["CF-Access-Client-Id"] = self.headers["CF-Access-Client-Id"]
                if "CF-Access-Client-Secret" in self.headers:
                    ws_headers["CF-Access-Client-Secret"] = self.headers["CF-Access-Client-Secret"]
            
            # Try different parameter names for compatibility
            try:
                self.websocket = await websockets.connect(
                    self.websocket_url,
                    additional_headers=ws_headers
                )
            except TypeError:
                # Fallback for older versions
                try:
                    self.websocket = await websockets.connect(
                        self.websocket_url,
                        extra_headers=ws_headers
                    )
                except TypeError:
                    # If all else fails, connect without custom headers
                    logger.warning("Unable to set WebSocket headers - connecting without authentication headers")
                    self.websocket = await websockets.connect(self.websocket_url)
            
            # Authentication handshake
            auth_message = await self.websocket.recv()
            auth_data = json.loads(auth_message)
            
            if auth_data.get("type") != "auth_required":
                raise AuthenticationError("Unexpected authentication message")
            
            # Send authentication
            await self.websocket.send(json.dumps({
                "type": "auth",
                "access_token": self.access_token
            }))
            
            # Wait for authentication result
            auth_result = await self.websocket.recv()
            auth_result_data = json.loads(auth_result)
            
            if auth_result_data.get("type") != "auth_ok":
                raise AuthenticationError("WebSocket authentication failed")
            
            self.connected = True
            logger.info("WebSocket connected and authenticated successfully")
            
            # Subscribe to state changes
            await self._subscribe_to_state_changes()
            
            # Handle incoming messages
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    await self._handle_websocket_message(data)
                except json.JSONDecodeError:
                    logger.warning(f"Received invalid JSON message: {message}")
                except Exception as e:
                    logger.error(f"Error handling WebSocket message: {e}")
                    
        except (ConnectionClosed, WebSocketException) as e:
            logger.warning(f"WebSocket connection lost: {e}")
            self.connected = False
            raise
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            self.connected = False
            raise

    async def _subscribe_to_state_changes(self):
        """Subscribe to entity state changes via WebSocket"""
        subscribe_message = {
            "id": self.message_id,
            "type": "subscribe_events",
            "event_type": "state_changed"
        }
        
        await self.websocket.send(json.dumps(subscribe_message))
        self.message_id += 1
        
        logger.info("Subscribed to state change events")

    async def _handle_websocket_message(self, data: Dict):
        """Handle incoming WebSocket messages"""
        message_type = data.get("type")
        
        if message_type == "event":
            await self._handle_state_change_event(data)
        elif message_type == "result":
            await self._handle_command_result(data)
        else:
            logger.debug(f"Received unhandled message type: {message_type}")

    async def _handle_state_change_event(self, data: Dict):
        """Handle state change events from WebSocket"""
        try:
            event_data = data.get("event", {})
            entity_id = event_data.get("data", {}).get("entity_id")
            new_state = event_data.get("data", {}).get("new_state")
            
            if entity_id and new_state:
                # Update cache
                self.entity_cache[entity_id] = new_state
                self.cache_timestamps[entity_id] = datetime.now()
                
                # Notify subscribers
                for callback in self.subscribers.get(entity_id, []):
                    try:
                        await callback(entity_id, new_state)
                    except Exception as e:
                        logger.error(f"Error in state change callback: {e}")
                
                logger.debug(f"Updated state for {entity_id}: {new_state.get('state')}")
                
        except Exception as e:
            logger.error(f"Error handling state change event: {e}")

    async def _handle_command_result(self, data: Dict):
        """Handle command results from WebSocket"""
        success = data.get("success", False)
        message_id = data.get("id")
        
        if success:
            logger.debug(f"Command {message_id} completed successfully")
        else:
            error = data.get("error", {})
            logger.warning(f"Command {message_id} failed: {error.get('message', 'Unknown error')}")

    # REST API Methods
    
    async def get_entities(self, entity_type: Optional[str] = None) -> List[Dict]:
        """
        Get all entities or entities of a specific type.
        
        Args:
            entity_type: Optional entity type filter (e.g., 'light', 'switch', 'sensor')
            
        Returns:
            List of entity dictionaries
        """
        try:
            # Create a temporary session if one doesn't exist
            session_to_use = self.session
            should_close_session = False
            
            if session_to_use is None:
                session_to_use = aiohttp.ClientSession(headers=self.headers)
                should_close_session = True
            
            try:
                async with self.throttler:
                    async with session_to_use.get(f"{self.base_url}/api/states") as response:
                        response.raise_for_status()
                        entities = await response.json()
                        
                        if entity_type:
                            entities = [e for e in entities if e.get("entity_id", "").startswith(f"{entity_type}.")]
                        
                        # Update cache
                        for entity in entities:
                            entity_id = entity.get("entity_id")
                            if entity_id:
                                self.entity_cache[entity_id] = entity
                                self.cache_timestamps[entity_id] = datetime.now()
                        
                        logger.debug(f"Retrieved {len(entities)} entities" + (f" of type {entity_type}" if entity_type else ""))
                        return entities
            finally:
                if should_close_session:
                    await session_to_use.close()
                    
        except aiohttp.ClientError as e:
            logger.error(f"Failed to get entities: {e}")
            raise ConnectionError(f"Failed to get entities: {e}")

    async def get_entity(self, entity_id: str, use_cache: bool = True) -> Optional[Dict]:
        """
        Get a specific entity by ID.
        
        Args:
            entity_id: Entity ID (e.g., 'light.kitchen')
            use_cache: Whether to use cached data if available
            
        Returns:
            Entity dictionary or None if not found
        """
        # Check cache first
        if use_cache and entity_id in self.entity_cache:
            cache_time = self.cache_timestamps.get(entity_id)
            if cache_time and (datetime.now() - cache_time).seconds < self.cache_ttl:
                logger.debug(f"Returning cached entity: {entity_id}")
                return self.entity_cache[entity_id]
        
        try:
            # Create a temporary session if one doesn't exist
            session_to_use = self.session
            should_close_session = False
            
            if session_to_use is None:
                session_to_use = aiohttp.ClientSession(headers=self.headers)
                should_close_session = True
            
            try:
                async with self.throttler:
                    async with session_to_use.get(f"{self.base_url}/api/states/{entity_id}") as response:
                        if response.status == 404:
                            logger.warning(f"Entity not found: {entity_id}")
                            return None
                        
                        response.raise_for_status()
                        entity = await response.json()
                        
                        # Update cache
                        self.entity_cache[entity_id] = entity
                        self.cache_timestamps[entity_id] = datetime.now()
                        
                        logger.debug(f"Retrieved entity: {entity_id}")
                        return entity
            finally:
                if should_close_session:
                    await session_to_use.close()
                    
        except aiohttp.ClientError as e:
            logger.error(f"Failed to get entity {entity_id}: {e}")
            raise ConnectionError(f"Failed to get entity {entity_id}: {e}")

    async def call_service(
        self,
        domain: str,
        service: str,
        entity_id: Optional[str] = None,
        data: Optional[Dict] = None
    ) -> Dict:
        """
        Call a Home Assistant service.
        
        Args:
            domain: Service domain (e.g., 'light', 'switch')
            service: Service name (e.g., 'turn_on', 'turn_off')
            entity_id: Target entity ID
            data: Additional service data
            
        Returns:
            Service call result
        """
        service_data = data.copy() if data else {}
        
        if entity_id:
            service_data["entity_id"] = entity_id
        
        try:
            # Create a temporary session if one doesn't exist
            session_to_use = self.session
            should_close_session = False
            
            if session_to_use is None:
                session_to_use = aiohttp.ClientSession(headers=self.headers)
                should_close_session = True
            
            try:
                async with self.throttler:
                    async with session_to_use.post(
                        f"{self.base_url}/api/services/{domain}/{service}",
                        json=service_data
                    ) as response:
                        response.raise_for_status()
                        result = await response.json()
                        
                        logger.info(f"Called service {domain}.{service}" + (f" on {entity_id}" if entity_id else ""))
                        return result
            finally:
                if should_close_session:
                    await session_to_use.close()
                    
        except aiohttp.ClientError as e:
            logger.error(f"Failed to call service {domain}.{service}: {e}")
            raise ConnectionError(f"Failed to call service {domain}.{service}: {e}")

    async def get_services(self) -> Dict:
        """Get all available services"""
        try:
            # Create a temporary session if one doesn't exist
            session_to_use = self.session
            should_close_session = False
            
            if session_to_use is None:
                session_to_use = aiohttp.ClientSession(headers=self.headers)
                should_close_session = True
            
            try:
                async with self.throttler:
                    async with session_to_use.get(f"{self.base_url}/api/services") as response:
                        response.raise_for_status()
                        services = await response.json()
                        
                        logger.debug("Retrieved available services")
                        return services
            finally:
                if should_close_session:
                    await session_to_use.close()
                    
        except aiohttp.ClientError as e:
            logger.error(f"Failed to get services: {e}")
            raise ConnectionError(f"Failed to get services: {e}")

    async def get_config(self) -> Dict:
        """Get Home Assistant configuration"""
        try:
            # Create a temporary session if one doesn't exist
            session_to_use = self.session
            should_close_session = False
            
            if session_to_use is None:
                session_to_use = aiohttp.ClientSession(headers=self.headers)
                should_close_session = True
            
            try:
                async with self.throttler:
                    async with session_to_use.get(f"{self.base_url}/api/config") as response:
                        response.raise_for_status()
                        config = await response.json()
                        
                        logger.debug("Retrieved Home Assistant configuration")
                        return config
            finally:
                if should_close_session:
                    await session_to_use.close()
                    
        except aiohttp.ClientError as e:
            logger.error(f"Failed to get config: {e}")
            raise ConnectionError(f"Failed to get config: {e}")

    # Subscription and Event Methods
    
    def subscribe_to_entity(self, entity_id: str, callback: Callable[[str, Dict], None]):
        """
        Subscribe to state changes for a specific entity.
        
        Args:
            entity_id: Entity ID to monitor
            callback: Async callback function to call on state changes
        """
        if entity_id not in self.subscribers:
            self.subscribers[entity_id] = []
        
        self.subscribers[entity_id].append(callback)
        logger.info(f"Subscribed to state changes for {entity_id}")

    def unsubscribe_from_entity(self, entity_id: str, callback: Callable[[str, Dict], None]):
        """
        Unsubscribe from state changes for a specific entity.
        
        Args:
            entity_id: Entity ID to stop monitoring
            callback: Callback function to remove
        """
        if entity_id in self.subscribers:
            try:
                self.subscribers[entity_id].remove(callback)
                if not self.subscribers[entity_id]:
                    del self.subscribers[entity_id]
                logger.info(f"Unsubscribed from state changes for {entity_id}")
            except ValueError:
                logger.warning(f"Callback not found for entity {entity_id}")

    # Utility Methods
    
    def is_connected(self) -> bool:
        """Check if WebSocket is connected"""
        return self.connected and self.websocket is not None

    def get_cached_entity(self, entity_id: str) -> Optional[Dict]:
        """Get entity from cache without making API call"""
        return self.entity_cache.get(entity_id)

    def clear_cache(self):
        """Clear entity cache"""
        self.entity_cache.clear()
        self.cache_timestamps.clear()
        logger.info("Entity cache cleared")

    async def health_check(self) -> Dict:
        """Perform a health check of the Home Assistant connection"""
        try:
            # Create a temporary session if one doesn't exist
            session_to_use = self.session
            should_close_session = False
            
            if session_to_use is None:
                session_to_use = aiohttp.ClientSession(headers=self.headers)
                should_close_session = True
            
            try:
                # Test REST API
                async with session_to_use.get(f"{self.base_url}/api/") as response:
                    rest_healthy = response.status == 200
                
                # Check WebSocket connection
                websocket_healthy = self.is_connected()
                
                return {
                    "healthy": rest_healthy and websocket_healthy,
                    "rest_api": rest_healthy,
                    "websocket": websocket_healthy,
                    "cached_entities": len(self.entity_cache),
                    "active_subscriptions": sum(len(callbacks) for callbacks in self.subscribers.values())
                }
            finally:
                if should_close_session:
                    await session_to_use.close()
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "healthy": False,
                "error": str(e),
                "rest_api": False,
                "websocket": False,
                "cached_entities": len(self.entity_cache),
                "active_subscriptions": sum(len(callbacks) for callbacks in self.subscribers.values())
            } 