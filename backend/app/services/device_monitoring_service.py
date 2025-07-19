"""
Device Monitoring Service for Layer One
Handles device assignments, state caching, and WebSocket connections
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Any, Tuple
import uuid
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from supabase import Client

# TODO: Replace with Supabase native queuing/caching when implementing real-time features

from .home_assistant_client import HomeAssistantClient
from .database_service import DatabaseService

logger = logging.getLogger(__name__)


class DeviceType(str, Enum):
    LIGHT = "light"
    PUMP = "pump"
    FAN = "fan"
    SENSOR = "sensor"


class DeviceState(str, Enum):
    ON = "on"
    OFF = "off"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


class DeviceMonitoringService:
    """Service for managing device monitoring, control, and WebSocket connections"""

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
        # TODO: Replace with Supabase Realtime subscriptions for real-time state updates
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # user_id -> websockets
        self.ha_clients: Dict[str, HomeAssistantClient] = {}  # user_id -> HA client
        self.running = False

    async def start(self):
        """Start the device monitoring service"""
        self.running = True
        logger.info("Device monitoring service started")

    async def stop(self):
        """Stop the device monitoring service"""
        self.running = False
        # Close all WebSocket connections
        for user_id, websockets in self.active_connections.items():
            for ws in websockets.copy():
                try:
                    await ws.close()
                except:
                    pass
        self.active_connections.clear()
        logger.info("Device monitoring service stopped")

    async def connect_websocket(self, websocket: WebSocket, user_id: str):
        """Connect a WebSocket for a user"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}")

        # Send current connection status
        await self.send_to_user(
            user_id,
            {
                "type": "connection_status",
                "data": {"status": "connected", "user_id": user_id},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        # Start device state monitoring for this user if not already running
        if user_id not in self.ha_clients:
            await self.start_user_monitoring(user_id)

    async def disconnect_websocket(self, websocket: WebSocket, user_id: str):
        """Disconnect a WebSocket for a user"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # Stop monitoring if no more connections
                await self.stop_user_monitoring(user_id)

        logger.info(f"WebSocket disconnected for user {user_id}")

    async def start_user_monitoring(self, user_id: str):
        """Start monitoring devices for a specific user"""
        try:
            # Get user's Home Assistant config
            ha_config = await self.db_service.get_user_default_ha_config(user_id)
            if not ha_config:
                logger.warning(f"No Home Assistant config found for user {user_id}")
                return

            # Create HA client
            ha_client = HomeAssistantClient(
                url=ha_config["url"], token=ha_config["access_token"]
            )

            # Test connection
            if not await ha_client.test_connection():
                logger.error(f"Failed to connect to Home Assistant for user {user_id}")
                return

            self.ha_clients[user_id] = ha_client

            # Start monitoring task
            asyncio.create_task(self.monitor_user_devices(user_id))

        except Exception as e:
            logger.error(f"Error starting monitoring for user {user_id}: {e}")

    async def stop_user_monitoring(self, user_id: str):
        """Stop monitoring devices for a specific user"""
        if user_id in self.ha_clients:
            try:
                await self.ha_clients[user_id].close()
            except:
                pass
            del self.ha_clients[user_id]

        logger.info(f"Stopped device monitoring for user {user_id}")

    async def monitor_user_devices(self, user_id: str):
        """Monitor devices for a specific user"""
        try:
            ha_client = self.ha_clients.get(user_id)
            if not ha_client:
                return

            # Get user's device assignments
            device_assignments = await self.get_user_device_assignments(user_id)
            entity_ids = [
                assignment["home_assistant_entity_id"]
                for assignment in device_assignments
            ]

            if not entity_ids:
                logger.info(f"No device assignments found for user {user_id}")
                return

            # Subscribe to state changes
            await ha_client.subscribe_to_state_changes(
                entity_ids=entity_ids,
                callback=lambda entity_id, old_state, new_state: asyncio.create_task(
                    self.handle_device_state_change(
                        user_id, entity_id, old_state, new_state
                    )
                ),
            )

        except Exception as e:
            logger.error(f"Error monitoring devices for user {user_id}: {e}")

    async def handle_device_state_change(
        self, user_id: str, entity_id: str, old_state: dict, new_state: dict
    ):
        """Handle device state changes from Home Assistant"""
        try:
            # Extract state and attributes
            state = new_state.get("state", DeviceState.UNKNOWN)
            attributes = new_state.get("attributes", {})

            # Update database directly (no caching layer)
            # TODO: Consider using Supabase Realtime for instant state propagation
            await self.update_device_state_db(user_id, entity_id, state, attributes)

            # Broadcast to WebSocket clients
            await self.send_to_user(
                user_id,
                {
                    "type": "device_state_update",
                    "data": {
                        "entity_id": entity_id,
                        "state": state,
                        "attributes": attributes,
                        "last_changed": new_state.get("last_changed"),
                        "last_updated": new_state.get("last_updated"),
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )

        except Exception as e:
            logger.error(f"Error handling state change for {entity_id}: {e}")

    # Removed: Redis-based caching - will use Supabase native caching/realtime capabilities

    async def update_device_state_db(
        self, user_id: str, entity_id: str, state: str, attributes: dict
    ):
        """Update device state in database"""
        try:
            supabase = self.db_service.get_supabase_client()

            # Use the stored procedure we created
            result = supabase.rpc(
                "update_device_state",
                {
                    "p_user_id": user_id,
                    "p_entity_id": entity_id,
                    "p_state": state,
                    "p_attributes": attributes,
                },
            ).execute()

        except Exception as e:
            logger.error(f"Error updating device state in database: {e}")

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to all WebSocket connections for a user"""
        if user_id not in self.active_connections:
            return

        disconnected_websockets = []
        for websocket in self.active_connections[user_id].copy():
            try:
                await websocket.send_text(json.dumps(message))
            except WebSocketDisconnect:
                disconnected_websockets.append(websocket)
            except Exception as e:
                logger.error(f"Error sending message to websocket: {e}")
                disconnected_websockets.append(websocket)

        # Remove disconnected websockets
        for ws in disconnected_websockets:
            self.active_connections[user_id].discard(ws)

    async def get_user_device_assignments(self, user_id: str) -> List[Dict]:
        """Get all device assignments for a user"""
        try:
            supabase = self.db_service.get_supabase_client()

            result = (
                supabase.table("device_assignments")
                .select("*")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .execute()
            )

            return result.data or []

        except Exception as e:
            logger.error(f"Error getting device assignments: {e}")
            return []

    async def get_location_devices(self, user_id: str, location_id: str) -> List[Dict]:
        """Get devices assigned to a specific location"""
        try:
            supabase = self.db_service.get_supabase_client()

            result = supabase.rpc(
                "get_location_devices",
                {"p_user_id": user_id, "p_location_id": location_id},
            ).execute()

            return result.data or []

        except Exception as e:
            logger.error(f"Error getting location devices: {e}")
            return []

    async def control_device(self, user_id: str, entity_id: str, action: Dict) -> Dict:
        """Control a device through Home Assistant"""
        try:
            ha_client = self.ha_clients.get(user_id)
            if not ha_client:
                raise HTTPException(
                    status_code=503, detail="Home Assistant not connected"
                )

            # Get current state for history
            current_state = await self.get_device_current_state(user_id, entity_id)

            # Execute action
            success = False
            error_message = None
            new_state = None

            try:
                if action["type"] == "turn_on":
                    success = await ha_client.turn_on(entity_id, action.get("data", {}))
                elif action["type"] == "turn_off":
                    success = await ha_client.turn_off(entity_id)
                elif action["type"] == "toggle":
                    success = await ha_client.toggle(entity_id)
                elif action["type"] == "set_brightness":
                    success = await ha_client.set_brightness(
                        entity_id, action["brightness"]
                    )
                elif action["type"] == "set_color":
                    success = await ha_client.set_color(entity_id, action["rgb_color"])
                elif action["type"] == "set_speed":
                    success = await ha_client.set_speed(entity_id, action["speed"])
                else:
                    raise ValueError(f"Unknown action type: {action['type']}")

                if success:
                    # Get new state
                    new_state_data = await ha_client.get_state(entity_id)
                    new_state = new_state_data.get("state") if new_state_data else None

            except Exception as e:
                success = False
                error_message = str(e)

            # Log control action
            await self.log_device_control(
                user_id=user_id,
                entity_id=entity_id,
                action_type=action["type"],
                previous_state=current_state,
                new_state=new_state,
                success=success,
                error_message=error_message,
            )

            # Send response to WebSocket
            await self.send_to_user(
                user_id,
                {
                    "type": "device_control_response",
                    "data": {
                        "entity_id": entity_id,
                        "action": action,
                        "success": success,
                        "error": error_message,
                        "new_state": new_state,
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )

            return {
                "success": success,
                "entity_id": entity_id,
                "action": action,
                "new_state": new_state,
                "error": error_message,
            }

        except Exception as e:
            logger.error(f"Error controlling device {entity_id}: {e}")
            return {
                "success": False,
                "entity_id": entity_id,
                "action": action,
                "error": str(e),
            }

    async def get_device_current_state(
        self, user_id: str, entity_id: str
    ) -> Optional[str]:
        """Get current state of a device"""
        try:
            # Get from database directly (no caching layer)
            # TODO: Consider using Supabase's built-in caching or Realtime subscriptions
            supabase = self.db_service.get_supabase_client()
            result = (
                supabase.table("device_states")
                .select("state")
                .eq("user_id", user_id)
                .eq("home_assistant_entity_id", entity_id)
                .execute()
            )

            if result.data:
                return result.data[0]["state"]

            return None

        except Exception as e:
            logger.error(f"Error getting device state: {e}")
            return None

    async def log_device_control(
        self,
        user_id: str,
        entity_id: str,
        action_type: str,
        previous_state: Optional[str],
        new_state: Optional[str],
        success: bool,
        error_message: Optional[str] = None,
    ):
        """Log device control action"""
        try:
            supabase = self.db_service.get_supabase_client()

            result = supabase.rpc(
                "log_device_control",
                {
                    "p_user_id": user_id,
                    "p_entity_id": entity_id,
                    "p_action_type": action_type,
                    "p_previous_state": previous_state,
                    "p_new_state": new_state,
                    "p_success": success,
                    "p_error_message": error_message,
                },
            ).execute()

        except Exception as e:
            logger.error(f"Error logging device control: {e}")

    async def create_device_assignment(
        self,
        user_id: str,
        location_id: str,
        entity_id: str,
        device_type: DeviceType,
        device_name: Optional[str] = None,
        capabilities: Optional[Dict] = None,
    ) -> Dict:
        """Create a new device assignment"""
        try:
            supabase = self.db_service.get_supabase_client()

            result = (
                supabase.table("device_assignments")
                .insert(
                    {
                        "user_id": user_id,
                        "location_id": location_id,
                        "home_assistant_entity_id": entity_id,
                        "device_type": device_type.value,
                        "device_name": device_name,
                        "capabilities": capabilities or {},
                    }
                )
                .execute()
            )

            if result.data:
                logger.info(f"Created device assignment: {entity_id} -> {location_id}")
                return result.data[0]

            raise Exception("Failed to create device assignment")

        except Exception as e:
            logger.error(f"Error creating device assignment: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_device_assignment(self, user_id: str, assignment_id: str) -> bool:
        """Delete a device assignment"""
        try:
            supabase = self.db_service.get_supabase_client()

            result = (
                supabase.table("device_assignments")
                .delete()
                .eq("id", assignment_id)
                .eq("user_id", user_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            logger.error(f"Error deleting device assignment: {e}")
            return False

    async def emergency_stop(
        self,
        user_id: str,
        location_ids: Optional[List[str]] = None,
        device_types: Optional[List[DeviceType]] = None,
    ) -> Dict:
        """Emergency stop for devices"""
        try:
            # Get affected devices
            supabase = self.db_service.get_supabase_client()
            query = (
                supabase.table("device_assignments").select("*").eq("user_id", user_id)
            )

            if location_ids:
                query = query.in_("location_id", location_ids)

            if device_types:
                query = query.in_("device_type", [dt.value for dt in device_types])

            result = query.execute()
            devices = result.data or []

            # Execute emergency stop on each device
            stopped_devices = []
            failed_devices = []

            for device in devices:
                entity_id = device["home_assistant_entity_id"]
                try:
                    control_result = await self.control_device(
                        user_id, entity_id, {"type": "turn_off"}
                    )
                    if control_result["success"]:
                        stopped_devices.append(entity_id)
                    else:
                        failed_devices.append(
                            {
                                "entity_id": entity_id,
                                "error": control_result.get("error", "Unknown error"),
                            }
                        )
                except Exception as e:
                    failed_devices.append({"entity_id": entity_id, "error": str(e)})

            # Send emergency stop notification
            await self.send_to_user(
                user_id,
                {
                    "type": "emergency_stop_complete",
                    "data": {
                        "stopped_devices": stopped_devices,
                        "failed_devices": failed_devices,
                        "total_devices": len(devices),
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )

            return {
                "success": True,
                "stopped_devices": stopped_devices,
                "failed_devices": failed_devices,
                "total_devices": len(devices),
            }

        except Exception as e:
            logger.error(f"Error during emergency stop: {e}")
            return {
                "success": False,
                "error": str(e),
                "stopped_devices": [],
                "failed_devices": [],
                "total_devices": 0,
            }
