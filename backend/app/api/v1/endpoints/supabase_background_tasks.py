"""
Supabase Background Tasks API Endpoints
Replaces Redis-based background task endpoints with Supabase-powered ones
"""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_active_user as get_current_user
from app.services.supabase_background_service import supabase_background_service

router = APIRouter()


# Request/Response Models
class TaskRequest(BaseModel):
    task_type: str
    payload: dict
    priority: str = "normal"
    max_retries: int = 3


class TaskResponse(BaseModel):
    task_id: str
    status: str = "queued"


class BulkControlRequest(BaseModel):
    entity_ids: List[str]
    action: str  # 'turn_on', 'turn_off'
    value: Optional[int] = None


class DataCollectionRequest(BaseModel):
    entity_ids: List[str]
    time_range: int = 3600  # seconds


# Task Management Endpoints
@router.post("/queue", response_model=TaskResponse)
async def queue_task(
    request: TaskRequest, current_user: dict = Depends(get_current_user)
):
    """Queue a background task for processing"""
    try:
        task_id = await supabase_background_service.queue_task(
            task_type=request.task_type,
            payload=request.payload,
            priority=request.priority,
            user_id=current_user["id"],
            max_retries=request.max_retries,
        )

        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue task: {str(e)}")


@router.get("/status")
async def get_system_status():
    """Get overall background task system status"""
    try:
        health = await supabase_background_service.get_system_health()
        return health

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get system status: {str(e)}"
        )


@router.get("/queues")
async def get_queue_statistics():
    """Get statistics for all task queues"""
    try:
        stats = await supabase_background_service.get_queue_stats()
        return {
            "queues": [
                {
                    "name": stat.queue_name,
                    "length": stat.queue_length,
                    "oldest_message_age": stat.oldest_msg_age_seconds,
                }
                for stat in stats
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get queue stats: {str(e)}"
        )


@router.get("/logs")
async def get_task_logs(
    limit: int = 100, task_type: Optional[str] = None, success: Optional[bool] = None
):
    """Get task execution logs"""
    try:
        logs = await supabase_background_service.get_task_logs(
            limit=limit, task_type=task_type, success=success
        )
        return {"logs": logs}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get task logs: {str(e)}"
        )


@router.get("/functions")
async def get_registered_functions():
    """Get list of available background task types"""
    try:
        functions = await supabase_background_service.get_registered_functions()
        return {"functions": functions}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get functions: {str(e)}"
        )


# Manual Triggers
@router.post("/trigger/process")
async def trigger_queue_processing():
    """Manually trigger queue processing"""
    try:
        result = await supabase_background_service.trigger_queue_processing()
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger processing: {str(e)}"
        )


@router.post("/trigger/schedule")
async def trigger_recurring_tasks():
    """Manually trigger scheduling of recurring tasks"""
    try:
        result = await supabase_background_service.schedule_recurring_tasks()
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger scheduling: {str(e)}"
        )


@router.post("/trigger/cleanup")
async def trigger_cleanup():
    """Manually trigger cleanup of old tasks and data"""
    try:
        result = await supabase_background_service.cleanup_old_tasks()
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger cleanup: {str(e)}"
        )


# Home Assistant Specific Endpoints
@router.post("/home-assistant/discover")
async def schedule_device_discovery(current_user: dict = Depends(get_current_user)):
    """Schedule Home Assistant device discovery"""
    try:
        task_id = await supabase_background_service.schedule_device_discovery(
            user_id=current_user["id"]
        )
        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule discovery: {str(e)}"
        )


@router.post("/home-assistant/sync")
async def schedule_state_sync(current_user: dict = Depends(get_current_user)):
    """Schedule Home Assistant state synchronization"""
    try:
        task_id = await supabase_background_service.schedule_state_sync(
            user_id=current_user["id"]
        )
        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule sync: {str(e)}"
        )


@router.post("/home-assistant/health-check")
async def schedule_health_check(current_user: dict = Depends(get_current_user)):
    """Schedule Home Assistant health check"""
    try:
        task_id = await supabase_background_service.schedule_health_check(
            user_id=current_user["id"]
        )
        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule health check: {str(e)}"
        )


@router.post("/home-assistant/bulk-control")
async def schedule_bulk_control(
    request: BulkControlRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule bulk device control operation"""
    try:
        task_id = await supabase_background_service.schedule_bulk_control(
            user_id=current_user["id"],
            entity_ids=request.entity_ids,
            action=request.action,
            value=request.value,
        )
        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule bulk control: {str(e)}"
        )


@router.post("/home-assistant/collect-data")
async def schedule_data_collection(
    request: DataCollectionRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule historical data collection"""
    try:
        task_id = await supabase_background_service.schedule_data_collection(
            user_id=current_user["id"],
            entity_ids=request.entity_ids,
            time_range=request.time_range,
        )
        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule data collection: {str(e)}"
        )


# Convenience endpoints for common operations
@router.post("/home-assistant/morning-routine")
async def schedule_morning_routine(current_user: dict = Depends(get_current_user)):
    """Schedule morning startup routine (discovery + sync + health check)"""
    try:
        tasks = []

        # Schedule discovery first
        discovery_task = await supabase_background_service.schedule_device_discovery(
            user_id=current_user["id"]
        )
        tasks.append({"type": "discovery", "task_id": discovery_task})

        # Schedule sync
        sync_task = await supabase_background_service.schedule_state_sync(
            user_id=current_user["id"]
        )
        tasks.append({"type": "sync", "task_id": sync_task})

        # Schedule health check
        health_task = await supabase_background_service.schedule_health_check(
            user_id=current_user["id"]
        )
        tasks.append({"type": "health_check", "task_id": health_task})

        return {"scheduled_tasks": tasks}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule morning routine: {str(e)}"
        )


@router.post("/home-assistant/harvest-mode")
async def schedule_harvest_mode(current_user: dict = Depends(get_current_user)):
    """Schedule harvest mode (turn off all lights and fans)"""
    try:
        # This would typically get all light and fan entities for the user
        # For now, we'll use a placeholder that the Edge Function can expand
        task_id = await supabase_background_service.queue_task(
            task_type="home_assistant.harvest_mode",
            payload={"user_id": current_user["id"], "action": "harvest_mode"},
            priority="high",
            user_id=current_user["id"],
        )

        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule harvest mode: {str(e)}"
        )


@router.post("/home-assistant/maintenance-mode")
async def schedule_maintenance_mode(
    enable: bool = True, current_user: dict = Depends(get_current_user)
):
    """Schedule maintenance mode (controlled shutdown/startup)"""
    try:
        task_id = await supabase_background_service.queue_task(
            task_type="home_assistant.maintenance_mode",
            payload={"user_id": current_user["id"], "enable": enable},
            priority="critical",
            user_id=current_user["id"],
        )

        return TaskResponse(task_id=task_id)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule maintenance mode: {str(e)}"
        )
