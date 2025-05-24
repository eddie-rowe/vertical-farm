from supabase import create_client, Client, create_async_client, AsyncClient, AsyncClientOptions
from fastapi import Depends
from app.core.config import settings
from app.core.security import get_validated_supabase_token_payload

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
supabase_service_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

def get_supabase_client() -> Client:
    return supabase_service_client

async def get_async_supabase_client() -> AsyncClient:
    # Create and return a new instance each time
    # This is less efficient but helps isolate potential issues with a shared global client in tests.
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
         raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables for service client")
    return await create_async_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

async def get_async_rls_client(
    token_data: tuple = Depends(get_validated_supabase_token_payload)
) -> AsyncClient:
    """
    Returns an AsyncSupaBase client that uses the user's JWT for RLS.
    Depends on get_validated_supabase_token_payload to get the raw token string.
    """
    _payload, raw_token_string = token_data

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be set in settings for RLS client"
        )

    # Create a new client instance specifically for RLS-enabled requests
    # This client uses the ANON_KEY but will have its Authorization header overridden.
    options = AsyncClientOptions(
        headers={"Authorization": f"Bearer {raw_token_string}"}
    )
    rls_client: AsyncClient = await create_async_client(
        settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY, options=options
    )
    
    return rls_client
