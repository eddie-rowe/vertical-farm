from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router as api_router_v1
from app.db.supabase_client import get_supabase_client
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()
from app.core import datadog_setup

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://frontend:3000",
    "http://localhost:8080",
    "http://192.168.0.111:3000",
    "http://192.168.0.111:8080",
    "http://vertical-farm.goodgoodgreens.org",
    "https://vertical-farm.goodgoodgreens.org"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router_v1, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/supabase-items")
def get_supabase_items():
    sync_db_client = get_supabase_client()
    response = sync_db_client.table("items").select("*").execute()
    return {"data": response.data}


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

# Placeholder for other app setup, middleware, etc.
# if settings.DATADOG_ENABLED:
#     setup_datadog(app)
