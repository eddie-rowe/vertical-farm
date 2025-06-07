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
    
    async def connect(self):
        """Initialize database connection pool with validation"""
        if self._pool is not None:
            return  # Already connected
            
        if not self.settings.database_url:
            raise RuntimeError("Database URL is not configured. Set DATABASE_URL or configure Supabase settings.")
        
        try:
            # Test connection first
            test_conn = await asyncpg.connect(self.settings.database_url)
            await test_conn.close()
            
            # Create pool if test connection succeeded
            self._pool = await asyncpg.create_pool(
                self.settings.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60,
                server_settings={
                    'application_name': 'vertical-farm-backend',
                    'jit': 'off'  # Disable JIT for better compatibility
                }
            )
            self._connection_failed = False
            logger.info(f"✅ Database connection pool created successfully (URL: {self.settings.database_url[:50]}...)")
            
        except Exception as e:
            self._connection_failed = True
            logger.error(f"❌ Failed to create database connection pool: {str(e)}")
            logger.error(f"🔧 Database URL: {self.settings.database_url[:50]}...")
            raise
    
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