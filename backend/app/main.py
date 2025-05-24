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

# load_dotenv() # Pydantic's Settings class should handle .env file loading

# from app.core import datadog_setup # Uncomment if datadog_setup is implemented

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG # Optionally use DEBUG setting from config
)

# CORS configuration using the new all_cors_origins computed field
print(f"DEBUG: Raw BACKEND_CORS_ORIGINS from Pydantic: {settings.BACKEND_CORS_ORIGINS}")
print(f"DEBUG: FRONTEND_HOST from Pydantic: {settings.FRONTEND_HOST}")
print(f"DEBUG: All CORS Origins for Middleware: {settings.all_cors_origins}")
print(f"DEBUG: CORS Origins Type: {type(settings.all_cors_origins)}")
print(f"DEBUG: Number of CORS Origins: {len(settings.all_cors_origins) if settings.all_cors_origins else 0}")

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
    print(f"DEBUG: Using configured CORS origins: {cors_origins_to_use}")
elif settings.DEBUG or settings.ENVIRONMENT == "local":
    cors_origins_to_use = development_cors_origins
    print(f"DEBUG: No CORS origins configured, using development defaults: {cors_origins_to_use}")
else:
    print("ERROR: No CORS origins available - CORS will not work!")

# Always add CORS middleware if we have origins
if cors_origins_to_use:
    print(f"DEBUG: Adding CORS middleware with origins: {cors_origins_to_use}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins_to_use,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("DEBUG: CORS middleware successfully added")
else:
    print("ERROR: No CORS origins available - CORS will not work!")

# Add exception handlers to ensure CORS headers are included in error responses
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    # Add CORS headers manually to error responses
    if cors_origins_to_use:
        origin = request.headers.get("origin")
        if origin in cors_origins_to_use or "*" in cors_origins_to_use:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"DEBUG: Unhandled exception: {exc}")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
    # Add CORS headers manually to error responses
    if cors_origins_to_use:
        origin = request.headers.get("origin")
        if origin in cors_origins_to_use or "*" in cors_origins_to_use:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.include_router(api_router_v1, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/healthz")
def healthz():
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


# Example /supabase-items endpoint - ensure 'items' table and get_supabase_client work if uncommented
# @app.get("/supabase-items")
# def get_supabase_items():
#     sync_db_client = get_supabase_client() # Ensure get_supabase_client is imported and works
#     response = sync_db_client.table("items").select("*").execute()
#     return {"data": response.data}


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

# Placeholder for other app setup, middleware, etc.
# if settings.DATADOG_ENABLED: # Ensure DATADOG_ENABLED is a setting if you use this
#     # setup_datadog(app) # Ensure setup_datadog is defined and imported
