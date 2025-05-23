# Datadog tracing and logging initialization for FastAPI backend
import os
from ddtrace import tracer
import ddtrace.auto

# Optionally set service/env/version
dd_service = os.getenv("DD_SERVICE", "backend")
dd_env = os.getenv("DD_ENV", "dev")
dd_version = os.getenv("DD_VERSION", "1.0")
tracer.set_tags(
    {
        "service.name": dd_service,
        "env": dd_env,
        "version": dd_version,
    }
)

# Check if Datadog should be disabled
if os.getenv("DISABLE_DATADOG", "false").lower() == "true":
    print("Datadog tracing and logging is disabled via DISABLE_DATADOG env var.")
else:
    # Ensure logs directory exists
    log_dir = os.getenv("DATADOG_LOG_DIR", "/app/backend/logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "app.log")

    # Logging setup (Python logging will be picked up by Datadog Agent if configured)
    import logging

    logging.basicConfig(
        level=logging.INFO,
        filename=log_file,
        filemode="a",
        format="%(asctime)s %(levelname)s %(message)s",
    )
