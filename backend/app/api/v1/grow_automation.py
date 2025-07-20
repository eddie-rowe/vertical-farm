"""
Layer Two: Grow Automation API Endpoints
REST API for managing grow automation that bridges grows with device controls
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_active_user as get_current_user
from app.db.supabase_client import get_supabase_client
from app.schemas.grow_automation_schemas import (
    AutomationExecutionResponse,
    AutomationStatusResponse,
    CreateAutomationConditionRequest,
    CreateAutomationScheduleRequest,
    GrowAutomationConfigRequest,
    GrowAutomationResponse,
    UpdateAutomationScheduleRequest,
)
from app.services.grow_automation_service import grow_automation_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/grows/{grow_id}/automation/initialize")
async def initialize_grow_automation(
    grow_id: str,
    automation_config: Optional[GrowAutomationConfigRequest] = None,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Initialize automation for a grow"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        # Initialize automation
        result = await grow_automation_service.initialize_grow_automation(
            grow_id, current_user.id
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to initialize automation"),
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing automation for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/grows/{grow_id}/automation/status")
async def get_grow_automation_status(
    grow_id: str, current_user=Depends(get_current_user)
) -> AutomationStatusResponse:
    """Get automation status for a grow"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        status_data = await grow_automation_service.get_grow_automation_status(
            grow_id, current_user.id
        )

        return AutomationStatusResponse(**status_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting automation status for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/grows/{grow_id}/automation")
async def get_grow_automation(
    grow_id: str, current_user=Depends(get_current_user)
) -> GrowAutomationResponse:
    """Get all automation rules, schedules, and conditions for a grow"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        # Get automation data
        rules_response = (
            await supabase.table("grow_automation_rules")
            .select("*")
            .eq("grow_id", grow_id)
            .execute()
        )
        schedules_response = (
            await supabase.table("grow_automation_schedules")
            .select("*")
            .eq("grow_id", grow_id)
            .execute()
        )
        conditions_response = (
            await supabase.table("grow_automation_conditions")
            .select("*")
            .eq("grow_id", grow_id)
            .execute()
        )
        executions_response = (
            await supabase.table("grow_automation_executions")
            .select("*")
            .eq("grow_id", grow_id)
            .order("executed_at", desc=True)
            .limit(20)
            .execute()
        )

        # Get device assignments
        device_assignments = await grow_automation_service._get_grow_device_assignments(
            grow_id
        )

        # Get status
        status_data = await grow_automation_service.get_grow_automation_status(
            grow_id, current_user.id
        )

        return GrowAutomationResponse(
            rules=rules_response.data or [],
            schedules=schedules_response.data or [],
            conditions=conditions_response.data or [],
            executions=executions_response.data or [],
            device_assignments=device_assignments,
            status=status_data,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting automation for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post("/grows/{grow_id}/automation/schedules")
async def create_automation_schedule(
    grow_id: str,
    schedule_data: CreateAutomationScheduleRequest,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new automation schedule"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        # Create schedule
        schedule_dict = schedule_data.dict()
        schedule_dict["grow_id"] = grow_id
        schedule_dict["created_by"] = current_user.id

        response = (
            await supabase.table("grow_automation_schedules")
            .insert(schedule_dict)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create automation schedule",
            )

        return {"success": True, "schedule": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating automation schedule for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put("/automation/schedules/{schedule_id}")
async def update_automation_schedule(
    schedule_id: str,
    schedule_data: UpdateAutomationScheduleRequest,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Update an automation schedule"""
    try:
        supabase = get_supabase_client()

        # Verify user owns the schedule (through grow ownership)
        schedule_response = (
            await supabase.table("grow_automation_schedules")
            .select("*, grows!inner(created_by)")
            .eq("id", schedule_id)
            .single()
            .execute()
        )

        if (
            not schedule_response.data
            or schedule_response.data["grows"]["created_by"] != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Schedule not found or access denied",
            )

        # Update schedule
        update_dict = {k: v for k, v in schedule_data.dict().items() if v is not None}

        response = (
            await supabase.table("grow_automation_schedules")
            .update(update_dict)
            .eq("id", schedule_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update automation schedule",
            )

        return {"success": True, "schedule": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating automation schedule {schedule_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.delete("/automation/schedules/{schedule_id}")
async def delete_automation_schedule(
    schedule_id: str, current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete an automation schedule"""
    try:
        supabase = get_supabase_client()

        # Verify user owns the schedule (through grow ownership)
        schedule_response = (
            await supabase.table("grow_automation_schedules")
            .select("*, grows!inner(created_by)")
            .eq("id", schedule_id)
            .single()
            .execute()
        )

        if (
            not schedule_response.data
            or schedule_response.data["grows"]["created_by"] != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Schedule not found or access denied",
            )

        # Delete schedule
        response = (
            await supabase.table("grow_automation_schedules")
            .delete()
            .eq("id", schedule_id)
            .execute()
        )

        return {"success": True, "message": "Schedule deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting automation schedule {schedule_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post("/grows/{grow_id}/automation/conditions")
async def create_automation_condition(
    grow_id: str,
    condition_data: CreateAutomationConditionRequest,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new automation condition"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        # Create condition
        condition_dict = condition_data.dict()
        condition_dict["grow_id"] = grow_id
        condition_dict["created_by"] = current_user.id

        response = (
            await supabase.table("grow_automation_conditions")
            .insert(condition_dict)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create automation condition",
            )

        return {"success": True, "condition": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating automation condition for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/grows/{grow_id}/automation/executions")
async def get_automation_executions(
    grow_id: str, limit: int = 50, current_user=Depends(get_current_user)
) -> List[AutomationExecutionResponse]:
    """Get automation execution history for a grow"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        # Get executions
        executions_response = (
            await supabase.table("grow_automation_executions")
            .select("*")
            .eq("grow_id", grow_id)
            .order("executed_at", desc=True)
            .limit(limit)
            .execute()
        )

        return [
            AutomationExecutionResponse(**execution)
            for execution in executions_response.data or []
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting automation executions for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post("/grows/{grow_id}/automation/toggle")
async def toggle_grow_automation(
    grow_id: str, enabled: bool, current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Enable or disable automation for a grow"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        # Update automation status
        update_response = (
            await supabase.table("grows")
            .update({"automation_enabled": enabled})
            .eq("id", grow_id)
            .execute()
        )

        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update automation status",
            )

        # Start or stop automation monitoring
        if enabled:
            await grow_automation_service.initialize_grow_automation(
                grow_id, current_user.id
            )
        else:
            await grow_automation_service.stop_grow_automation(grow_id)

        return {
            "success": True,
            "grow_id": grow_id,
            "automation_enabled": enabled,
            "message": f"Automation {'enabled' if enabled else 'disabled'} for grow",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling automation for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/automation/device-profiles")
async def get_device_profiles(
    device_type: Optional[str] = None,
    crop_id: Optional[str] = None,
    current_user=Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get available device profiles for automation"""
    try:
        supabase = get_supabase_client()

        query = supabase.table("grow_device_profiles").select("*")

        # Filter by device type
        if device_type:
            query = query.eq("device_type", device_type)

        # Filter by crop type
        if crop_id:
            query = query.eq("crop_id", crop_id)

        # Get templates and user's custom profiles
        query = query.or_(f"is_template.eq.true,created_by.eq.{current_user.id}")

        response = await query.execute()

        return response.data or []

    except Exception as e:
        logger.error(f"Error getting device profiles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post("/grows/{grow_id}/automation/manual-execute")
async def manually_execute_automation(
    grow_id: str,
    device_assignment_id: str,
    action: Dict[str, Any],
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Manually execute an automation action"""
    try:
        # Verify user owns the grow
        supabase = get_supabase_client()
        grow_response = (
            await supabase.table("grows")
            .select("id, created_by")
            .eq("id", grow_id)
            .eq("created_by", current_user.id)
            .single()
            .execute()
        )

        if not grow_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grow not found or access denied",
            )

        # Execute action via device monitoring service
        from app.services.device_monitoring_service import device_monitoring_service

        result = await device_monitoring_service.execute_device_action(
            device_assignment_id, action
        )

        # Log execution
        execution_data = {
            "grow_id": grow_id,
            "automation_type": "manual",
            "device_assignment_id": device_assignment_id,
            "action_taken": action,
            "execution_status": "success" if result.get("success") else "failed",
            "execution_result": result,
            "error_message": result.get("error") if not result.get("success") else None,
            "completed_at": "now()",
        }

        await supabase.table("grow_automation_executions").insert(
            execution_data
        ).execute()

        return {
            "success": result.get("success", False),
            "message": (
                "Action executed successfully"
                if result.get("success")
                else "Action failed"
            ),
            "result": result,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error manually executing automation for grow {grow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
