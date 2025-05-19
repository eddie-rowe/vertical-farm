from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router as items_router
from supabase_client import supabase
from dotenv import load_dotenv

load_dotenv()
import datadog_init

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://192.168.0.111:3000",
    "http://192.168.0.111:8080",
    "https://vertical-farm.goodgoodgreens.org"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/supabase-items")
def get_supabase_items():
    response = supabase.table("items").select("*").execute()
    return {"data": response.data}
