"""
Home Assistant Client Service

This service provides a comprehensive interface for communicating with Home Assistant
via both WebSocket and REST API, handling authentication, connection management,
and real-time updates with enhanced error handling and recovery.
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

from .error_handling import (
    global_error_handler,
    ErrorType,
    HomeAssistantError,
    RetryConfig,
    CircuitBreakerConfig,
    with_error_handling
)

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
    - Enhanced error handling and recovery with circuit breaker
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
        
        # Enhanced error handling setup
        self._setup_error_handling()

    def _setup_error_handling(self):
        """Setup enhanced error handling for this client instance"""
        # Register custom retry configs for this client
        rest_config = RetryConfig(
            max_attempts=self.max_retry_attempts,
            base_delay=self.retry_delay,
            max_delay=60.0,
            retryable_errors=[
                ErrorType.CONNECTION_ERROR,
                ErrorType.TIMEOUT_ERROR,
                ErrorType.SERVICE_UNAVAILABLE,
                ErrorType.RATE_LIMIT_ERROR
            ]
        )
        
        websocket_config = RetryConfig(
            max_attempts=self.max_retry_attempts,
            base_delay=self.retry_delay * 2,  # Longer delay for WebSocket
            max_delay=120.0,
            retryable_errors=[
                ErrorType.CONNECTION_ERROR,
                ErrorType.TIMEOUT_ERROR,
                ErrorType.SERVICE_UNAVAILABLE
            ]
        )
        
        circuit_config = CircuitBreakerConfig(
            failure_threshold=5,
            recovery_timeout=60.0,
            success_threshold=3
        )
        
        # Register services with error handler
        global_error_handler.register_service(
            f"ha_rest_{id(self)}",
            rest_config,
            circuit_config
        )
        
        global_error_handler.register_service(
            f"ha_websocket_{id(self)}",
            websocket_config,
            circuit_config
        )
        
        # Add error callback for logging
        def error_callback(error: HomeAssistantError):
            logger.error(
                f"Home Assistant error: {error.message} "
                f"(Type: {error.error_type.value}, Retryable: {error.retryable})"
            )
            if error.context:
                logger.debug(f"Error context: {error.context}")
        
        global_error_handler.add_error_callback(error_callback)

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
            
            # Test authentication with enhanced error handling
            await self._test_authentication_with_retry()
            
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

    async def _test_authentication_with_retry(self):
        """Test authentication with enhanced error handling"""
        service_name = f"ha_rest_{id(self)}"
        
        async def auth_operation():
            async with self.session.get(f"{self.base_url}/api/") as response:
                if response.status == 401:
                    raise AuthenticationError("Invalid access token")
                elif response.status != 200:
                    raise ConnectionError(f"Authentication test failed with status {response.status}")
                
                data = await response.json()
                logger.info(f"Successfully authenticated with Home Assistant {data.get('version', 'unknown')}")
                return data
        
        try:
            return await global_error_handler.execute_with_retry(
                service_name,
                auth_operation,
                context={"operation": "authentication_test", "url": self.base_url}
            )
        except HomeAssistantError as e:
            if e.error_type == ErrorType.AUTHENTICATION_ERROR:
                raise AuthenticationError(e.message)
            else:
                raise ConnectionError(e.message)

    async def _maintain_websocket_connection(self):
        """Maintain WebSocket connection with enhanced error handling"""
        service_name = f"ha_websocket_{id(self)}"
        
        while True:
            try:
                await global_error_handler.execute_with_retry(
                    service_name,
                    self._connect_websocket,
                    context={"operation": "websocket_connection", "url": self.websocket_url}
                )
                # If we get here, connection was successful and closed normally
                break
                
            except HomeAssistantError as e:
                if e.error_type == ErrorType.AUTHENTICATION_ERROR:
                    logger.error("WebSocket authentication failed permanently")
                    break
                elif not global_error_handler.can_execute(service_name):
                    logger.error("WebSocket connection failed permanently (circuit breaker open)")
                    break
                else:
                    # Wait before trying again
                    await asyncio.sleep(30)
            except Exception as e:
                logger.error(f"Unexpected error in WebSocket maintenance: {e}")
                await asyncio.sleep(30)

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

    # REST API Methods with enhanced error handling
    
    async def get_entities(self, entity_type: Optional[str] = None) -> List[Dict]:
        """
        Get all entities or entities of a specific type with enhanced error handling.
        
        Args:
            entity_type: Optional entity type filter (e.g., 'light', 'switch', 'sensor')
            
        Returns:
            List of entity dictionaries
        """
        service_name = f"ha_rest_{id(self)}"
        
        async def get_entities_operation():
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
        
        return await global_error_handler.execute_with_retry(
            service_name,
            get_entities_operation,
            context={
                "operation": "get_entities",
                "entity_type": entity_type,
                "url": f"{self.base_url}/api/states"
            }
        )

    async def get_entity(self, entity_id: str, use_cache: bool = True) -> Optional[Dict]:
        """
        Get a specific entity by ID with enhanced error handling.
        
        Args:
            entity_id: Entity ID to retrieve
            use_cache: Whether to use cached data if available
            
        Returns:
            Entity dictionary or None if not found
        """
        # Check cache first if requested
        if use_cache and entity_id in self.entity_cache:
            cache_time = self.cache_timestamps.get(entity_id)
            if cache_time and (datetime.now() - cache_time).total_seconds() < self.cache_ttl:
                logger.debug(f"Returning cached entity: {entity_id}")
                return self.entity_cache[entity_id]
        
        service_name = f"ha_rest_{id(self)}"
        
        async def get_entity_operation():
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
                            logger.debug(f"Entity not found: {entity_id}")
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
        
        try:
            return await global_error_handler.execute_with_retry(
                service_name,
                get_entity_operation,
                context={
                    "operation": "get_entity",
                    "entity_id": entity_id,
                    "use_cache": use_cache,
                    "url": f"{self.base_url}/api/states/{entity_id}"
                }
            )
        except HomeAssistantError as e:
            if e.error_type == ErrorType.VALIDATION_ERROR:
                # Entity not found is not an error we should retry
                return None
            raise

    async def call_service(
        self,
        domain: str,
        service: str,
        entity_id: Optional[str] = None,
        data: Optional[Dict] = None
    ) -> Dict:
        """
        Call a Home Assistant service with enhanced error handling.
        
        Args:
            domain: Service domain (e.g., 'light', 'switch')
            service: Service name (e.g., 'turn_on', 'turn_off')
            entity_id: Optional entity ID to target
            data: Optional service data
            
        Returns:
            Service call result
        """
        service_name = f"ha_rest_{id(self)}"
        
        async def call_service_operation():
            # Create a temporary session if one doesn't exist
            session_to_use = self.session
            should_close_session = False
            
            if session_to_use is None:
                session_to_use = aiohttp.ClientSession(headers=self.headers)
                should_close_session = True
            
            try:
                # Prepare service call data
                service_data = data or {}
                if entity_id:
                    service_data["entity_id"] = entity_id
                
                async with self.throttler:
                    async with session_to_use.post(
                        f"{self.base_url}/api/services/{domain}/{service}",
                        json=service_data
                    ) as response:
                        response.raise_for_status()
                        result = await response.json()
                        
                        logger.debug(f"Called service {domain}.{service} for {entity_id or 'all entities'}")
                        return result
                        
            finally:
                if should_close_session:
                    await session_to_use.close()
        
        return await global_error_handler.execute_with_retry(
            service_name,
            call_service_operation,
            context={
                "operation": "call_service",
                "domain": domain,
                "service": service,
                "entity_id": entity_id,
                "data": data,
                "url": f"{self.base_url}/api/services/{domain}/{service}"
            }
        )

    async def get_services(self) -> Dict:
        """
        Get all available services with enhanced error handling.
        
        Returns:
            Dictionary of available services
        """
        service_name = f"ha_rest_{id(self)}"
        
        async def get_services_operation():
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
                        
                        logger.debug(f"Retrieved {len(services)} service domains")
                        return services
                        
            finally:
                if should_close_session:
                    await session_to_use.close()
        
        return await global_error_handler.execute_with_retry(
            service_name,
            get_services_operation,
            context={
                "operation": "get_services",
                "url": f"{self.base_url}/api/services"
            }
        )

    async def get_config(self) -> Dict:
        """
        Get Home Assistant configuration with enhanced error handling.
        
        Returns:
            Configuration dictionary
        """
        service_name = f"ha_rest_{id(self)}"
        
        async def get_config_operation():
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
        
        return await global_error_handler.execute_with_retry(
            service_name,
            get_config_operation,
            context={
                "operation": "get_config",
                "url": f"{self.base_url}/api/config"
            }
        )

    # Subscription and Event Methods
    
    def subscribe_to_entity(self, entity_id: str, callback: Callable[[str, Dict], None]):
        """
        Subscribe to entity state changes.
        
        Args:
            entity_id: Entity ID to subscribe to
            callback: Callback function to call on state changes
        """
        if entity_id not in self.subscribers:
            self.subscribers[entity_id] = []
        
        self.subscribers[entity_id].append(callback)
        logger.debug(f"Subscribed to entity: {entity_id}")

    def unsubscribe_from_entity(self, entity_id: str, callback: Callable[[str, Dict], None]):
        """
        Unsubscribe from entity state changes.
        
        Args:
            entity_id: Entity ID to unsubscribe from
            callback: Callback function to remove
        """
        if entity_id in self.subscribers:
            try:
                self.subscribers[entity_id].remove(callback)
                if not self.subscribers[entity_id]:
                    del self.subscribers[entity_id]
                logger.debug(f"Unsubscribed from entity: {entity_id}")
            except ValueError:
                logger.warning(f"Callback not found for entity: {entity_id}")

    # Utility Methods
    
    def is_connected(self) -> bool:
        """
        Check if the client is connected.
        
        Returns:
            True if connected, False otherwise
        """
        return self.connected and self.websocket is not None

    def get_cached_entity(self, entity_id: str) -> Optional[Dict]:
        """Get cached entity data without making API calls"""
        return self.entity_cache.get(entity_id)

    def clear_cache(self):
        """Clear the entity cache"""
        self.entity_cache.clear()
        self.cache_timestamps.clear()
        logger.debug("Entity cache cleared")

    async def health_check(self) -> Dict:
        """
        Perform a comprehensive health check with enhanced error reporting.
        
        Returns:
            Health status dictionary
        """
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "overall_healthy": True,
            "services": {},
            "connection_status": {
                "websocket": self.is_connected(),
                "http_session": self.session is not None and not self.session.closed
            },
            "cache_stats": {
                "cached_entities": len(self.entity_cache),
                "cache_size_bytes": sum(len(str(entity)) for entity in self.entity_cache.values())
            }
        }
        
        # Get error handler health for this client's services
        rest_service = f"ha_rest_{id(self)}"
        websocket_service = f"ha_websocket_{id(self)}"
        
        if rest_service in global_error_handler.metrics:
            health_status["services"]["rest_api"] = global_error_handler.get_service_health(rest_service)
            if health_status["services"]["rest_api"]["status"] != "healthy":
                health_status["overall_healthy"] = False
        
        if websocket_service in global_error_handler.metrics:
            health_status["services"]["websocket"] = global_error_handler.get_service_health(websocket_service)
            if health_status["services"]["websocket"]["status"] != "healthy":
                health_status["overall_healthy"] = False
        
        # Test basic connectivity
        try:
            await self.get_config()
            health_status["api_test"] = {"status": "success", "message": "API accessible"}
        except Exception as e:
            health_status["api_test"] = {"status": "failed", "message": str(e)}
            health_status["overall_healthy"] = False
        
        return health_status 