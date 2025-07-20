# from app.services import home_assistant_background_tasks  # Import to register tasks - no longer needed
# Removed cache middleware - not needed at this stage of development
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from supabase import AClient

from app.api.v1.api import api_router as api_router_v1

# from app.db.supabase_client import get_supabase_client # Only if example endpoint is used
# from dotenv import load_dotenv # Likely redundant due to Pydantic .env loading
from app.core.config import settings
from app.core.security import get_raw_supabase_token
from app.db.supabase_client import get_async_rls_client

# Home Assistant service now uses user-specific configurations - no global imports needed
# from app.services.database_service import get_database_service # Removed - no longer needed after PostGREST migration
# from app.services.background_processor import background_processor  # Deprecated Redis-based processor
from app.services.supabase_background_service import (  # New Supabase-based service
    supabase_background_service,
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Application state for services
app_state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern FastAPI lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting application...")

    # Database service no longer needed after PostGREST migration
    # All database operations now go through Supabase PostGREST API
    logger.info("✅ Database operations handled by Supabase PostGREST")

    # Home Assistant service is now user-specific - no global initialization needed
    app_state["home_assistant"] = True
    logger.info("✅ Home Assistant service ready (user-specific configurations only)")

    # Initialize Supabase background service (no startup needed - it's stateless)
    try:
        # Test the service connection
        health = await supabase_background_service.get_system_health()
        app_state["background_processor"] = True
        logger.info("✅ Supabase background service initialized successfully")
        logger.info(f"Background service health: {health['status']}")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase background service: {e}")
        app_state["background_processor"] = False

    logger.info("🚀 Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down application...")

    # Clean up Supabase background service
    try:
        await supabase_background_service.close()
        logger.info("✅ Supabase background service cleaned up")
    except Exception as e:
        logger.error(f"❌ Error cleaning up Supabase background service: {e}")

    # Home Assistant service cleanup not needed (user-specific instances auto-cleanup)
    logger.info("✅ Home Assistant services cleaned up")

    # No database connections to clean up - using PostGREST
    logger.info("✅ No database connections to clean up (using PostGREST)")

    logger.info("👋 Application shutdown complete")


# load_dotenv() # Pydantic's Settings class should handle .env file loading

# from app.core import datadog_setup # Uncomment if datadog_setup is implemented

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG,  # Optionally use DEBUG setting from config
    lifespan=lifespan,  # Modern lifespan management
)

# CORS configuration using the new all_cors_origins computed field
logger.info(f"Raw BACKEND_CORS_ORIGINS from Pydantic: {settings.BACKEND_CORS_ORIGINS}")
logger.info(f"FRONTEND_HOST from Pydantic: {settings.FRONTEND_HOST}")
logger.info(f"All CORS Origins for Middleware: {settings.all_cors_origins}")

# Development CORS override for localhost
development_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# Determine which CORS origins to use
cors_origins_to_use = []

if settings.all_cors_origins:
    cors_origins_to_use = settings.all_cors_origins
    logger.info(f"Using configured CORS origins: {cors_origins_to_use}")
elif settings.DEBUG or settings.ENVIRONMENT == "local":
    cors_origins_to_use = development_cors_origins
    logger.info(
        f"No CORS origins configured, using development defaults: {cors_origins_to_use}"
    )
else:
    logger.error("No CORS origins available - CORS will not work!")

# Always add CORS middleware if we have origins
if cors_origins_to_use:
    logger.info(f"Adding CORS middleware with origins: {cors_origins_to_use}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins_to_use,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS middleware successfully added")
else:
    logger.error("No CORS origins available - CORS will not work!")

# Cache middleware removed - was causing test issues and adding unnecessary complexity
# Can be re-added later when the app has traffic that justifies caching
logger.info("Cache middleware skipped - focusing on core functionality")


# Simplified exception handlers (FastAPI handles CORS automatically with middleware)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(api_router_v1, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint with service status"""

    # Get detailed background service health
    try:
        bg_health = await supabase_background_service.get_system_health()
        background_status = {
            "status": bg_health["status"],
            "success_rate": bg_health["success_rate"],
            "total_queue_length": bg_health["total_queue_length"],
            "type": "supabase_queues",
        }
    except Exception as e:
        background_status = {
            "status": "unhealthy",
            "error": str(e),
            "type": "supabase_queues",
        }

    health_status = {
        "status": "healthy",
        "services": {
            "home_assistant": app_state.get("home_assistant", False),
            "background_processor": background_status,
            "database": {
                "status": "supabase_postgrest",
                "note": "Database operations handled by Supabase PostGREST",
            },
        },
    }

    # Check if any critical services are down
    if not app_state.get("background_processor", False) or background_status[
        "status"
    ] in ["unhealthy", "degraded"]:
        health_status["status"] = "degraded"

    return health_status


@app.get("/healthz")
def healthz():
    """Kubernetes-style health check"""
    return {"status": "ok"}


@app.get("/cors-test")
def cors_test():
    """Test endpoint to verify CORS configuration"""
    return {
        "message": "CORS test endpoint",
        "cors_origins": settings.all_cors_origins,
        "backend_cors_origins": [
            str(origin) for origin in settings.BACKEND_CORS_ORIGINS
        ],
        "frontend_host": (
            str(settings.FRONTEND_HOST) if settings.FRONTEND_HOST else None
        ),
    }


@app.get("/cors-test-simple")
def cors_test_simple():
    """Simple CORS test endpoint without authentication"""
    return {"message": "CORS is working!", "timestamp": "2025-01-28"}


@app.get("/debug/user-profile")
async def debug_user_profile(
    raw_token: str = Depends(get_raw_supabase_token),
    db: AClient = Depends(get_async_rls_client),
):
    """Debug endpoint to check user profile status"""
    from jose import jwt

    from app.crud import crud_user

    # Decode token to get user info (for debugging only)
    try:
        # Note: We're not validating the token here since Supabase RLS will handle that
        # Note: python-jose requires key parameter even for unverified decoding
        payload = jwt.decode(
            raw_token,
            key="",
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": False,
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iat": False,
                "verify_sub": False,
            },
        )
        user_id = payload.get("sub")
    except Exception as e:
        import logging

        logging.error("Error decoding token", exc_info=e)
        return {"error": "Invalid token format", "detail": "An internal error occurred"}

    # Use RLS client which will validate the token properly
    user_data = await crud_user.user.get(supabase=db, id=user_id)

    return {
        "user_id": user_id,
        "jwt_payload": payload,
        "profile_exists": user_data is not None,
        "profile_data": user_data,
    }


# Additional endpoints can be added here as needed


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


# Placeholder for other app setup, middleware, etc.
# if settings.DATADOG_ENABLED: # Ensure DATADOG_ENABLED is a setting if you use this
#     # setup_datadog(app) # Ensure setup_datadog is defined and imported
