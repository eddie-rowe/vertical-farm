"""
Enhanced Error Handling and Recovery Service

This module provides comprehensive error handling, retry mechanisms, and recovery
procedures for the Home Assistant integration with circuit breaker patterns,
automatic recovery, and enhanced monitoring.
"""

import asyncio
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

import aiohttp
from websockets.exceptions import ConnectionClosed, WebSocketException

logger = logging.getLogger(__name__)


class ErrorType(Enum):
    """Classification of error types for appropriate handling"""

    CONNECTION_ERROR = "connection_error"
    AUTHENTICATION_ERROR = "authentication_error"
    RATE_LIMIT_ERROR = "rate_limit_error"
    VALIDATION_ERROR = "validation_error"
    TIMEOUT_ERROR = "timeout_error"
    SERVICE_UNAVAILABLE = "service_unavailable"
    UNKNOWN_ERROR = "unknown_error"
    CONFIGURATION_ERROR = "configuration_error"
    NETWORK_ERROR = "network_error"
    PERMISSION_ERROR = "permission_error"


class CircuitState(Enum):
    """Circuit breaker states"""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Circuit is open, failing fast
    HALF_OPEN = "half_open"  # Testing if service has recovered


class RecoveryStrategy(Enum):
    """Different recovery strategies for error handling"""

    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"
    FIXED_DELAY = "fixed_delay"
    ADAPTIVE = "adaptive"
    CIRCUIT_BREAKER = "circuit_breaker"


@dataclass
class RetryConfig:
    """Configuration for retry behavior"""

    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_errors: List[ErrorType] = field(
        default_factory=lambda: [
            ErrorType.CONNECTION_ERROR,
            ErrorType.TIMEOUT_ERROR,
            ErrorType.SERVICE_UNAVAILABLE,
            ErrorType.RATE_LIMIT_ERROR,
            ErrorType.NETWORK_ERROR,
        ]
    )
    recovery_strategy: RecoveryStrategy = RecoveryStrategy.EXPONENTIAL_BACKOFF


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior"""

    failure_threshold: int = 5
    recovery_timeout: float = 30.0
    success_threshold: int = 3
    monitoring_window: float = 300.0  # 5 minutes
    half_open_max_attempts: int = 3


@dataclass
class HealthCheckConfig:
    """Configuration for health checks"""

    enabled: bool = True
    interval: float = 60.0  # 1 minute
    timeout: float = 10.0
    failure_threshold: int = 3
    recovery_threshold: int = 2


class HomeAssistantError(Exception):
    """Base exception for Home Assistant errors with enhanced context"""

    def __init__(
        self,
        message: str,
        error_type: ErrorType = ErrorType.UNKNOWN_ERROR,
        retryable: bool = False,
        context: Optional[Dict[str, Any]] = None,
        original_error: Optional[Exception] = None,
        service_name: Optional[str] = None,
        recovery_suggestions: Optional[List[str]] = None,
    ):
        super().__init__(message)
        self.error_type = error_type
        self.retryable = retryable
        self.context = context or {}
        self.original_error = original_error
        self.service_name = service_name
        self.recovery_suggestions = recovery_suggestions or []
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for JSON serialization"""
        return {
            "message": str(self),
            "error_type": self.error_type.value,
            "retryable": self.retryable,
            "context": self.context,
            "service_name": self.service_name,
            "recovery_suggestions": self.recovery_suggestions,
            "timestamp": self.timestamp.isoformat(),
            "original_error_type": (
                type(self.original_error).__name__ if self.original_error else None
            ),
        }

    def __str__(self) -> str:
        base_msg = super().__str__()
        if self.service_name:
            return f"[{self.service_name}] {base_msg}"
        return base_msg


@dataclass
class ErrorMetrics:
    """Metrics for tracking errors and recovery"""

    total_errors: int = 0
    consecutive_failures: int = 0
    error_types: Dict[ErrorType, int] = field(default_factory=dict)
    last_error_time: Optional[datetime] = None
    recovery_count: int = 0
    circuit_breaker_triggers: int = 0
    average_recovery_time: float = 0.0
    health_check_failures: int = 0
    health_check_successes: int = 0


