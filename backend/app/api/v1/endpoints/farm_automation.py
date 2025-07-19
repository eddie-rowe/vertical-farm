from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from ....services.farm_automation_service import (
    FarmAutomationService,
    setup_new_grow_schedule_automation,
    handle_sensor_alert_threshold,
)
from ....core.security import get_current_active_user as get_current_user

router = APIRouter()


# Request/Response Models
class IrrigationScheduleRequest(BaseModel):
    schedule_id: str
    shelf_id: str
    duration_minutes: int = Field(default=30, ge=1, le=180)
    farm_id: str


class LightScheduleRequest(BaseModel):
    schedule_id: str
    shelf_id: str
    light_hours: float = Field(ge=0, le=24)
    farm_id: str
    start_time: Optional[datetime] = None


class SensorMonitoringRequest(BaseModel):
    farm_id: str
    interval_minutes: int = Field(default=30, ge=5, le=1440)


class HarvestCheckRequest(BaseModel):
    schedule_id: str
    shelf_id: str
    estimated_end_date: datetime
    farm_id: str


class AutomationRuleRequest(BaseModel):
    rule_id: str
    trigger_value: float
    current_value: float
    sensor_reading_id: Optional[str] = None


class MaintenanceAlertRequest(BaseModel):
    alert_type: str
    farm_id: str
    device_id: Optional[str] = None
    schedule_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ClimateControlRequest(BaseModel):
    farm_id: str
    target_temperature: Optional[float] = Field(None, ge=-10, le=50)
    target_humidity: Optional[float] = Field(None, ge=0, le=100)
    shelf_id: Optional[str] = None


class GrowScheduleAutomationRequest(BaseModel):
    schedule_id: str
    shelf_id: str
    farm_id: str
    grow_recipe: Dict[str, Any]
    start_date: datetime


class TaskResponse(BaseModel):
    task_id: str
    message: str = "Task scheduled successfully"


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    message: str
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class FarmTaskSummaryResponse(BaseModel):
    farm_id: str
    total_tasks: int
    pending_tasks: int
    completed_tasks: int
    failed_tasks: int
    last_updated: datetime


# Initialize service
automation_service = FarmAutomationService()


