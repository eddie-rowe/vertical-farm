import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .supabase_background_service import SupabaseBackgroundService

logger = logging.getLogger(__name__)


class FarmAutomationService:
    """Service for managing farm automation background tasks using Supabase queues"""

    def __init__(self) -> None:
        self.bg_service = SupabaseBackgroundService()

    async def schedule_irrigation_cycle(
        self, schedule_id: str, shelf_id: str, duration_minutes: int, farm_id: str
    ) -> str:
        """Schedule an irrigation cycle for a specific shelf"""

        task_data = {
            "task_type": "farm.irrigation_cycle",
            "payload": {
                "schedule_id": schedule_id,
                "shelf_id": shelf_id,
                "duration_minutes": duration_minutes,
                "farm_id": farm_id,
            },
        }

        logger.info(
            f"Scheduling irrigation cycle for shelf {shelf_id}, duration: {duration_minutes}min"
        )
        return await self.bg_service.queue_task(
            task_type="farm.irrigation_cycle",
            payload=task_data["payload"],
            priority="high",
        )

    async def schedule_light_cycle(
        self,
        schedule_id: str,
        shelf_id: str,
        light_hours: float,
        farm_id: str,
        start_time: datetime | None = None,
    ) -> str:
        """Schedule light cycle for a specific shelf"""

        if start_time is None:
            start_time = datetime.utcnow().replace(
                hour=6, minute=0, second=0, microsecond=0
            )
            # If it's already past 6 AM today, schedule for tomorrow
            if datetime.utcnow().hour >= 6:
                start_time += timedelta(days=1)

        task_data = {
            "task_type": "farm.light_schedule",
            "payload": {
                "schedule_id": schedule_id,
                "shelf_id": shelf_id,
                "light_hours": light_hours,
                "farm_id": farm_id,
                "start_time": start_time.isoformat(),
            },
        }

        logger.info(
            f"Scheduling light cycle for shelf {shelf_id}, duration: {light_hours}h"
        )
        return await self.bg_service.queue_task(
            task_type="farm.light_schedule",
            payload=task_data["payload"],
            priority="normal",
            scheduled_for=start_time,
        )

    async def schedule_sensor_monitoring(
        self, farm_id: str, user_id: str, interval_minutes: int = 30
    ) -> str:
        """Schedule recurring sensor monitoring for a farm"""

        task_data = {
            "task_type": "farm.sensor_monitoring",
            "payload": {
                "farm_id": farm_id,
                "user_id": user_id,
                "interval_minutes": interval_minutes,
            },
        }

        logger.info(f"Scheduling sensor monitoring for farm {farm_id}")
        return await self.bg_service.queue_task(
            task_type="farm.sensor_monitoring",
            payload=task_data["payload"],
            priority="normal",
        )

    async def schedule_harvest_check(
        self,
        schedule_id: str,
        shelf_id: str,
        estimated_end_date: datetime,
        farm_id: str,
    ) -> str:
        """Schedule harvest readiness check"""

        # Schedule check 3 days before estimated harvest
        check_date = estimated_end_date - timedelta(days=3)

        task_data = {
            "task_type": "farm.harvest_check",
            "payload": {
                "schedule_id": schedule_id,
                "shelf_id": shelf_id,
                "estimated_end_date": estimated_end_date.isoformat(),
                "farm_id": farm_id,
            },
        }

        logger.info(
            f"Scheduling harvest check for schedule {schedule_id} on {check_date}"
        )
        return await self.bg_service.queue_task(
            task_type="farm.harvest_check",
            payload=task_data["payload"],
            priority="low",
            scheduled_for=check_date,
        )

    async def trigger_automation_rule(
        self,
        rule_id: str,
        trigger_value: float,
        current_value: float,
        sensor_reading_id: str | None = None,
    ) -> str:
        """Trigger evaluation of an automation rule"""

        task_data = {
            "task_type": "farm.automation_rule",
            "payload": {
                "rule_id": rule_id,
                "trigger_value": trigger_value,
                "current_value": current_value,
                "sensor_reading_id": sensor_reading_id,
                "triggered_at": datetime.utcnow().isoformat(),
            },
        }

        logger.info(
            f"Triggering automation rule {rule_id}: {current_value} vs {trigger_value}"
        )
        return await self.bg_service.queue_task(
            task_type="farm.automation_rule",
            payload=task_data["payload"],
            priority="high",
        )

    async def schedule_maintenance_alert(
        self,
        alert_type: str,
        farm_id: str,
        user_id: str,
        device_id: str | None = None,
        schedule_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """Schedule a maintenance alert"""

        task_data = {
            "task_type": "farm.maintenance_alert",
            "payload": {
                "alert_type": alert_type,
                "farm_id": farm_id,
                "user_id": user_id,
                "device_id": device_id,
                "schedule_id": schedule_id,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat(),
            },
        }

        logger.info(f"Scheduling maintenance alert: {alert_type} for farm {farm_id}")
        return await self.bg_service.queue_task(
            task_type="farm.maintenance_alert",
            payload=task_data["payload"],
            priority="high",
        )

    async def schedule_yield_analytics(
        self, farm_id: str, schedule_id: str | None = None, time_range_days: int = 30
    ) -> str:
        """Schedule yield analytics calculation"""

        task_data = {
            "task_type": "farm.yield_analytics",
            "payload": {
                "farm_id": farm_id,
                "schedule_id": schedule_id,
                "time_range_days": time_range_days,
                "calculation_date": datetime.utcnow().isoformat(),
            },
        }

        logger.info(f"Scheduling yield analytics for farm {farm_id}")
        return await self.bg_service.queue_task(
            task_type="farm.yield_analytics",
            payload=task_data["payload"],
            priority="low",
        )

    async def schedule_climate_control(
        self,
        farm_id: str,
        target_temperature: float | None = None,
        target_humidity: float | None = None,
        shelf_id: str | None = None,
    ) -> str:
        """Schedule climate control adjustment"""

        task_data = {
            "task_type": "farm.climate_control",
            "payload": {
                "farm_id": farm_id,
                "shelf_id": shelf_id,
                "target_temperature": target_temperature,
                "target_humidity": target_humidity,
                "scheduled_at": datetime.utcnow().isoformat(),
            },
        }

        logger.info(f"Scheduling climate control for farm {farm_id}")
        return await self.bg_service.queue_task(
            task_type="farm.climate_control",
            payload=task_data["payload"],
            priority="high",
        )

    async def schedule_all_farm_tasks(
        self, farm_id: str, user_id: str
    ) -> dict[str, list[str]]:
        """Schedule all recurring tasks for a farm"""

        scheduled_tasks = {
            "irrigation": [],
            "lighting": [],
            "monitoring": [],
            "harvest_checks": [],
        }

        try:
            # Get all active schedules for this farm
            # Using the Supabase background service directly

            # Schedule sensor monitoring (every 30 minutes)
            monitoring_task = await self.schedule_sensor_monitoring(
                farm_id, user_id, 30
            )
            scheduled_tasks["monitoring"].append(monitoring_task)

            # Schedule yield analytics (daily)
            analytics_task = await self.schedule_yield_analytics(farm_id)
            scheduled_tasks["monitoring"].append(analytics_task)

            logger.info(f"Scheduled all farm tasks for farm {farm_id}")
            return scheduled_tasks

        except Exception as e:
            logger.error(f"Failed to schedule farm tasks for {farm_id}: {e}")
            raise

    async def process_sensor_reading_triggers(
        self, device_assignment_id: str, reading_type: str, value: float, farm_id: str
    ) -> list[str]:
        """Process sensor reading and trigger any applicable automation rules"""

        triggered_tasks = []

        try:
            # This would query automation_rules table for matching triggers
            # For now, implementing basic logic

            # Example: Temperature too high
            if reading_type == "temperature" and value > 30:
                task_id = await self.schedule_climate_control(
                    farm_id=farm_id, target_temperature=25.0
                )
                triggered_tasks.append(task_id)

            # Example: Humidity too low
            if reading_type == "humidity" and value < 40:
                task_id = await self.schedule_climate_control(
                    farm_id=farm_id, target_humidity=60.0
                )
                triggered_tasks.append(task_id)

            # Example: Water level low
            if reading_type == "water_level" and value < 20:
                task_id = await self.schedule_maintenance_alert(
                    alert_type="low_water_level",
                    farm_id=farm_id,
                    user_id="",  # Would need to get from farm
                    device_id=device_assignment_id,
                    metadata={"current_level": value},
                )
                triggered_tasks.append(task_id)

            return triggered_tasks

        except Exception as e:
            logger.error(f"Failed to process sensor triggers: {e}")
            return []

    async def get_task_status(self, task_id: str) -> dict[str, Any]:
        """Get the status of a background task"""

        try:
            # This would query the task logs or queue status
            # Implementation depends on how Supabase queues track task status

            return {
                "task_id": task_id,
                "status": "unknown",
                "message": "Task status tracking not yet implemented",
            }

        except Exception as e:
            logger.error(f"Failed to get task status for {task_id}: {e}")
            return {"task_id": task_id, "status": "error", "message": str(e)}

    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a scheduled task"""

        try:
            # Implementation would depend on Supabase queue cancellation capabilities
            logger.info(f"Cancelling task {task_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to cancel task {task_id}: {e}")
            return False

    async def get_farm_task_summary(self, farm_id: str) -> dict[str, Any]:
        """Get summary of all tasks for a farm"""

        try:
            # This would query task logs and provide analytics

            return {
                "farm_id": farm_id,
                "total_tasks": 0,
                "pending_tasks": 0,
                "completed_tasks": 0,
                "failed_tasks": 0,
                "last_updated": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Failed to get task summary for farm {farm_id}: {e}")
            return {"farm_id": farm_id, "error": str(e)}


# Convenience functions for common automation scenarios
async def setup_new_grow_schedule_automation(
    schedule_id: str,
    shelf_id: str,
    farm_id: str,
    grow_recipe: dict[str, Any],
    start_date: datetime,
) -> dict[str, list[str]]:
    """Set up all automation tasks for a new grow schedule"""

    automation_service = FarmAutomationService()
    scheduled_tasks = {"irrigation": [], "lighting": [], "harvest": []}

    try:
        # Schedule irrigation based on recipe
        if grow_recipe.get("watering_frequency_hours"):
            irrigation_task = await automation_service.schedule_irrigation_cycle(
                schedule_id=schedule_id,
                shelf_id=shelf_id,
                duration_minutes=30,  # Default 30 minutes
                farm_id=farm_id,
            )
            scheduled_tasks["irrigation"].append(irrigation_task)

        # Schedule lighting based on recipe
        if grow_recipe.get("light_hours_per_day"):
            lighting_task = await automation_service.schedule_light_cycle(
                schedule_id=schedule_id,
                shelf_id=shelf_id,
                light_hours=grow_recipe["light_hours_per_day"],
                farm_id=farm_id,
            )
            scheduled_tasks["lighting"].append(lighting_task)

        # Schedule harvest check
        if grow_recipe.get("grow_days"):
            estimated_end = start_date + timedelta(days=grow_recipe["grow_days"])
            harvest_task = await automation_service.schedule_harvest_check(
                schedule_id=schedule_id,
                shelf_id=shelf_id,
                estimated_end_date=estimated_end,
                farm_id=farm_id,
            )
            scheduled_tasks["harvest"].append(harvest_task)

        logger.info(f"Set up automation for new grow schedule {schedule_id}")
        return scheduled_tasks

    except Exception as e:
        logger.error(f"Failed to set up automation for schedule {schedule_id}: {e}")
        raise


async def handle_sensor_alert_threshold(
    device_assignment_id: str,
    reading_type: str,
    current_value: float,
    threshold_value: float,
    condition: str,
    farm_id: str,
) -> str | None:
    """Handle sensor reading that crosses alert threshold"""

    automation_service = FarmAutomationService()

    try:
        # Check if threshold is crossed
        threshold_crossed = False

        if condition == ">" and current_value > threshold_value:
            threshold_crossed = True
        elif condition == "<" and current_value < threshold_value:
            threshold_crossed = True
        elif condition == "=" and abs(current_value - threshold_value) < 0.1:
            threshold_crossed = True

        if threshold_crossed:
            # Trigger automation rule or alert
            task_id = await automation_service.schedule_maintenance_alert(
                alert_type="sensor_threshold_exceeded",
                farm_id=farm_id,
                user_id="",  # Would need to get from farm
                device_id=device_assignment_id,
                metadata={
                    "reading_type": reading_type,
                    "current_value": current_value,
                    "threshold_value": threshold_value,
                    "condition": condition,
                },
            )

            logger.info(
                f"Sensor threshold alert triggered for {reading_type}: {current_value} {condition} {threshold_value}"
            )
            return task_id

        return None

    except Exception as e:
        logger.error(f"Failed to handle sensor alert threshold: {e}")
        return None
