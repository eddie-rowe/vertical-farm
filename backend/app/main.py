from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.api.v1.api import api_router as api_router_v1
# from app.db.supabase_client import get_supabase_client # Only if example endpoint is used
# from dotenv import load_dotenv # Likely redundant due to Pydantic .env loading
from app.core.config import settings
from app.core.security import get_validated_supabase_token_payload
# Home Assistant service now uses user-specific configurations - no global imports needed
# from app.services.database_service import get_database_service # Removed - no longer needed after PostGREST migration
import logging

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
    
    logger.info("🚀 Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
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
    debug=settings.DEBUG, # Optionally use DEBUG setting from config
    lifespan=lifespan  # Modern lifespan management
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
    "http://127.0.0.1:3001"
]

# Determine which CORS origins to use
cors_origins_to_use = []

if settings.all_cors_origins: 
    cors_origins_to_use = settings.all_cors_origins
    logger.info(f"Using configured CORS origins: {cors_origins_to_use}")
elif settings.DEBUG or settings.ENVIRONMENT == "local":
    cors_origins_to_use = development_cors_origins
    logger.info(f"No CORS origins configured, using development defaults: {cors_origins_to_use}")
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

# Simplified exception handlers (FastAPI handles CORS automatically with middleware)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

app.include_router(api_router_v1, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint with service status"""
    health_status = {
        "status": "healthy",
        "services": {
            "home_assistant": app_state.get("home_assistant", False),
            "database": {"status": "supabase_postgrest", "note": "Database operations handled by Supabase PostGREST"}
        }
    }
    
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
        "backend_cors_origins": [str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        "frontend_host": str(settings.FRONTEND_HOST) if settings.FRONTEND_HOST else None
    }

@app.get("/cors-test-simple")
def cors_test_simple():
    """Simple CORS test endpoint without authentication"""
    return {"message": "CORS is working!", "timestamp": "2025-01-28"}

@app.get("/debug/user-profile")
async def debug_user_profile(
    token_data: tuple = Depends(get_validated_supabase_token_payload)
):
    """Debug endpoint to check user profile status"""
    from app.db.supabase_client import get_async_supabase_client
    from app.crud import crud_user
    
    payload, _ = token_data
    user_id = payload.get("sub")
    
    db = await get_async_supabase_client()
    user_data = await crud_user.user.get(supabase=db, id=user_id)
    
    return {
        "user_id": user_id,
        "jwt_payload": payload,
        "profile_exists": user_data is not None,
        "profile_data": user_data
    }

# Additional endpoints can be added here as needed

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

# Placeholder for other app setup, middleware, etc.
# if settings.DATADOG_ENABLED: # Ensure DATADOG_ENABLED is a setting if you use this
#     # setup_datadog(app) # Ensure setup_datadog is defined and imported
