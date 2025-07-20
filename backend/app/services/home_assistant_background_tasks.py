import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

# Updated imports for Supabase-based background processing
from .supabase_background_service import SupabaseBackgroundService
from .user_home_assistant_service import UserHomeAssistantService

logger = logging.getLogger(__name__)

# Initialize Supabase background service
supabase_bg_service = SupabaseBackgroundService()


# Task definitions - these will be processed by Supabase Edge Functions
async def discover_home_assistant_devices(
    user_id: str, ha_config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Background task to discover all Home Assistant devices for a user

    Args:
        user_id: User ID
        ha_config: Home Assistant configuration (url, token)

    Returns:
        Dict containing discovered devices and entities
    """
    logger.info(f"Starting device discovery for user {user_id}")

    try:
        # Create HA service instance
        ha_service = UserHomeAssistantService(user_id, ha_config)

        # Get all entities
        entities = await ha_service.get_entities()

        # Filter for relevant device types (lights, switches, sensors)
        relevant_entities = []
        device_types = ["light", "switch", "sensor", "binary_sensor", "fan"]

        for entity in entities:
            entity_id = entity.get("entity_id", "")
            domain = entity_id.split(".")[0] if "." in entity_id else ""

            if domain in device_types:
                # Get current state
                state = await ha_service.get_entity_state(entity_id)
                entity["current_state"] = state
                relevant_entities.append(entity)

        result = {
            "user_id": user_id,
            "discovered_at": datetime.utcnow().isoformat(),
            "total_entities": len(entities),
            "relevant_entities": len(relevant_entities),
            "entities": relevant_entities,
            "device_types_found": list(
                set(
                    entity["entity_id"].split(".")[0]
                    for entity in relevant_entities
                    if "." in entity["entity_id"]
                )
            ),
        }

        logger.info(
            f"Device discovery completed for user {user_id}: {len(relevant_entities)} relevant entities found"
        )
        return result

    except Exception as e:
        logger.error(f"Device discovery failed for user {user_id}: {e}")
        raise


async def sync_device_states(
    user_id: str, ha_config: Dict[str, Any], entity_ids: List[str]
) -> Dict[str, Any]:
    """
    Background task to synchronize device states from Home Assistant

    Args:
        user_id: User ID
        ha_config: Home Assistant configuration
        entity_ids: List of entity IDs to sync

    Returns:
        Dict containing current states of all entities
    """
    logger.info(f"Starting state sync for user {user_id}, {len(entity_ids)} entities")

    try:
        ha_service = UserHomeAssistantService(user_id, ha_config)

        # Get current states for all entities
        states = {}
        failed_entities = []

        for entity_id in entity_ids:
            try:
                state = await ha_service.get_entity_state(entity_id)
                states[entity_id] = state
            except Exception as e:
                logger.warning(f"Failed to get state for {entity_id}: {e}")
                failed_entities.append(entity_id)

        result = {
            "user_id": user_id,
            "synced_at": datetime.utcnow().isoformat(),
            "total_entities": len(entity_ids),
            "successful_syncs": len(states),
            "failed_syncs": len(failed_entities),
            "states": states,
            "failed_entities": failed_entities,
        }

        logger.info(
            f"State sync completed for user {user_id}: {len(states)} successful, {len(failed_entities)} failed"
        )
        return result

    except Exception as e:
        logger.error(f"State sync failed for user {user_id}: {e}")
        raise


async def health_check_home_assistant(
    user_id: str, ha_config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Background task to perform health check on Home Assistant connection

    Args:
        user_id: User ID
        ha_config: Home Assistant configuration

    Returns:
        Dict containing health check results
    """
    logger.info(f"Starting health check for user {user_id}")

    try:
        ha_service = UserHomeAssistantService(user_id, ha_config)

        # Test basic connectivity
        start_time = datetime.utcnow()
        config = await ha_service.get_config()
        response_time = (datetime.utcnow() - start_time).total_seconds()

        # Test entity access
        entities = await ha_service.get_entities()
        entity_count = len(entities)

        result = {
            "user_id": user_id,
            "checked_at": datetime.utcnow().isoformat(),
            "status": "healthy",
            "response_time_seconds": response_time,
            "entity_count": entity_count,
            "ha_version": config.get("version", "unknown"),
            "ha_location": config.get("location_name", "unknown"),
        }

        logger.info(
            f"Health check passed for user {user_id}: {response_time:.2f}s response time"
        )
        return result

    except Exception as e:
        logger.error(f"Health check failed for user {user_id}: {e}")
        result = {
            "user_id": user_id,
            "checked_at": datetime.utcnow().isoformat(),
            "status": "unhealthy",
            "error": str(e),
            "response_time_seconds": None,
            "entity_count": 0,
        }
        return result


async def bulk_device_control(
    user_id: str, ha_config: Dict[str, Any], device_commands: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Background task to control multiple devices simultaneously

    Args:
        user_id: User ID
        ha_config: Home Assistant configuration
        device_commands: List of commands to execute

    Returns:
        Dict containing execution results
    """
    logger.info(
        f"Starting bulk device control for user {user_id}, {len(device_commands)} commands"
    )

    try:
        ha_service = UserHomeAssistantService(user_id, ha_config)

        # Execute commands concurrently with error handling
        async def execute_command(command: Dict[str, Any]) -> Dict[str, Any]:
            try:
                entity_id = command["entity_id"]
                service = command["service"]
                service_data = command.get("service_data", {})

                # Call the service
                await ha_service.call_service(
                    domain=entity_id.split(".")[0],
                    service=service,
                    service_data={**service_data, "entity_id": entity_id},
                )

                # Get updated state
                new_state = await ha_service.get_entity_state(entity_id)

                return {
                    "entity_id": entity_id,
                    "service": service,
                    "status": "success",
                    "new_state": new_state,
                }

            except Exception as e:
                logger.error(
                    f"Command failed for {command.get('entity_id', 'unknown')}: {e}"
                )
                return {
                    "entity_id": command.get("entity_id", "unknown"),
                    "service": command.get("service", "unknown"),
                    "status": "failed",
                    "error": str(e),
                }

        # Execute all commands concurrently
        results = await asyncio.gather(
            *[execute_command(cmd) for cmd in device_commands], return_exceptions=True
        )

        # Process results
        successful = [
            r for r in results if isinstance(r, dict) and r.get("status") == "success"
        ]
        failed = [
            r for r in results if isinstance(r, dict) and r.get("status") == "failed"
        ]
        exceptions = [r for r in results if isinstance(r, Exception)]

        result = {
            "user_id": user_id,
            "executed_at": datetime.utcnow().isoformat(),
            "total_commands": len(device_commands),
            "successful": len(successful),
            "failed": len(failed) + len(exceptions),
            "results": [r for r in results if isinstance(r, dict)],
            "exceptions": [str(e) for e in exceptions],
        }

        logger.info(
            f"Bulk control completed for user {user_id}: {len(successful)} successful, {len(failed) + len(exceptions)} failed"
        )
        return result

    except Exception as e:
        logger.error(f"Bulk device control failed for user {user_id}: {e}")
        raise


async def scheduled_device_action(
    user_id: str,
    ha_config: Dict[str, Any],
    entity_id: str,
    service: str,
    service_data: Dict[str, Any],
    schedule_name: str,
) -> Dict[str, Any]:
    """
    Background task to execute a scheduled device action

    Args:
        user_id: User ID
        ha_config: Home Assistant configuration
        entity_id: Target entity ID
        service: Service to call
        service_data: Service parameters
        schedule_name: Name of the schedule for logging

    Returns:
        Dict containing execution results
    """
    logger.info(
        f"Executing scheduled action '{schedule_name}' for user {user_id}, entity {entity_id}"
    )

    try:
        ha_service = UserHomeAssistantService(user_id, ha_config)

        # Get current state before action
        before_state = await ha_service.get_entity_state(entity_id)

        # Execute the service call
        domain = entity_id.split(".")[0]
        await ha_service.call_service(
            domain=domain,
            service=service,
            service_data={**service_data, "entity_id": entity_id},
        )

        # Wait a moment for state to update
        await asyncio.sleep(1)

        # Get state after action
        after_state = await ha_service.get_entity_state(entity_id)

        result = {
            "user_id": user_id,
            "executed_at": datetime.utcnow().isoformat(),
            "schedule_name": schedule_name,
            "entity_id": entity_id,
            "service": f"{domain}.{service}",
            "service_data": service_data,
            "before_state": before_state,
            "after_state": after_state,
            "status": "success",
        }

        logger.info(
            f"Scheduled action '{schedule_name}' completed successfully for user {user_id}"
        )
        return result

    except Exception as e:
        logger.error(
            f"Scheduled action '{schedule_name}' failed for user {user_id}: {e}"
        )
        raise


async def collect_device_history(
    user_id: str, ha_config: Dict[str, Any], entity_ids: List[str], hours_back: int = 24
) -> Dict[str, Any]:
    """
    Background task to collect historical data for devices

    Args:
        user_id: User ID
        ha_config: Home Assistant configuration
        entity_ids: List of entity IDs to collect history for
        hours_back: How many hours of history to collect

    Returns:
        Dict containing historical data
    """
    logger.info(
        f"Collecting device history for user {user_id}, {len(entity_ids)} entities, {hours_back}h back"
    )

    try:
        ha_service = UserHomeAssistantService(user_id, ha_config)

        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours_back)

        # Collect history for each entity
        history_data = {}
        failed_entities = []

        for entity_id in entity_ids:
            try:
                history = await ha_service.get_entity_history(
                    entity_id=entity_id, start_time=start_time, end_time=end_time
                )
                history_data[entity_id] = history
            except Exception as e:
                logger.warning(f"Failed to get history for {entity_id}: {e}")
                failed_entities.append(entity_id)

        result = {
            "user_id": user_id,
            "collected_at": datetime.utcnow().isoformat(),
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "hours": hours_back,
            },
            "total_entities": len(entity_ids),
            "successful_collections": len(history_data),
            "failed_collections": len(failed_entities),
            "history_data": history_data,
            "failed_entities": failed_entities,
        }

        logger.info(
            f"History collection completed for user {user_id}: {len(history_data)} successful, {len(failed_entities)} failed"
        )
        return result

    except Exception as e:
        logger.error(f"History collection failed for user {user_id}: {e}")
        raise


# Scheduling functions - now use Supabase queues
async def schedule_device_discovery(
    user_id: str, ha_config: Dict[str, Any], delay_minutes: int = 0
) -> str:
    """Schedule a device discovery task"""
    task_data = {
        "task_type": "discover_home_assistant_devices",
        "user_id": user_id,
        "ha_config": ha_config,
    }

    priority = "normal"
    if delay_minutes > 0:
        scheduled_for = datetime.utcnow() + timedelta(minutes=delay_minutes)
        return await supabase_bg_service.schedule_task(
            task_data, scheduled_for, priority
        )
    else:
        return await supabase_bg_service.enqueue_task(task_data, priority)


async def schedule_state_sync(
    user_id: str, ha_config: Dict[str, Any], entity_ids: List[str]
) -> str:
    """Schedule a state synchronization task"""
    task_data = {
        "task_type": "sync_device_states",
        "user_id": user_id,
        "ha_config": ha_config,
        "entity_ids": entity_ids,
    }

    return await supabase_bg_service.enqueue_task(task_data, "high")


async def schedule_health_check(
    user_id: str, ha_config: Dict[str, Any], delay_minutes: int = 0
) -> str:
    """Schedule a health check task"""
    task_data = {
        "task_type": "health_check_home_assistant",
        "user_id": user_id,
        "ha_config": ha_config,
    }

    priority = "normal"
    if delay_minutes > 0:
        scheduled_for = datetime.utcnow() + timedelta(minutes=delay_minutes)
        return await supabase_bg_service.schedule_task(
            task_data, scheduled_for, priority
        )
    else:
        return await supabase_bg_service.enqueue_task(task_data, priority)


async def schedule_bulk_control(
    user_id: str, ha_config: Dict[str, Any], device_commands: List[Dict[str, Any]]
) -> str:
    """Schedule a bulk device control task"""
    task_data = {
        "task_type": "bulk_device_control",
        "user_id": user_id,
        "ha_config": ha_config,
        "device_commands": device_commands,
    }

    return await supabase_bg_service.enqueue_task(task_data, "high")


async def schedule_recurring_health_checks(
    user_id: str, ha_config: Dict[str, Any], interval_minutes: int = 30
):
    """Schedule recurring health checks"""
    task_data = {
        "task_type": "health_check_home_assistant",
        "user_id": user_id,
        "ha_config": ha_config,
        "recurring": True,
        "interval_minutes": interval_minutes,
    }

    # Schedule the first check
    first_check_time = datetime.utcnow() + timedelta(minutes=interval_minutes)
    return await supabase_bg_service.schedule_task(
        task_data, first_check_time, "normal"
    )
