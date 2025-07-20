import asyncio
import json
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

import redis.asyncio as redis

from .error_handling import global_error_handler

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    """Task execution status"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority levels"""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class TaskResult:
    """Result of task execution"""

    success: bool
    result: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    retry_count: int = 0
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class BackgroundTask:
    """Background task definition"""

    id: str
    name: str
    function_name: str
    args: List[Any]
    kwargs: Dict[str, Any]
    priority: TaskPriority = TaskPriority.NORMAL
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: float = 300.0  # 5 minutes default
    scheduled_at: Optional[datetime] = None
    created_at: datetime = None
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[TaskResult] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        # Convert datetime objects to ISO strings for JSON serialization
        if data["created_at"]:
            data["created_at"] = data["created_at"].isoformat()
        if data["scheduled_at"]:
            data["scheduled_at"] = data["scheduled_at"].isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BackgroundTask":
        # Convert ISO strings back to datetime objects
        if data.get("created_at"):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if data.get("scheduled_at"):
            data["scheduled_at"] = datetime.fromisoformat(data["scheduled_at"])

        # Handle TaskResult if present
        if data.get("result") and isinstance(data["result"], dict):
            data["result"] = TaskResult(**data["result"])

        return cls(**data)


class TaskRegistry:
    """Registry for background task functions"""

    def __init__(self):
        self._functions: Dict[str, Callable] = {}

    def register(self, name: str, func: Callable):
        """Register a function for background execution"""
        self._functions[name] = func
        logger.info(f"Registered background task function: {name}")

    def get(self, name: str) -> Optional[Callable]:
        """Get a registered function by name"""
        return self._functions.get(name)

    def list_functions(self) -> List[str]:
        """List all registered function names"""
        return list(self._functions.keys())