@router.post("/irrigation/schedule", response_model=TaskResponse)
async def schedule_irrigation_cycle(
    request: IrrigationScheduleRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule an irrigation cycle for a specific shelf"""
    try:
        task_id = await automation_service.schedule_irrigation_cycle(
            schedule_id=request.schedule_id,
            shelf_id=request.shelf_id,
            duration_minutes=request.duration_minutes,
            farm_id=request.farm_id,
        )

        return TaskResponse(
            task_id=task_id,
            message=f"Irrigation cycle scheduled for {request.duration_minutes} minutes",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule irrigation: {str(e)}"
        )


@router.post("/lighting/schedule", response_model=TaskResponse)
async def schedule_light_cycle(
    request: LightScheduleRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule light cycle for a specific shelf"""
    try:
        task_id = await automation_service.schedule_light_cycle(
            schedule_id=request.schedule_id,
            shelf_id=request.shelf_id,
            light_hours=request.light_hours,
            farm_id=request.farm_id,
            start_time=request.start_time,
        )

        return TaskResponse(
            task_id=task_id,
            message=f"Light cycle scheduled for {request.light_hours} hours",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule lighting: {str(e)}"
        )


@router.post("/monitoring/schedule", response_model=TaskResponse)
async def schedule_sensor_monitoring(
    request: SensorMonitoringRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule sensor monitoring for a farm"""
    try:
        task_id = await automation_service.schedule_sensor_monitoring(
            farm_id=request.farm_id,
            user_id=current_user["id"],
            interval_minutes=request.interval_minutes,
        )

        return TaskResponse(
            task_id=task_id,
            message=f"Sensor monitoring scheduled every {request.interval_minutes} minutes",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule monitoring: {str(e)}"
        )


@router.post("/harvest/schedule-check", response_model=TaskResponse)
async def schedule_harvest_check(
    request: HarvestCheckRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule harvest readiness check"""
    try:
        task_id = await automation_service.schedule_harvest_check(
            schedule_id=request.schedule_id,
            shelf_id=request.shelf_id,
            estimated_end_date=request.estimated_end_date,
            farm_id=request.farm_id,
        )

        return TaskResponse(task_id=task_id, message="Harvest check scheduled")

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule harvest check: {str(e)}"
        )


@router.post("/automation/trigger-rule", response_model=TaskResponse)
async def trigger_automation_rule(
    request: AutomationRuleRequest, current_user: dict = Depends(get_current_user)
):
    """Trigger evaluation of an automation rule"""
    try:
        task_id = await automation_service.trigger_automation_rule(
            rule_id=request.rule_id,
            trigger_value=request.trigger_value,
            current_value=request.current_value,
            sensor_reading_id=request.sensor_reading_id,
        )

        return TaskResponse(
            task_id=task_id, message="Automation rule evaluation triggered"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger automation rule: {str(e)}"
        )


@router.post("/alerts/schedule", response_model=TaskResponse)
async def schedule_maintenance_alert(
    request: MaintenanceAlertRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule a maintenance alert"""
    try:
        task_id = await automation_service.schedule_maintenance_alert(
            alert_type=request.alert_type,
            farm_id=request.farm_id,
            user_id=current_user["id"],
            device_id=request.device_id,
            schedule_id=request.schedule_id,
            metadata=request.metadata,
        )

        return TaskResponse(
            task_id=task_id,
            message=f"Maintenance alert scheduled: {request.alert_type}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule alert: {str(e)}"
        )


@router.post("/climate/control", response_model=TaskResponse)
async def schedule_climate_control(
    request: ClimateControlRequest, current_user: dict = Depends(get_current_user)
):
    """Schedule climate control adjustment"""
    try:
        task_id = await automation_service.schedule_climate_control(
            farm_id=request.farm_id,
            target_temperature=request.target_temperature,
            target_humidity=request.target_humidity,
            shelf_id=request.shelf_id,
        )

        return TaskResponse(
            task_id=task_id, message="Climate control adjustment scheduled"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule climate control: {str(e)}"
        )


@router.post("/grow-schedule/setup-automation", response_model=Dict[str, List[str]])
async def setup_grow_schedule_automation(
    request: GrowScheduleAutomationRequest,
    current_user: dict = Depends(get_current_user),
):
    """Set up all automation tasks for a new grow schedule"""
    try:
        scheduled_tasks = await setup_new_grow_schedule_automation(
            schedule_id=request.schedule_id,
            shelf_id=request.shelf_id,
            farm_id=request.farm_id,
            grow_recipe=request.grow_recipe,
            start_date=request.start_date,
        )

        return scheduled_tasks

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to setup automation: {str(e)}"
        )


@router.post("/farm/{farm_id}/schedule-all-tasks")
async def schedule_all_farm_tasks(
    farm_id: str, current_user: dict = Depends(get_current_user)
):
    """Schedule all recurring tasks for a farm"""
    try:
        scheduled_tasks = await automation_service.schedule_all_farm_tasks(
            farm_id=farm_id, user_id=current_user["id"]
        )

        return {
            "message": "All farm tasks scheduled successfully",
            "scheduled_tasks": scheduled_tasks,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to schedule farm tasks: {str(e)}"
        )


@router.get("/task/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get the status of a background task"""
    try:
        status_info = await automation_service.get_task_status(task_id)

        return TaskStatusResponse(
            task_id=status_info["task_id"],
            status=status_info["status"],
            message=status_info["message"],
            created_at=status_info.get("created_at"),
            completed_at=status_info.get("completed_at"),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get task status: {str(e)}"
        )


@router.delete("/task/{task_id}")
async def cancel_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a scheduled task"""
    try:
        success = await automation_service.cancel_task(task_id)

        if success:
            return {"message": f"Task {task_id} cancelled successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to cancel task")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel task: {str(e)}")


@router.get("/farm/{farm_id}/task-summary", response_model=FarmTaskSummaryResponse)
async def get_farm_task_summary(
    farm_id: str, current_user: dict = Depends(get_current_user)
):
    """Get summary of all tasks for a farm"""
    try:
        summary = await automation_service.get_farm_task_summary(farm_id)

        if "error" in summary:
            raise HTTPException(status_code=500, detail=summary["error"])

        return FarmTaskSummaryResponse(
            farm_id=summary["farm_id"],
            total_tasks=summary["total_tasks"],
            pending_tasks=summary["pending_tasks"],
            completed_tasks=summary["completed_tasks"],
            failed_tasks=summary["failed_tasks"],
            last_updated=datetime.fromisoformat(summary["last_updated"]),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get task summary: {str(e)}"
        )


@router.post("/sensor/process-reading")
async def process_sensor_reading(
    device_assignment_id: str,
    reading_type: str,
    value: float,
    farm_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Process sensor reading and trigger automation rules"""
    try:
        triggered_tasks = await automation_service.process_sensor_reading_triggers(
            device_assignment_id=device_assignment_id,
            reading_type=reading_type,
            value=value,
            farm_id=farm_id,
        )

        return {
            "message": "Sensor reading processed",
            "triggered_tasks": triggered_tasks,
            "automation_rules_triggered": len(triggered_tasks),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process sensor reading: {str(e)}"
        )


@router.post("/sensor/threshold-alert")
async def handle_sensor_threshold_alert(
    device_assignment_id: str,
    reading_type: str,
    current_value: float,
    threshold_value: float,
    condition: str,
    farm_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Handle sensor reading that crosses alert threshold"""
    try:
        task_id = await handle_sensor_alert_threshold(
            device_assignment_id=device_assignment_id,
            reading_type=reading_type,
            current_value=current_value,
            threshold_value=threshold_value,
            condition=condition,
            farm_id=farm_id,
        )

        if task_id:
            return {
                "message": "Sensor threshold alert triggered",
                "task_id": task_id,
                "alert_triggered": True,
            }
        else:
            return {
                "message": "Sensor reading within normal range",
                "alert_triggered": False,
            }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to handle sensor threshold: {str(e)}"
        )


# Utility endpoints for testing and debugging
@router.post("/test/irrigation")
async def test_irrigation_system(
    shelf_id: str,
    duration_seconds: int = 10,
    current_user: dict = Depends(get_current_user),
):
    """Test irrigation system with a short duration"""
    try:
        # This would trigger a test irrigation cycle
        task_id = await automation_service.schedule_irrigation_cycle(
            schedule_id="test",
            shelf_id=shelf_id,
            duration_minutes=duration_seconds / 60,  # Convert to minutes
            farm_id="test",
        )

        return {
            "message": f"Test irrigation started for {duration_seconds} seconds",
            "task_id": task_id,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to test irrigation: {str(e)}"
        )


@router.post("/test/lighting")
async def test_lighting_system(
    shelf_id: str,
    duration_seconds: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """Test lighting system with a short duration"""
    try:
        # This would trigger a test light cycle
        task_id = await automation_service.schedule_light_cycle(
            schedule_id="test",
            shelf_id=shelf_id,
            light_hours=duration_seconds / 3600,  # Convert to hours
            farm_id="test",
            start_time=datetime.utcnow(),
        )

        return {
            "message": f"Test lighting started for {duration_seconds} seconds",
            "task_id": task_id,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to test lighting: {str(e)}"
        )


@router.get("/health")
async def automation_health_check():
    """Health check for automation service"""
    try:
        # Basic health check - could be expanded
        return {
            "status": "healthy",
            "service": "farm_automation",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")