@dataclass
class CircuitBreaker:
    """Circuit breaker for service protection"""

    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[datetime] = None
    next_attempt_time: Optional[datetime] = None
    config: CircuitBreakerConfig = field(default_factory=CircuitBreakerConfig)

    def should_attempt(self) -> bool:
        """Check if we should attempt the operation"""
        if self.state == CircuitState.CLOSED:
            return True
        elif self.state == CircuitState.OPEN:
            if self.next_attempt_time and datetime.now() >= self.next_attempt_time:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        elif self.state == CircuitState.HALF_OPEN:
            return self.success_count < self.config.half_open_max_attempts
        return False

    def record_success(self):
        """Record a successful operation"""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                logger.info("Circuit breaker closed - service recovered")
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def record_failure(self):
        """Record a failed operation"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.state == CircuitState.CLOSED:
            if self.failure_count >= self.config.failure_threshold:
                self.state = CircuitState.OPEN
                self.next_attempt_time = datetime.now() + timedelta(
                    seconds=self.config.recovery_timeout
                )
                logger.warning(
                    f"Circuit breaker opened - failure threshold reached ({self.failure_count})"
                )
        elif self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            self.next_attempt_time = datetime.now() + timedelta(
                seconds=self.config.recovery_timeout
            )
            self.success_count = 0
            logger.warning("Circuit breaker reopened - service still failing")


class ErrorHandler:
    """Enhanced error handler with comprehensive recovery mechanisms"""

    def __init__(self):
        self.retry_configs: Dict[str, RetryConfig] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.metrics: Dict[str, ErrorMetrics] = {}
        self.health_checks: Dict[str, HealthCheckConfig] = {}
        self.error_callbacks: List[Callable[[HomeAssistantError], None]] = []
        self.recovery_callbacks: Dict[str, Callable[[], Any]] = {}
        self.background_tasks: List[asyncio.Task] = []
        self._health_check_running = False

    def register_service(
        self,
        service_name: str,
        retry_config: RetryConfig,
        circuit_config: Optional[CircuitBreakerConfig] = None,
        health_config: Optional[HealthCheckConfig] = None,
    ):
        """Register a service with error handling configuration"""
        self.retry_configs[service_name] = retry_config
        self.circuit_breakers[service_name] = CircuitBreaker(
            config=circuit_config or CircuitBreakerConfig()
        )
        self.metrics[service_name] = ErrorMetrics()
        if health_config:
            self.health_checks[service_name] = health_config

        logger.info(f"Registered service '{service_name}' with error handling")

    def register_recovery_callback(
        self, service_name: str, callback: Callable[[], Any]
    ):
        """Register a recovery callback for automatic service recovery"""
        self.recovery_callbacks[service_name] = callback
        logger.info(f"Registered recovery callback for service '{service_name}'")

    def add_error_callback(self, callback: Callable[[HomeAssistantError], None]):
        """Add a callback to be called when errors occur"""
        self.error_callbacks.append(callback)

    def start_health_monitoring(self):
        """Start background health monitoring"""
        if not self._health_check_running:
            self._health_check_running = True
            task = asyncio.create_task(self._health_monitor_loop())
            self.background_tasks.append(task)
            logger.info("Started health monitoring")

    async def stop_health_monitoring(self):
        """Stop background health monitoring"""
        self._health_check_running = False
        for task in self.background_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        self.background_tasks.clear()
        logger.info("Stopped health monitoring")

    async def _health_monitor_loop(self):
        """Background health monitoring loop"""
        while self._health_check_running:
            try:
                for service_name, health_config in self.health_checks.items():
                    if health_config.enabled:
                        await self._perform_health_check(service_name, health_config)

                await asyncio.sleep(
                    min(config.interval for config in self.health_checks.values())
                    or 60.0
                )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in health monitoring loop: {e}")
                await asyncio.sleep(30)

    async def _perform_health_check(
        self, service_name: str, health_config: HealthCheckConfig
    ):
        """Perform health check for a specific service"""
        try:
            metrics = self.metrics.get(service_name, ErrorMetrics())
            circuit = self.circuit_breakers.get(service_name)

            # Simple health check - check if circuit is closed and no recent failures
            if circuit and circuit.state == CircuitState.CLOSED:
                recent_failures = (
                    circuit.last_failure_time
                    and (datetime.now() - circuit.last_failure_time).total_seconds()
                    < health_config.interval * 2
                )

                if not recent_failures:
                    metrics.health_check_successes += 1
                    return True

            metrics.health_check_failures += 1

            # Attempt recovery if service is failing
            if (
                metrics.health_check_failures >= health_config.failure_threshold
                and service_name in self.recovery_callbacks
            ):

                logger.info(
                    f"Attempting automatic recovery for service '{service_name}'"
                )
                try:
                    await self.recovery_callbacks[service_name]()
                    logger.info(
                        f"Recovery attempt completed for service '{service_name}'"
                    )
                except Exception as e:
                    logger.error(f"Recovery failed for service '{service_name}': {e}")

        except Exception as e:
            logger.error(f"Health check failed for service '{service_name}': {e}")

    def classify_error(self, error: Exception) -> ErrorType:
        """Classify an error for appropriate handling"""
        if isinstance(error, aiohttp.ClientConnectorError):
            return ErrorType.CONNECTION_ERROR
        elif isinstance(error, aiohttp.ClientResponseError):
            if error.status == 401:
                return ErrorType.AUTHENTICATION_ERROR
            elif error.status == 403:
                return ErrorType.PERMISSION_ERROR
            elif error.status == 429:
                return ErrorType.RATE_LIMIT_ERROR
            elif error.status >= 500:
                return ErrorType.SERVICE_UNAVAILABLE
            elif error.status == 422:
                return ErrorType.VALIDATION_ERROR
            else:
                return ErrorType.VALIDATION_ERROR
        elif isinstance(error, asyncio.TimeoutError):
            return ErrorType.TIMEOUT_ERROR
        elif isinstance(error, (ConnectionClosed, WebSocketException)):
            return ErrorType.CONNECTION_ERROR
        elif isinstance(error, (OSError, ConnectionError)):
            return ErrorType.NETWORK_ERROR
        else:
            return ErrorType.UNKNOWN_ERROR

    def get_recovery_suggestions(
        self, error_type: ErrorType, context: Dict[str, Any]
    ) -> List[str]:
        """Get recovery suggestions based on error type"""
        suggestions = {
            ErrorType.CONNECTION_ERROR: [
                "Check network connectivity",
                "Verify Home Assistant URL is accessible",
                "Check if Home Assistant is running",
                "Verify firewall settings",
            ],
            ErrorType.AUTHENTICATION_ERROR: [
                "Check access token validity",
                "Regenerate Home Assistant long-lived access token",
                "Verify token has required permissions",
            ],
            ErrorType.RATE_LIMIT_ERROR: [
                "Reduce request frequency",
                "Implement request queuing",
                "Check Home Assistant rate limiting configuration",
            ],
            ErrorType.VALIDATION_ERROR: [
                "Check request parameters",
                "Verify entity IDs exist",
                "Check service call parameters",
            ],
            ErrorType.TIMEOUT_ERROR: [
                "Increase timeout values",
                "Check network latency",
                "Verify Home Assistant performance",
            ],
            ErrorType.SERVICE_UNAVAILABLE: [
                "Check Home Assistant status",
                "Verify service dependencies",
                "Check system resources",
            ],
            ErrorType.CONFIGURATION_ERROR: [
                "Verify configuration settings",
                "Check required parameters",
                "Validate configuration format",
            ],
            ErrorType.NETWORK_ERROR: [
                "Check network connectivity",
                "Verify DNS resolution",
                "Check proxy settings",
            ],
            ErrorType.PERMISSION_ERROR: [
                "Check user permissions",
                "Verify access token scopes",
                "Check Home Assistant user role",
            ],
        }
        return suggestions.get(error_type, ["Check logs for more details"])

    def create_enhanced_error(
        self,
        error: Exception,
        context: Optional[Dict[str, Any]] = None,
        service_name: Optional[str] = None,
    ) -> HomeAssistantError:
        """Create an enhanced error with classification and context"""
        error_type = self.classify_error(error)
        retry_config = self.retry_configs.get(service_name, RetryConfig())
        retryable = error_type in retry_config.retryable_errors
        recovery_suggestions = self.get_recovery_suggestions(error_type, context or {})

        enhanced_error = HomeAssistantError(
            message=str(error),
            error_type=error_type,
            retryable=retryable,
            context=context or {},
            original_error=error,
            service_name=service_name,
            recovery_suggestions=recovery_suggestions,
        )

        return enhanced_error

    def record_error(self, service_name: str, error: HomeAssistantError):
        """Record an error in metrics and update circuit breaker"""
        metrics = self.metrics.get(service_name, ErrorMetrics())
        circuit = self.circuit_breakers.get(service_name)

        metrics.total_errors += 1
        metrics.consecutive_failures += 1
        metrics.last_error_time = datetime.now()

        # Update error type counts
        if error.error_type not in metrics.error_types:
            metrics.error_types[error.error_type] = 0
        metrics.error_types[error.error_type] += 1

        # Update circuit breaker
        if circuit:
            circuit.record_failure()
            if circuit.state == CircuitState.OPEN:
                metrics.circuit_breaker_triggers += 1

        # Call error callbacks
        for callback in self.error_callbacks:
            try:
                callback(error)
            except Exception as e:
                logger.error(f"Error in error callback: {e}")

    def record_success(self, service_name: str):
        """Record a successful operation"""
        metrics = self.metrics.get(service_name, ErrorMetrics())
        circuit = self.circuit_breakers.get(service_name)

        # Reset consecutive failures on success
        if metrics.consecutive_failures > 0:
            metrics.recovery_count += 1
            metrics.consecutive_failures = 0

        # Update circuit breaker
        if circuit:
            circuit.record_success()

    def can_execute(self, service_name: str) -> bool:
        """Check if operation can be executed (circuit breaker check)"""
        circuit = self.circuit_breakers.get(service_name)
        if circuit:
            return circuit.should_attempt()
        return True

    def should_retry(
        self, service_name: str, error: HomeAssistantError, attempt: int
    ) -> bool:
        """Determine if an operation should be retried"""
        config = self.retry_configs.get(service_name, RetryConfig())

        # Don't retry if we've reached max attempts
        if attempt >= config.max_attempts:
            return False

        # Don't retry non-retryable errors
        if not error.retryable:
            return False

        # Don't retry if circuit breaker is open
        circuit = self.circuit_breakers.get(service_name)
        if circuit and circuit.state == CircuitState.OPEN:
            return False

        return True

    def calculate_retry_delay(self, service_name: str, attempt: int) -> float:
        """Calculate delay before next retry attempt"""
        config = self.retry_configs.get(service_name, RetryConfig())

        if config.recovery_strategy == RecoveryStrategy.EXPONENTIAL_BACKOFF:
            delay = config.base_delay * (config.exponential_base ** (attempt - 1))
        elif config.recovery_strategy == RecoveryStrategy.LINEAR_BACKOFF:
            delay = config.base_delay * attempt
        elif config.recovery_strategy == RecoveryStrategy.FIXED_DELAY:
            delay = config.base_delay
        else:  # ADAPTIVE
            # Adaptive strategy based on recent failures
            metrics = self.metrics.get(service_name, ErrorMetrics())
            failure_rate = min(metrics.consecutive_failures / 10.0, 2.0)
            delay = config.base_delay * (1 + failure_rate)

        # Apply jitter to avoid thundering herd
        if config.jitter:
            import random

            delay = delay * (0.5 + 0.5 * random.random())

        return min(delay, config.max_delay)

    async def execute_with_retry(
        self,
        service_name: str,
        operation: Callable[[], Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Execute an operation with retry logic and circuit breaker"""
        if not self.can_execute(service_name):
            error = HomeAssistantError(
                f"Service {service_name} is currently unavailable (circuit breaker open)",
                error_type=ErrorType.SERVICE_UNAVAILABLE,
                context=context,
                service_name=service_name,
            )
            self.record_error(service_name, error)
            raise error

        config = self.retry_configs.get(service_name, RetryConfig())
        last_error = None

        for attempt in range(1, config.max_attempts + 1):
            try:
                result = await operation()
                self.record_success(service_name)
                return result

            except Exception as e:
                enhanced_error = self.create_enhanced_error(e, context, service_name)
                enhanced_error.context.update(
                    {
                        "attempt": attempt,
                        "max_attempts": config.max_attempts,
                        "service_name": service_name,
                    }
                )

                self.record_error(service_name, enhanced_error)
                last_error = enhanced_error

                if not self.should_retry(service_name, enhanced_error, attempt):
                    break

                if attempt < config.max_attempts:
                    delay = self.calculate_retry_delay(service_name, attempt)
                    logger.warning(
                        f"Operation failed for {service_name} (attempt {attempt}/{config.max_attempts}). "
                        f"Retrying in {delay:.2f}s. Error: {enhanced_error.message}"
                    )
                    await asyncio.sleep(delay)

        # All retries exhausted
        if last_error:
            raise last_error
        else:
            error = HomeAssistantError(
                f"Operation failed for {service_name} after {config.max_attempts} attempts",
                error_type=ErrorType.UNKNOWN_ERROR,
                context=context,
                service_name=service_name,
            )
            self.record_error(service_name, error)
            raise error

    def get_service_health(self, service_name: str) -> Dict[str, Any]:
        """Get comprehensive health status for a service"""
        metrics = self.metrics.get(service_name)
        circuit_breaker = self.circuit_breakers.get(service_name)

        if not metrics or not circuit_breaker:
            return {"status": "unknown", "message": "Service not registered"}

        # Calculate health status
        status = "healthy"
        if circuit_breaker.state != CircuitState.CLOSED:
            status = "unhealthy"
        elif metrics.consecutive_failures > 0:
            status = "degraded"

        # Calculate error rates
        total_operations = (
            metrics.total_errors
            + metrics.recovery_count
            + metrics.health_check_successes
        )
        error_rate = (
            (metrics.total_errors / total_operations * 100)
            if total_operations > 0
            else 0
        )

        return {
            "status": status,
            "circuit_state": circuit_breaker.state.value,
            "health_score": max(0, 100 - error_rate),
            "error_rate_percent": round(error_rate, 2),
            "total_errors": metrics.total_errors,
            "consecutive_failures": metrics.consecutive_failures,
            "recovery_count": metrics.recovery_count,
            "circuit_breaker_triggers": metrics.circuit_breaker_triggers,
            "last_error_time": (
                metrics.last_error_time.isoformat() if metrics.last_error_time else None
            ),
            "error_types": {k.value: v for k, v in metrics.error_types.items()},
            "failure_count": circuit_breaker.failure_count,
            "next_attempt_time": (
                circuit_breaker.next_attempt_time.isoformat()
                if circuit_breaker.next_attempt_time
                else None
            ),
            "health_check_failures": metrics.health_check_failures,
            "health_check_successes": metrics.health_check_successes,
        }

    def get_overall_health(self) -> Dict[str, Any]:
        """Get overall health status across all services"""
        service_healths = {}
        overall_healthy = True
        total_errors = 0
        healthy_services = 0

        for service_name in self.metrics.keys():
            health = self.get_service_health(service_name)
            service_healths[service_name] = health

            if health["status"] != "healthy":
                overall_healthy = False
            else:
                healthy_services += 1

            total_errors += health["total_errors"]

        return {
            "overall_healthy": overall_healthy,
            "healthy_services": healthy_services,
            "total_services": len(self.metrics),
            "total_errors": total_errors,
            "services": service_healths,
            "timestamp": datetime.now().isoformat(),
        }

    def export_metrics(self, file_path: Optional[str] = None) -> Dict[str, Any]:
        """Export metrics to file or return as dict"""
        metrics_data = self.get_overall_health()

        if file_path:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as f:
                json.dump(metrics_data, f, indent=2, default=str)
            logger.info(f"Metrics exported to {file_path}")

        return metrics_data


