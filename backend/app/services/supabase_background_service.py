"""
Supabase Background Task Service
Replaces Redis-based background processing with Supabase queues and Edge Functions
"""

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import httpx
from supabase import Client, create_client

from app.core.config import settings


@dataclass
class TaskMessage:
    id: str
    type: str
    priority: str  # 'critical', 'high', 'normal', 'low'
    payload: dict[str, Any]
    metadata: dict[str, Any]


@dataclass
class QueueStats:
    queue_name: str
    queue_length: int
    oldest_msg_age_seconds: int


class SupabaseBackgroundService:
    """Service for managing background tasks using Supabase queues and Edge Functions"""

    def __init__(self) -> None:
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
        )
        self.http_client = httpx.AsyncClient()

    async def queue_task(
        self,
        task_type: str,
        payload: dict[str, Any],
        priority: str = "normal",
        user_id: str | None = None,
        max_retries: int = 3,
    ) -> str:
        """Queue a background task for processing"""

        task_id = f"task_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8]}"

        task_message = TaskMessage(
            id=task_id,
            type=task_type,
            priority=priority,
            payload=payload,
            metadata={
                "created_at": datetime.now().isoformat(),
                "retry_count": 0,
                "max_retries": max_retries,
                "user_id": user_id,
            },
        )

        # Use Supabase function to queue the task
        result = self.supabase.rpc(
            "queue_background_task",
            {
                "task_type": task_type,
                "priority": priority,
                "payload": payload,
                "user_id_param": user_id,
            },
        ).execute()

        if result.data:
            return result.data
        else:
            raise Exception(f"Failed to queue task: {result}")

    async def get_queue_stats(self) -> list[QueueStats]:
        """Get statistics for all queues"""

        result = self.supabase.rpc("get_queue_stats").execute()

        if result.data:
            return [
                QueueStats(
                    queue_name=row["queue_name"],
                    queue_length=row["queue_length"],
                    oldest_msg_age_seconds=row["oldest_msg_age_seconds"],
                )
                for row in result.data
            ]
        else:
            return []

    async def get_task_logs(
        self,
        limit: int = 100,
        task_type: str | None = None,
        success: bool | None = None,
    ) -> list[dict[str, Any]]:
        """Get task execution logs"""

        query = (
            self.supabase.table("task_logs")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
        )

        if task_type:
            query = query.eq("task_type", task_type)

        if success is not None:
            query = query.eq("success", success)

        result = query.execute()
        return result.data or []

    async def trigger_queue_processing(self) -> dict[str, Any]:
        """Manually trigger queue processing via Edge Function"""

        try:
            response = await self.http_client.post(
                f"{settings.SUPABASE_URL}/functions/v1/queue-scheduler",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json",
                },
                json={"action": "process_queues"},
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to trigger processing: {response.status_code}")

        except Exception as e:
            raise Exception(f"Error triggering queue processing: {str(e)}")

    async def schedule_recurring_tasks(self) -> dict[str, Any]:
        """Trigger scheduling of recurring tasks"""

        try:
            response = await self.http_client.post(
                f"{settings.SUPABASE_URL}/functions/v1/queue-scheduler",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json",
                },
                json={"action": "schedule_recurring_tasks"},
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to schedule tasks: {response.status_code}")

        except Exception as e:
            raise Exception(f"Error scheduling recurring tasks: {str(e)}")

    async def cleanup_old_tasks(self) -> dict[str, Any]:
        """Trigger cleanup of old task logs and data"""

        try:
            response = await self.http_client.post(
                f"{settings.SUPABASE_URL}/functions/v1/queue-scheduler",
                headers={
                    "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json",
                },
                json={"action": "cleanup_old_tasks"},
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to cleanup: {response.status_code}")

        except Exception as e:
            raise Exception(f"Error cleaning up tasks: {str(e)}")

    # Home Assistant specific task methods
    async def schedule_device_discovery(self, user_id: str) -> str:
        """Schedule a device discovery task"""
        return await self.queue_task(
            task_type="home_assistant.device_discovery",
            payload={"user_id": user_id},
            priority="normal",
            user_id=user_id,
        )

    async def schedule_state_sync(self, user_id: str) -> str:
        """Schedule a state synchronization task"""
        return await self.queue_task(
            task_type="home_assistant.state_sync",
            payload={"user_id": user_id},
            priority="high",
            user_id=user_id,
        )

    async def schedule_health_check(self, user_id: str) -> str:
        """Schedule a health check task"""
        return await self.queue_task(
            task_type="home_assistant.health_check",
            payload={"user_id": user_id},
            priority="normal",
            user_id=user_id,
        )

    async def schedule_bulk_control(
        self,
        user_id: str,
        entity_ids: list[str],
        action: str,
        value: int | None = None,
    ) -> str:
        """Schedule a bulk device control task"""
        return await self.queue_task(
            task_type="home_assistant.bulk_control",
            payload={
                "user_id": user_id,
                "entity_ids": entity_ids,
                "action": action,
                "value": value,
            },
            priority="high",
            user_id=user_id,
        )

    async def schedule_data_collection(
        self, user_id: str, entity_ids: list[str], time_range: int = 3600
    ) -> str:
        """Schedule a data collection task"""
        return await self.queue_task(
            task_type="home_assistant.data_collection",
            payload={
                "user_id": user_id,
                "entity_ids": entity_ids,
                "time_range": time_range,
            },
            priority="low",
            user_id=user_id,
        )

    async def get_system_health(self) -> dict[str, Any]:
        """Get overall system health status"""

        # Get queue stats
        queue_stats = await self.get_queue_stats()

        # Get recent task logs
        recent_logs = await self.get_task_logs(limit=50)

        # Calculate success rate
        if recent_logs:
            successful_tasks = sum(1 for log in recent_logs if log["success"])
            success_rate = (successful_tasks / len(recent_logs)) * 100
        else:
            success_rate = 100

        # Check for any critical issues
        total_queue_length = sum(stat.queue_length for stat in queue_stats)
        has_old_messages = any(
            stat.oldest_msg_age_seconds > 3600 for stat in queue_stats
        )  # 1 hour

        # Determine overall health
        if success_rate < 80 or total_queue_length > 100 or has_old_messages:
            health_status = "unhealthy"
        elif success_rate < 95 or total_queue_length > 50:
            health_status = "degraded"
        else:
            health_status = "healthy"

        return {
            "status": health_status,
            "success_rate": success_rate,
            "total_queue_length": total_queue_length,
            "queue_stats": [
                {
                    "queue_name": stat.queue_name,
                    "queue_length": stat.queue_length,
                    "oldest_msg_age_seconds": stat.oldest_msg_age_seconds,
                }
                for stat in queue_stats
            ],
            "recent_task_count": len(recent_logs),
            "timestamp": datetime.now().isoformat(),
        }

    async def get_registered_functions(self) -> list[dict[str, Any]]:
        """Get list of available background task types"""

        return [
            {
                "name": "home_assistant.device_discovery",
                "description": "Discover and sync Home Assistant devices",
                "priority": "normal",
                "estimated_duration": "10-30 seconds",
            },
            {
                "name": "home_assistant.state_sync",
                "description": "Synchronize device states with Home Assistant",
                "priority": "high",
                "estimated_duration": "5-15 seconds",
            },
            {
                "name": "home_assistant.health_check",
                "description": "Check Home Assistant connection health",
                "priority": "normal",
                "estimated_duration": "1-5 seconds",
            },
            {
                "name": "home_assistant.bulk_control",
                "description": "Control multiple devices simultaneously",
                "priority": "high",
                "estimated_duration": "5-20 seconds",
            },
            {
                "name": "home_assistant.scheduled_action",
                "description": "Execute scheduled device actions",
                "priority": "normal",
                "estimated_duration": "5-15 seconds",
            },
            {
                "name": "home_assistant.data_collection",
                "description": "Collect historical device data",
                "priority": "low",
                "estimated_duration": "30-120 seconds",
            },
        ]

    async def close(self) -> None:
        """Clean up resources"""
        await self.http_client.aclose()


# Global instance
supabase_background_service = SupabaseBackgroundService()
