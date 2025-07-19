"""
Layer Two: Grow Automation Service
Bridges grow management with device control automation
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

# Removed croniter dependency - will use Supabase's native scheduling instead

from app.services.device_monitoring_service import DeviceMonitoringService
from app.services.database_service import DatabaseService
from app.db.supabase_client import get_supabase_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class GrowAutomationService:
    def __init__(self):
        self.supabase = get_supabase_client()
        db_service = DatabaseService()
        self.device_service = DeviceMonitoringService(db_service)
        # Removed in-memory task tracking - replaced with Supabase queues
        # self.running_schedules: Dict[str, asyncio.Task] = {}
        # self.condition_monitors: Dict[str, asyncio.Task] = {}

    async def initialize_grow_automation(
        self, grow_id: str, user_id: str
    ) -> Dict[str, Any]:
        """Initialize automation for a new grow based on its configuration"""
        try:
            # Get grow details with device profile
            grow_response = (
                await self.supabase.table("grows")
                .select(
                    "*, device_profile_id, automation_enabled, "
                    "grow_device_profiles(*), "
                    "grow_location_assignments(location_id)"
                )
                .eq("id", grow_id)
                .eq("created_by", user_id)
                .single()
                .execute()
            )

            if not grow_response.data:
                raise ValueError(f"Grow {grow_id} not found")

            grow = grow_response.data

            if not grow.get("automation_enabled", True):
                return {"success": True, "message": "Automation disabled for this grow"}

            # Get device assignments for grow locations
            device_assignments = await self._get_grow_device_assignments(grow_id)

            if not device_assignments:
                logger.warning(f"No device assignments found for grow {grow_id}")
                return {"success": True, "message": "No devices to automate"}

            created_automations = {"schedules": [], "conditions": [], "rules": []}

            # Apply device profile if specified
            if grow.get("device_profile_id"):
                profile_automations = await self._apply_device_profile(
                    grow_id, grow["device_profile_id"], device_assignments, user_id
                )
                created_automations.update(profile_automations)

            # TODO: Replace with Supabase queue initialization
            # Removed in-memory monitoring - use Supabase Edge Functions with triggers instead
            # await self._start_grow_monitoring(grow_id)
            logger.info(
                f"Grow automation initialized for {grow_id} - using Supabase queues"
            )

            return {
                "success": True,
                "grow_id": grow_id,
                "created_automations": created_automations,
                "device_assignments": len(device_assignments),
            }

        except Exception as e:
            logger.error(f"Error initializing automation for grow {grow_id}: {e}")
            return {"success": False, "error": str(e)}

    async def _get_grow_device_assignments(self, grow_id: str) -> List[Dict[str, Any]]:
        """Get all device assignments for a grow's locations"""
        try:
            # Use the database function to get device assignments
            response = await self.supabase.rpc(
                "get_grow_device_assignments", {"grow_id_param": grow_id}
            ).execute()

            return response.data or []

        except Exception as e:
            logger.error(f"Error getting device assignments for grow {grow_id}: {e}")
            return []

    async def _apply_device_profile(
        self,
        grow_id: str,
        profile_id: str,
        device_assignments: List[Dict[str, Any]],
        user_id: str,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Apply a device profile to create automation schedules and conditions"""
        try:
            # Get device profile
            profile_response = (
                await self.supabase.table("grow_device_profiles")
                .select("*")
                .eq("id", profile_id)
                .single()
                .execute()
            )

            if not profile_response.data:
                raise ValueError(f"Device profile {profile_id} not found")

            profile = profile_response.data
            profile_config = profile["profile_config"]
            device_type = profile["device_type"]

            created_schedules = []
            created_conditions = []

            # Find matching device assignments
            matching_devices = [
                device
                for device in device_assignments
                if device["device_type"] == device_type
            ]

            if not matching_devices:
                logger.warning(
                    f"No {device_type} devices found for profile {profile_id}"
                )
                return {"schedules": [], "conditions": [], "rules": []}

            # Create schedules based on profile config
            for device in matching_devices:
                if "schedule" in profile_config:
                    schedule_data = await self._create_schedule_from_profile(
                        grow_id, device["assignment_id"], profile_config, user_id
                    )
                    if schedule_data:
                        created_schedules.append(schedule_data)

                # Create conditions based on profile config
                if (
                    "temperature_trigger" in profile_config
                    or "humidity_trigger" in profile_config
                ):
                    condition_data = await self._create_conditions_from_profile(
                        grow_id, device["assignment_id"], profile_config, user_id
                    )
                    if condition_data:
                        created_conditions.extend(condition_data)

            return {
                "schedules": created_schedules,
                "conditions": created_conditions,
                "rules": [],
            }

        except Exception as e:
            logger.error(f"Error applying device profile {profile_id}: {e}")
            return {"schedules": [], "conditions": [], "rules": []}

    async def _create_schedule_from_profile(
        self,
        grow_id: str,
        device_assignment_id: str,
        config: Dict[str, Any],
        user_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Create automation schedule from device profile config"""
        try:
            schedule_type = config.get("schedule", "daily")

            # Create device actions based on config
            if (
                schedule_type == "daily"
                and "on_time" in config
                and "off_time" in config
            ):
                # Create ON schedule
                on_schedule = {
                    "grow_id": grow_id,
                    "device_assignment_id": device_assignment_id,
                    "schedule_name": f"Auto Light On",
                    "schedule_type": "daily",
                    "device_action": {
                        "action_type": "turn_on",
                        "parameters": {"brightness": config.get("intensity", 100)},
                    },
                    "cron_expression": self._time_to_cron(config["on_time"]),
                    "is_active": True,
                    "created_by": user_id,
                }

                on_response = (
                    await self.supabase.table("grow_automation_schedules")
                    .insert(on_schedule)
                    .execute()
                )

                # Create OFF schedule
                off_schedule = {
                    "grow_id": grow_id,
                    "device_assignment_id": device_assignment_id,
                    "schedule_name": f"Auto Light Off",
                    "schedule_type": "daily",
                    "device_action": {"action_type": "turn_off"},
                    "cron_expression": self._time_to_cron(config["off_time"]),
                    "is_active": True,
                    "created_by": user_id,
                }

                off_response = (
                    await self.supabase.table("grow_automation_schedules")
                    .insert(off_schedule)
                    .execute()
                )

                return on_response.data[0] if on_response.data else None

            elif schedule_type == "every_2_days":
                # Watering schedule every 2 days
                schedule = {
                    "grow_id": grow_id,
                    "device_assignment_id": device_assignment_id,
                    "schedule_name": f"Auto Watering",
                    "schedule_type": "custom",
                    "device_action": {
                        "action_type": "turn_on",
                        "duration_seconds": config.get("duration_seconds", 30),
                    },
                    "cron_expression": "0 8 */2 * *",  # Every 2 days at 8 AM
                    "is_active": True,
                    "created_by": user_id,
                }

                response = (
                    await self.supabase.table("grow_automation_schedules")
                    .insert(schedule)
                    .execute()
                )
                return response.data[0] if response.data else None

            return None

        except Exception as e:
            logger.error(f"Error creating schedule from profile: {e}")
            return None

    async def _create_conditions_from_profile(
        self,
        grow_id: str,
        device_assignment_id: str,
        config: Dict[str, Any],
        user_id: str,
    ) -> List[Dict[str, Any]]:
        """Create automation conditions from device profile config"""
        conditions = []

        try:
            # Temperature-based conditions
            if "temperature_trigger" in config:
                temp_condition = {
                    "grow_id": grow_id,
                    "device_assignment_id": device_assignment_id,
                    "condition_name": "High Temperature Control",
                    "sensor_entity_id": "sensor.temperature",  # This should be configurable
                    "condition_type": "above",
                    "threshold_value": config["temperature_trigger"],
                    "device_action": {
                        "action_type": "turn_on",
                        "parameters": {"speed": config.get("speed", "medium")},
                    },
                    "cooldown_minutes": 10,
                    "is_active": True,
                    "created_by": user_id,
                }

                response = (
                    await self.supabase.table("grow_automation_conditions")
                    .insert(temp_condition)
                    .execute()
                )
                if response.data:
                    conditions.append(response.data[0])

            # Humidity-based conditions
            if "humidity_trigger" in config:
                humidity_condition = {
                    "grow_id": grow_id,
                    "device_assignment_id": device_assignment_id,
                    "condition_name": "Low Humidity Control",
                    "sensor_entity_id": "sensor.humidity",  # This should be configurable
                    "condition_type": "below",
                    "threshold_value": config["humidity_trigger"],
                    "device_action": {
                        "action_type": "turn_on",
                        "duration_seconds": config.get("duration_seconds", 5),
                    },
                    "cooldown_minutes": 15,
                    "is_active": True,
                    "created_by": user_id,
                }

                response = (
                    await self.supabase.table("grow_automation_conditions")
                    .insert(humidity_condition)
                    .execute()
                )
                if response.data:
                    conditions.append(response.data[0])

            return conditions

        except Exception as e:
            logger.error(f"Error creating conditions from profile: {e}")
            return []

    def _time_to_cron(self, time_str: str) -> str:
        """Convert time string to cron expression"""
        try:
            hour, minute = time_str.split(":")
            return f"{minute} {hour} * * *"
        except:
            return "0 8 * * *"  # Default to 8 AM

    # TODO: Replace with Supabase-native queue processing
    # The following methods were implementing in-memory task queuing
    # which should be replaced with Supabase queues and Edge Functions

    async def _execute_scheduled_action(self, schedule: Dict[str, Any]):
        """Execute a scheduled automation action

        Note: This method should be called by Supabase Edge Functions
        triggered by pg_cron or queue processing, not by in-memory tasks.
        """
        try:
            execution_id = await self._log_execution_start(
                schedule["grow_id"],
                "schedule",
                schedule["id"],
                schedule["device_assignment_id"],
                schedule["device_action"],
            )

            # Execute device action via device monitoring service
            result = await self.device_service.execute_device_action(
                schedule["device_assignment_id"], schedule["device_action"]
            )

            # Log execution result
            await self._log_execution_complete(
                execution_id,
                "success" if result.get("success") else "failed",
                result,
                result.get("error"),
            )

        except Exception as e:
            logger.error(
                f"Error executing scheduled action for schedule {schedule['id']}: {e}"
            )
            # Try to log the error if execution_id exists
            if "execution_id" in locals():
                await self._log_execution_complete(execution_id, "failed", None, str(e))

    async def _execute_condition_action(self, condition: Dict[str, Any]):
        """Execute a condition-triggered automation action

        Note: This method should be called by Supabase Edge Functions
        triggered by sensor data changes or queue processing.
        """
        try:
            execution_id = await self._log_execution_start(
                condition["grow_id"],
                "condition",
                condition["id"],
                condition["device_assignment_id"],
                condition["device_action"],
            )

            # Execute device action
            result = await self.device_service.execute_device_action(
                condition["device_assignment_id"], condition["device_action"]
            )

            # Update last triggered time
            await self.supabase.table("grow_automation_conditions").update(
                {"last_triggered_at": datetime.utcnow().isoformat()}
            ).eq("id", condition["id"]).execute()

            # Log execution result
            await self._log_execution_complete(
                execution_id,
                "success" if result.get("success") else "failed",
                result,
                result.get("error"),
            )

        except Exception as e:
            logger.error(
                f"Error executing condition action for condition {condition['id']}: {e}"
            )
            # Try to log the error if execution_id exists
            if "execution_id" in locals():
                await self._log_execution_complete(execution_id, "failed", None, str(e))

    async def _log_execution_start(
        self,
        grow_id: str,
        automation_type: str,
        automation_id: str,
        device_assignment_id: str,
        action: Dict[str, Any],
    ) -> str:
        """Log the start of an automation execution"""
        try:
            execution_data = {
                "id": str(uuid4()),
                "grow_id": grow_id,
                "automation_type": automation_type,
                "automation_id": automation_id,
                "device_assignment_id": device_assignment_id,
                "action_data": action,
                "status": "running",
                "started_at": datetime.utcnow().isoformat(),
            }

            response = (
                await self.supabase.table("grow_automation_executions")
                .insert(execution_data)
                .execute()
            )

            return execution_data["id"]

        except Exception as e:
            logger.error(f"Error logging execution start: {e}")
            return str(uuid4())  # Return a fallback ID

    async def _log_execution_complete(
        self,
        execution_id: str,
        status: str,
        result: Optional[Dict[str, Any]],
        error: Optional[str],
    ):
        """Log the completion of an automation execution"""
        try:
            update_data = {
                "status": status,
                "completed_at": datetime.utcnow().isoformat(),
                "result_data": result,
                "error_message": error,
            }

            await self.supabase.table("grow_automation_executions").update(
                update_data
            ).eq("id", execution_id).execute()

        except Exception as e:
            logger.error(f"Error logging execution completion: {e}")

    async def stop_grow_automation(self, grow_id: str):
        """Stop automation for a grow

        Note: With Supabase queues, this would involve:
        1. Marking schedules/conditions as inactive in the database
        2. Canceling any pending queue items for this grow
        3. Notifying Edge Functions to stop processing for this grow
        """
        try:
            # Mark all schedules as inactive
            await self.supabase.table("grow_automation_schedules").update(
                {"is_active": False}
            ).eq("grow_id", grow_id).execute()

            # Mark all conditions as inactive
            await self.supabase.table("grow_automation_conditions").update(
                {"is_active": False}
            ).eq("grow_id", grow_id).execute()

            # TODO: Cancel pending Supabase queue items for this grow
            # TODO: Notify Edge Functions to stop processing

            logger.info(f"Stopped automation for grow {grow_id}")

        except Exception as e:
            logger.error(f"Error stopping automation for grow {grow_id}: {e}")

    async def get_grow_automation_status(
        self, grow_id: str, user_id: str
    ) -> Dict[str, Any]:
        """Get automation status for a grow"""
        try:
            # Get active schedules
            schedules_response = (
                await self.supabase.table("grow_automation_schedules")
                .select("*")
                .eq("grow_id", grow_id)
                .eq("is_active", True)
                .execute()
            )

            # Get active conditions
            conditions_response = (
                await self.supabase.table("grow_automation_conditions")
                .select("*")
                .eq("grow_id", grow_id)
                .eq("is_active", True)
                .execute()
            )

            # Get recent executions
            executions_response = (
                await self.supabase.table("grow_automation_executions")
                .select("*")
                .eq("grow_id", grow_id)
                .order("started_at", desc=True)
                .limit(10)
                .execute()
            )

            return {
                "grow_id": grow_id,
                "automation_enabled": True,
                "active_schedules": len(schedules_response.data or []),
                "active_conditions": len(conditions_response.data or []),
                "recent_executions": executions_response.data or [],
                "queue_status": "supabase_queues",  # Indicator that we're using Supabase queues
            }

        except Exception as e:
            logger.error(f"Error getting automation status for grow {grow_id}: {e}")
            return {"grow_id": grow_id, "automation_enabled": False, "error": str(e)}


# Global service instance
grow_automation_service = GrowAutomationService()