def with_error_handling(
    service_name: str,
    retry_config: Optional[RetryConfig] = None,
    context: Optional[Dict[str, Any]] = None,
):
    """Decorator for adding error handling to functions"""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if retry_config:
                global_error_handler.register_service(service_name, retry_config)

            return await global_error_handler.execute_with_retry(
                service_name, lambda: func(*args, **kwargs), context
            )

        return wrapper

    return decorator


# Global error handler instance
global_error_handler = ErrorHandler()

# Register default services with enhanced configurations
global_error_handler.register_service(
    "home_assistant_rest",
    RetryConfig(
        max_attempts=3,
        base_delay=1.0,
        max_delay=30.0,
        recovery_strategy=RecoveryStrategy.EXPONENTIAL_BACKOFF,
        retryable_errors=[
            ErrorType.CONNECTION_ERROR,
            ErrorType.TIMEOUT_ERROR,
            ErrorType.SERVICE_UNAVAILABLE,
            ErrorType.RATE_LIMIT_ERROR,
            ErrorType.NETWORK_ERROR,
        ],
    ),
    CircuitBreakerConfig(failure_threshold=5, recovery_timeout=60.0),
    HealthCheckConfig(enabled=True, interval=60.0, failure_threshold=3),
)

global_error_handler.register_service(
    "home_assistant_websocket",
    RetryConfig(
        max_attempts=5,
        base_delay=2.0,
        max_delay=60.0,
        recovery_strategy=RecoveryStrategy.EXPONENTIAL_BACKOFF,
        retryable_errors=[
            ErrorType.CONNECTION_ERROR,
            ErrorType.TIMEOUT_ERROR,
            ErrorType.SERVICE_UNAVAILABLE,
            ErrorType.NETWORK_ERROR,
        ],
    ),
    CircuitBreakerConfig(failure_threshold=3, recovery_timeout=30.0),
    HealthCheckConfig(enabled=True, interval=30.0, failure_threshold=2),
)

global_error_handler.register_service(
    "database",
    RetryConfig(
        max_attempts=3,
        base_delay=0.5,
        max_delay=10.0,
        recovery_strategy=RecoveryStrategy.LINEAR_BACKOFF,
    ),
    CircuitBreakerConfig(failure_threshold=10, recovery_timeout=30.0),
    HealthCheckConfig(enabled=True, interval=120.0, failure_threshold=5),
)

# Start health monitoring
try:
    global_error_handler.start_health_monitoring()
except RuntimeError:
    # No event loop, will start when async context is available
    pass