class BackgroundProcessor:
    """Main background processing system"""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        queue_name: str = "background_tasks",
        max_workers: int = 4,
        poll_interval: float = 1.0,
    ):
        self.redis_url = redis_url
        self.queue_name = queue_name
        self.max_workers = max_workers
        self.poll_interval = poll_interval

        self.redis_client: Optional[redis.Redis] = None
        self.task_registry = TaskRegistry()
        self.workers: List[asyncio.Task] = []
        self.scheduler_task: Optional[asyncio.Task] = None
        self.running = False

        # Metrics
        self.metrics = {
            "tasks_processed": 0,
            "tasks_failed": 0,
            "tasks_retried": 0,
            "average_execution_time": 0.0,
            "active_workers": 0,
            "queue_size": 0,
        }

    async def initialize(self):
        """Initialize Redis connection and background services"""
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            await self.redis_client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")

            # Register with error handler
            global_error_handler.register_service(
                "background_processor",
                max_failures=10,
                circuit_breaker_timeout=60.0,
                retry_config={
                    "max_attempts": 3,
                    "strategy": "exponential_backoff",
                    "base_delay": 1.0,
                    "max_delay": 30.0,
                },
            )

        except Exception as e:
            logger.error(f"Failed to initialize background processor: {e}")
            raise

    async def start(self):
        """Start the background processing system"""
        if self.running:
            logger.warning("Background processor is already running")
            return

        await self.initialize()
        self.running = True

        # Start worker tasks
        for i in range(self.max_workers):
            worker_task = asyncio.create_task(self._worker_loop(f"worker-{i}"))
            self.workers.append(worker_task)

        # Start scheduler task
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())

        logger.info(f"Started background processor with {self.max_workers} workers")

    async def stop(self):
        """Stop the background processing system"""
        if not self.running:
            return

        self.running = False

        # Cancel all workers
        for worker in self.workers:
            worker.cancel()

        # Cancel scheduler
        if self.scheduler_task:
            self.scheduler_task.cancel()

        # Wait for all tasks to complete
        all_tasks = self.workers + (
            [self.scheduler_task] if self.scheduler_task else []
        )
        if all_tasks:
            await asyncio.gather(*all_tasks, return_exceptions=True)

        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()

        self.workers.clear()
        self.scheduler_task = None

        logger.info("Background processor stopped")

    def register_task(self, name: str, func: Callable):
        """Register a function for background execution"""
        self.task_registry.register(name, func)

    async def enqueue_task(
        self,
        function_name: str,
        *args,
        priority: TaskPriority = TaskPriority.NORMAL,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        timeout: float = 300.0,
        scheduled_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> str:
        """Enqueue a task for background execution"""

        task_id = str(uuid.uuid4())
        task = BackgroundTask(
            id=task_id,
            name=function_name,
            function_name=function_name,
            args=list(args),
            kwargs=kwargs,
            priority=priority,
            max_retries=max_retries,
            retry_delay=retry_delay,
            timeout=timeout,
            scheduled_at=scheduled_at,
            metadata=metadata or {},
        )

        # Determine queue based on priority and scheduling
        if scheduled_at and scheduled_at > datetime.utcnow():
            # Scheduled task
            queue_key = f"{self.queue_name}:scheduled"
            score = scheduled_at.timestamp()
            await self.redis_client.zadd(queue_key, {json.dumps(task.to_dict()): score})
        else:
            # Immediate task
            queue_key = f"{self.queue_name}:{priority.value}"
            await self.redis_client.lpush(queue_key, json.dumps(task.to_dict()))

        # Store task metadata
        await self.redis_client.hset(
            f"{self.queue_name}:tasks", task_id, json.dumps(task.to_dict())
        )

        logger.info(f"Enqueued task {task_id}: {function_name}")
        return task_id

    async def get_task_status(self, task_id: str) -> Optional[BackgroundTask]:
        """Get the current status of a task"""
        task_data = await self.redis_client.hget(f"{self.queue_name}:tasks", task_id)
        if task_data:
            return BackgroundTask.from_dict(json.loads(task_data))
        return None

    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending task"""
        task = await self.get_task_status(task_id)
        if not task or task.status not in [TaskStatus.PENDING, TaskStatus.RETRYING]:
            return False

        task.status = TaskStatus.CANCELLED
        await self.redis_client.hset(
            f"{self.queue_name}:tasks", task_id, json.dumps(task.to_dict())
        )

        logger.info(f"Cancelled task {task_id}")
        return True

    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        stats = {}

        # Queue sizes by priority
        for priority in TaskPriority:
            queue_key = f"{self.queue_name}:{priority.value}"
            size = await self.redis_client.llen(queue_key)
            stats[f"queue_{priority.value}"] = size

        # Scheduled tasks
        scheduled_key = f"{self.queue_name}:scheduled"
        scheduled_count = await self.redis_client.zcard(scheduled_key)
        stats["scheduled_tasks"] = scheduled_count

        # Total tasks in system
        total_tasks = await self.redis_client.hlen(f"{self.queue_name}:tasks")
        stats["total_tasks"] = total_tasks

        # Metrics
        stats.update(self.metrics)

        return stats

    async def _get_next_task(self) -> Optional[BackgroundTask]:
        """Get the next task to process (priority-based)"""
        # Check priority queues in order
        for priority in [
            TaskPriority.CRITICAL,
            TaskPriority.HIGH,
            TaskPriority.NORMAL,
            TaskPriority.LOW,
        ]:
            queue_key = f"{self.queue_name}:{priority.value}"
            task_data = await self.redis_client.rpop(queue_key)

            if task_data:
                task = BackgroundTask.from_dict(json.loads(task_data))

                # Check if task was cancelled
                current_task = await self.get_task_status(task.id)
                if current_task and current_task.status == TaskStatus.CANCELLED:
                    continue

                return task

        return None

    async def _worker_loop(self, worker_id: str):
        """Main worker loop for processing tasks"""
        logger.info(f"Worker {worker_id} started")

        while self.running:
            try:
                self.metrics["active_workers"] = len(
                    [w for w in self.workers if not w.done()]
                )

                # Get next task
                task = await self._get_next_task()
                if not task:
                    await asyncio.sleep(self.poll_interval)
                    continue

                # Process the task
                await self._process_task(task, worker_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(self.poll_interval)

        logger.info(f"Worker {worker_id} stopped")

    async def _process_task(self, task: BackgroundTask, worker_id: str):
        """Process a single task"""
        start_time = time.time()

        # Update task status
        task.status = TaskStatus.RUNNING
        await self._update_task(task)

        logger.info(f"Worker {worker_id} processing task {task.id}: {task.name}")

        try:
            # Get the function
            func = self.task_registry.get(task.function_name)
            if not func:
                raise ValueError(f"Function {task.function_name} not registered")

            # Execute with error handling and timeout
            result = await global_error_handler.execute_with_retry(
                "background_processor",
                self._execute_task_with_timeout,
                func,
                task.args,
                task.kwargs,
                task.timeout,
            )

            # Task completed successfully
            execution_time = time.time() - start_time
            task.status = TaskStatus.COMPLETED
            task.result = TaskResult(
                success=True,
                result=result,
                execution_time=execution_time,
                retry_count=0,
            )

            self.metrics["tasks_processed"] += 1
            self._update_average_execution_time(execution_time)

            logger.info(f"Task {task.id} completed in {execution_time:.2f}s")

        except Exception as e:
            # Task failed
            execution_time = time.time() - start_time
            error_msg = str(e)

            logger.error(f"Task {task.id} failed: {error_msg}")

            # Check if we should retry
            if task.result is None:
                task.result = TaskResult(success=False, retry_count=0)

            task.result.retry_count += 1

            if task.result.retry_count <= task.max_retries:
                # Retry the task
                task.status = TaskStatus.RETRYING
                task.result.error = error_msg
                task.result.execution_time = execution_time

                # Re-enqueue with delay
                await asyncio.sleep(task.retry_delay * task.result.retry_count)
                queue_key = f"{self.queue_name}:{task.priority.value}"
                await self.redis_client.lpush(queue_key, json.dumps(task.to_dict()))

                self.metrics["tasks_retried"] += 1
                logger.info(
                    f"Task {task.id} queued for retry {task.result.retry_count}/{task.max_retries}"
                )
            else:
                # Max retries exceeded
                task.status = TaskStatus.FAILED
                task.result.success = False
                task.result.error = error_msg
                task.result.execution_time = execution_time

                self.metrics["tasks_failed"] += 1
                logger.error(
                    f"Task {task.id} failed permanently after {task.max_retries} retries"
                )

        finally:
            await self._update_task(task)

    async def _execute_task_with_timeout(
        self, func: Callable, args: List[Any], kwargs: Dict[str, Any], timeout: float
    ):
        """Execute a task function with timeout"""
        if asyncio.iscoroutinefunction(func):
            return await asyncio.wait_for(func(*args, **kwargs), timeout=timeout)
        else:
            # Run sync function in thread pool
            loop = asyncio.get_event_loop()
            return await asyncio.wait_for(
                loop.run_in_executor(None, lambda: func(*args, **kwargs)),
                timeout=timeout,
            )

    async def _scheduler_loop(self):
        """Process scheduled tasks"""
        logger.info("Scheduler started")

        while self.running:
            try:
                current_time = datetime.utcnow().timestamp()
                scheduled_key = f"{self.queue_name}:scheduled"

                # Get tasks that are ready to run
                ready_tasks = await self.redis_client.zrangebyscore(
                    scheduled_key, 0, current_time, withscores=True
                )

                for task_data, score in ready_tasks:
                    # Remove from scheduled queue
                    await self.redis_client.zrem(scheduled_key, task_data)

                    # Add to appropriate priority queue
                    task = BackgroundTask.from_dict(json.loads(task_data))
                    queue_key = f"{self.queue_name}:{task.priority.value}"
                    await self.redis_client.lpush(queue_key, task_data)

                    logger.info(f"Scheduled task {task.id} is now ready for execution")

                await asyncio.sleep(10)  # Check every 10 seconds

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(10)

        logger.info("Scheduler stopped")

    async def _update_task(self, task: BackgroundTask):
        """Update task in Redis"""
        await self.redis_client.hset(
            f"{self.queue_name}:tasks", task.id, json.dumps(task.to_dict())
        )

    def _update_average_execution_time(self, execution_time: float):
        """Update average execution time metric"""
        current_avg = self.metrics["average_execution_time"]
        total_processed = self.metrics["tasks_processed"]

        if total_processed == 1:
            self.metrics["average_execution_time"] = execution_time
        else:
            # Running average
            self.metrics["average_execution_time"] = (
                current_avg * (total_processed - 1) + execution_time
            ) / total_processed


# Global background processor instance with environment variable configuration
background_processor = BackgroundProcessor(
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
    queue_name=os.getenv("BACKGROUND_TASK_QUEUE_NAME", "background_tasks"),
    max_workers=int(os.getenv("BACKGROUND_TASK_WORKERS", "4")),
    poll_interval=float(os.getenv("BACKGROUND_TASK_POLL_INTERVAL", "1.0")),
)


# Decorator for registering background tasks
def background_task(
    name: Optional[str] = None,
    priority: TaskPriority = TaskPriority.NORMAL,
    max_retries: int = 3,
    retry_delay: float = 1.0,
    timeout: float = 300.0,
):
    """Decorator to register a function as a background task"""

    def decorator(func: Callable):
        task_name = name or func.__name__
        background_processor.register_task(task_name, func)

        # Add metadata to function
        func._background_task_config = {
            "name": task_name,
            "priority": priority,
            "max_retries": max_retries,
            "retry_delay": retry_delay,
            "timeout": timeout,
        }

        return func

    return decorator


# Context manager for background processor lifecycle
@asynccontextmanager
async def background_processor_lifespan():
    """Context manager for background processor lifecycle"""
    try:
        await background_processor.start()
        yield background_processor
    finally:
        await background_processor.stop()
