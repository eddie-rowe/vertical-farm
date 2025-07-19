from supabase import create_client, Client, acreate_client, AClient, AClientOptions
from fastapi import Depends
from app.core.config import settings
from app.core.security import get_raw_supabase_token

# Validate required settings at module load time
if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables"
    )

if not settings.SUPABASE_ANON_KEY:
    raise RuntimeError(
        "SUPABASE_ANON_KEY must be set in environment variables for RLS functionality"
    )

# This client uses the SERVICE_KEY (SUPABASE_SERVICE_KEY) and bypasses RLS
supabase_service_client: Client = create_client(
    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
)


def get_supabase_client() -> Client:
    return supabase_service_client


async def get_async_supabase_client() -> AClient:
    # Create and return a new instance each time
    # This is less efficient but helps isolate potential issues with a shared global client in tests.
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables for service client"
        )
    return await acreate_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def get_async_rls_client(
    raw_token: str = Depends(get_raw_supabase_token),
) -> AClient:
    """
    Returns an AsyncSupaBase client that uses the user's JWT for RLS.
    Follows Supabase's recommended pattern: pass raw JWT and let Supabase handle validation.
    """
    options = AClientOptions(headers={"Authorization": f"Bearer {raw_token}"})
    rls_client: AClient = await acreate_client(
        settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY, options=options
    )
    return rls_client
