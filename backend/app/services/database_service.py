"""Modern database service for connecting to PostgreSQL/Supabase with graceful degradation"""
import asyncpg
import logging
from typing import Optional, AsyncGenerator
from functools import lru_cache
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.settings = get_settings()
        self._pool: Optional[asyncpg.Pool] = None
        self._connection_failed = False
    
    @property
    def is_available(self) -> bool:
        """Check if database service is available"""
        return self._pool is not None and not self._connection_failed
    
    def _get_pooler_url(self) -> str:
        """Convert direct database URL to Supavisor pooler URL for caching"""
        database_url = self.settings.database_url
        if not database_url:
            # If no database URL is configured, return empty string
            # This will cause graceful degradation
            return ""
        
        # If already using pooler, return as-is
        if "pooler.supabase.com" in database_url:
            return database_url
        
        # Convert direct connection to pooler (transaction mode for caching)
        # Example: postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
        # Becomes: postgresql://postgres.xxx:pass@aws-0-region.pooler.supabase.com:6543/postgres
        try:
            url = database_url
            if "db." in url and ".supabase.co" in url:
                # Extract project reference from direct URL
                project_ref = url.split("db.")[1].split(".supabase.co")[0]
                # Extract password and other parts
                parts = url.split("@")
                if len(parts) == 2:
                    auth_part = parts[0]  # postgresql://postgres:password
                    password = auth_part.split(":")[-1]
                    # Construct pooler URL (transaction mode port 6543 for caching)
                    pooler_url = f"postgresql://postgres.{project_ref}:{password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
                    logger.info(f"🚀 Using Supavisor pooler with caching: {pooler_url[:50]}...")
                    return pooler_url
        except Exception as e:
            logger.warning(f"Could not convert to pooler URL: {e}, using direct connection")
        
        return database_url
    
    async def connect(self):
        """Initialize database connection pool with validation"""
        if self._pool is not None:
            return  # Already connected
            
        database_url = self._get_pooler_url()
        if not database_url:
            logger.warning("⚠️  No database URL configured - database service will be unavailable")
            logger.warning("   Set DATABASE_URL environment variable or configure Supabase settings")
            self._connection_failed = True
            return  # Graceful degradation - service will report as unavailable
        
        try:
            # Test connection first
            test_conn = await asyncpg.connect(database_url)
            await test_conn.close()
            
            # Create pool if test connection succeeded
            self._pool = await asyncpg.create_pool(
                database_url,
                min_size=2,  # Slightly higher for pooler
                max_size=20,  # Higher for better caching performance
                command_timeout=60,
                server_settings={
                    'application_name': 'vertical-farm-backend',
                    'jit': 'off',  # Disable JIT for better compatibility
                    'statement_timeout': '30s',  # Optimize for cached queries
                    'idle_in_transaction_session_timeout': '10s'  # Clean up idle connections
                }
            )
            self._connection_failed = False
            
            # Log whether we're using caching
            is_pooler = "pooler.supabase.com" in database_url
            cache_status = "✅ WITH QUERY CACHING" if is_pooler else "⚠️  Direct connection (no caching)"
            logger.info(f"✅ Database connection pool created successfully {cache_status}")
            
        except Exception as e:
            self._connection_failed = True
            logger.error(f"❌ Failed to create database connection pool: {str(e)}")
            logger.error(f"🔧 Database URL: {database_url[:50]}...")
            # Don't raise - allow graceful degradation
            logger.warning("⚠️  Database service will be unavailable - continuing with degraded functionality")
    
    async def disconnect(self):
        """Close database connection pool"""
        if self._pool:
            await self._pool.close()
            self._pool = None
            logger.info("✅ Database connection pool closed")
    
    async def get_connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        """Get a connection from the pool using modern async context manager pattern"""
        if not self.is_available:
            raise RuntimeError("Database service is not available")
        
        async with self._pool.acquire() as conn:
            yield conn
    
    async def fetch(self, query: str, *args):
        """Execute a query and fetch all results"""
        if not self.is_available:
            raise RuntimeError("Database service is not available")
        
        async with self._pool.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        """Execute a query and fetch one result"""
        if not self.is_available:
            raise RuntimeError("Database service is not available")
        
        async with self._pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def execute(self, query: str, *args):
        """Execute a query without returning results"""
        if not self.is_available:
            raise RuntimeError("Database service is not available")
        
        async with self._pool.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def health_check(self) -> dict:
        """Perform a health check on the database connection"""
        try:
            if not self.is_available:
                return {"status": "unavailable", "error": "No database connection"}
            
            async with self._pool.acquire() as conn:
                result = await conn.fetchval("SELECT 1")
                return {"status": "healthy", "test_query": result}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

# Global database service instance
_database_service: Optional[DatabaseService] = None

async def get_database_service() -> DatabaseService:
    """Get the global database service instance with error handling"""
    global _database_service
    if _database_service is None:
        _database_service = DatabaseService()
        await _database_service.connect()
    return _database_service

async def get_database() -> Optional[DatabaseService]:
    """FastAPI dependency for database service with graceful degradation"""
    try:
        return await get_database_service()
    except Exception as e:
        logger.warning(f"Database service unavailable: {e}")
        return None

async def get_database_connection():
    """FastAPI dependency for database connection using modern yield pattern"""
    db_service = await get_database()
    if db_service is None:
        raise RuntimeError("Database service is not available")
    
    async with db_service.get_connection() as conn:
        yield conn 