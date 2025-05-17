from dotenv import load_dotenv

load_dotenv()
import os
from supabase import create_client, Client

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
