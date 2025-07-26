# from .session import SessionLocal, engine # Comment out or remove this line
from supabase import AClient as SupabaseClient  # Import AClient and alias it

from .supabase_client import get_async_rls_client, get_async_supabase_client

# Remove the Base import as it's no longer needed
# from .base_class import Base  # noqa

__all__ = [
    "get_async_supabase_client",
    "get_async_rls_client",
    "SupabaseClient",
]  # Add SupabaseClient to __all__ if it needs to be easily imported from app.db
