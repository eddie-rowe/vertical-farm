"""
Database configuration and dependency injection for Supabase.

This module provides database dependencies for the FastAPI application
using Supabase as the backend database.
"""

from collections.abc import AsyncGenerator

from supabase import Client, create_client

from app.core.config import get_settings
from app.db import get_async_supabase_client


async def get_db() -> AsyncGenerator[Client, None]:
    """
    Dependency function to get a Supabase database client.

    This function is designed to be compatible with existing code
    that expects a database session, but uses Supabase instead of SQLAlchemy.

    Yields:
        Client: Supabase client instance
    """
    client = await get_async_supabase_client()
    try:
        yield client
    finally:
        # Supabase client doesn't need explicit cleanup
        pass


def get_sync_db() -> Client:
    """
    Get a synchronous Supabase client for non-async contexts.

    Returns:
        Client: Supabase client instance
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.supabase_url, supabase_key=settings.supabase_anon_key
    )
