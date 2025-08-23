# Backend Architecture

## Overview

The VerticalFarm OS backend is a sophisticated FastAPI application built with Python 3.13, designed for high-performance asynchronous operations, comprehensive business logic processing, and seamless integration with IoT devices and external services.

## Technology Stack

### Core Technologies
- **FastAPI** - Modern, fast web framework for building APIs
- **Python 3.13** - Latest Python with performance improvements
- **Pydantic** - Data validation using Python type annotations
- **SQLAlchemy** - SQL toolkit and ORM (when needed)
- **Supabase** - Backend database and authentication
- **JWT** - JSON Web Tokens for authentication

### Supporting Technologies
- **Uvicorn** - ASGI server
- **Docker** - Containerization
- **Datadog** - Application performance monitoring
- **pytest** - Testing framework
- **Alembic** - Database migration tool

## Application Structure

### Directory Organization

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/         # API endpoint modules
│   │       │   ├── farms.py      # Farm management endpoints
│   │       │   ├── devices.py    # Device control endpoints
│   │       │   ├── sensors.py    # Sensor data endpoints
│   │       │   ├── automation.py # Automation rule endpoints
│   │       │   ├── users.py      # User management endpoints
│   │       │   └── auth.py       # Authentication endpoints
│   │       └── api.py            # API router configuration
│   ├── core/                      # Core functionality
│   │   ├── config.py             # Configuration management
│   │   ├── security.py           # Security utilities
│   │   ├── dependencies.py       # Dependency injection
│   │   └── exceptions.py         # Custom exceptions
│   ├── crud/                      # Database operations
│   │   ├── base.py              # Base CRUD operations
│   │   ├── farm.py              # Farm-specific CRUD
│   │   ├── device.py            # Device-specific CRUD
│   │   └── user.py              # User-specific CRUD
│   ├── models/                    # Database models
│   │   ├── __init__.py
│   │   ├── farm.py              # Farm models
│   │   ├── device.py            # Device models
│   │   ├── sensor.py            # Sensor models
│   │   └── user.py              # User models
│   ├── schemas/                   # Pydantic schemas
│   │   ├── farm.py              # Farm schemas
│   │   ├── device.py            # Device schemas
│   │   ├── sensor.py            # Sensor schemas
│   │   └── user.py              # User schemas
│   ├── services/                  # Business logic layer
│   │   ├── farm_service.py      # Farm business logic
│   │   ├── device_service.py    # Device integration
│   │   ├── automation_service.py # Automation engine
│   │   ├── notification_service.py # Notifications
│   │   └── analytics_service.py # Analytics processing
│   ├── integrations/             # External integrations
│   │   ├── home_assistant.py    # Home Assistant integration
│   │   ├── weather_api.py       # Weather service
│   │   └── payment.py           # Payment processing
│   ├── background/               # Background tasks
│   │   ├── tasks.py             # Task definitions
│   │   ├── scheduler.py         # Task scheduling
│   │   └── workers.py           # Worker processes
│   ├── middleware/               # Custom middleware
│   │   ├── auth.py              # Authentication middleware
│   │   ├── logging.py           # Request logging
│   │   ├── cors.py              # CORS configuration
│   │   └── rate_limit.py        # Rate limiting
│   ├── utils/                    # Utility functions
│   │   ├── validators.py        # Custom validators
│   │   ├── formatters.py        # Data formatters
│   │   └── helpers.py           # Helper functions
│   └── main.py                   # Application entry point
├── tests/                        # Test suite
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── api/                     # API tests
│   └── conftest.py              # Test configuration
├── migrations/                   # Database migrations
├── scripts/                      # Utility scripts
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container configuration
└── .env.example                 # Environment variables example
```

## Core Architecture Patterns

### Layered Architecture

```python
# Request Flow
API Endpoint → Validation → Service Layer → CRUD/Database → Response

# Layer Responsibilities
- API Layer: HTTP handling, request/response formatting
- Service Layer: Business logic, orchestration
- CRUD Layer: Database operations
- Model Layer: Data representation
```

### Dependency Injection

```python
# core/dependencies.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_jwt_token
from app.services.farm_service import FarmService

security = HTTPBearer()

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> dict:
    """Dependency to get current authenticated user."""
    try:
        payload = verify_jwt_token(credentials.credentials)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_farm_service() -> FarmService:
    """Dependency to get farm service instance."""
    return FarmService()

# Usage in endpoint
@router.get("/farms")
async def get_user_farms(
    current_user: Annotated[dict, Depends(get_current_user)],
    farm_service: Annotated[FarmService, Depends(get_farm_service)]
):
    return await farm_service.get_user_farms(current_user["sub"])
```

### Service Layer Pattern

```python
# services/farm_service.py
from typing import List, Optional
from app.crud.farm import farm_crud
from app.schemas.farm import FarmCreate, FarmUpdate, Farm
from app.core.exceptions import BusinessRuleViolation
from app.integrations.home_assistant import HomeAssistantClient

class FarmService:
    """Farm business logic service."""
    
    def __init__(self):
        self.farm_crud = farm_crud
        self.ha_client = HomeAssistantClient()
    
    async def create_farm(
        self, 
        farm_data: FarmCreate, 
        user_id: str
    ) -> Farm:
        """Create a new farm with validation and setup."""
        # Business rule validation
        existing_farms = await self.farm_crud.get_user_farms(user_id)
        if len(existing_farms) >= 5:
            raise BusinessRuleViolation("User farm limit exceeded")
        
        # Create farm
        farm = await self.farm_crud.create(
            obj_in=farm_data,
            user_id=user_id
        )
        
        # Initialize farm infrastructure
        await self._initialize_farm_infrastructure(farm)
        
        # Set up default automation rules
        await self._create_default_automation_rules(farm.id)
        
        # Register with Home Assistant
        await self.ha_client.register_farm(farm)
        
        return farm
    
    async def update_farm(
        self, 
        farm_id: str, 
        farm_update: FarmUpdate,
        user_id: str
    ) -> Farm:
        """Update farm with authorization check."""
        # Verify ownership
        farm = await self.farm_crud.get(farm_id)
        if not farm or farm.user_id != user_id:
            raise PermissionError("Unauthorized farm access")
        
        # Update farm
        updated_farm = await self.farm_crud.update(
            db_obj=farm,
            obj_in=farm_update
        )
        
        # Sync with external systems
        await self.ha_client.update_farm(updated_farm)
        
        return updated_farm
    
    async def _initialize_farm_infrastructure(self, farm: Farm):
        """Set up initial farm infrastructure."""
        # Create default rows, racks, shelves
        # Set up monitoring
        # Initialize sensor baselines
        pass
    
    async def _create_default_automation_rules(self, farm_id: str):
        """Create default automation rules for new farm."""
        # Temperature control rules
        # Humidity management
        # Light scheduling
        pass
```

## API Design

### RESTful Endpoints

```python
# api/v1/endpoints/farms.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.farm import Farm, FarmCreate, FarmUpdate, FarmList
from app.core.dependencies import get_current_user, get_farm_service

router = APIRouter(prefix="/farms", tags=["farms"])

@router.get("/", response_model=FarmList)
async def list_farms(
    current_user: dict = Depends(get_current_user),
    farm_service: FarmService = Depends(get_farm_service),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None
):
    """List user's farms with pagination and search."""
    farms = await farm_service.get_user_farms(
        user_id=current_user["sub"],
        skip=skip,
        limit=limit,
        search=search
    )
    total = await farm_service.count_user_farms(current_user["sub"])
    
    return FarmList(
        items=farms,
        total=total,
        skip=skip,
        limit=limit
    )

@router.post("/", response_model=Farm, status_code=status.HTTP_201_CREATED)
async def create_farm(
    farm_data: FarmCreate,
    current_user: dict = Depends(get_current_user),
    farm_service: FarmService = Depends(get_farm_service)
):
    """Create a new farm."""
    return await farm_service.create_farm(
        farm_data=farm_data,
        user_id=current_user["sub"]
    )

@router.get("/{farm_id}", response_model=Farm)
async def get_farm(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    farm_service: FarmService = Depends(get_farm_service)
):
    """Get farm details."""
    farm = await farm_service.get_farm(
        farm_id=farm_id,
        user_id=current_user["sub"]
    )
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    return farm

@router.put("/{farm_id}", response_model=Farm)
async def update_farm(
    farm_id: str,
    farm_update: FarmUpdate,
    current_user: dict = Depends(get_current_user),
    farm_service: FarmService = Depends(get_farm_service)
):
    """Update farm details."""
    return await farm_service.update_farm(
        farm_id=farm_id,
        farm_update=farm_update,
        user_id=current_user["sub"]
    )

@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    farm_service: FarmService = Depends(get_farm_service)
):
    """Delete a farm."""
    await farm_service.delete_farm(
        farm_id=farm_id,
        user_id=current_user["sub"]
    )
```

### Request/Response Schemas

```python
# schemas/farm.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator

class FarmBase(BaseModel):
    """Base farm schema."""
    name: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Farm name cannot be empty')
        return v.strip()

class FarmCreate(FarmBase):
    """Schema for creating a farm."""
    pass

class FarmUpdate(BaseModel):
    """Schema for updating a farm."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    width: Optional[float] = Field(None, gt=0)
    depth: Optional[float] = Field(None, gt=0)

class Farm(FarmBase):
    """Complete farm schema."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    device_count: Optional[int] = 0
    active_schedules: Optional[int] = 0
    health_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class FarmList(BaseModel):
    """Paginated farm list response."""
    items: List[Farm]
    total: int
    skip: int
    limit: int
```

## Authentication & Security

### JWT Authentication

```python
# core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: str, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)
```

### Authorization Middleware

```python
# middleware/auth.py
from fastapi import Request, HTTPException
from fastapi.security.utils import get_authorization_scheme_param
from app.core.security import verify_jwt_token

async def auth_middleware(request: Request, call_next):
    """Authentication middleware for protected routes."""
    # Skip auth for public endpoints
    public_paths = ["/docs", "/openapi.json", "/health", "/api/v1/auth/login"]
    if request.url.path in public_paths:
        return await call_next(request)
    
    # Extract token
    authorization = request.headers.get("Authorization")
    scheme, token = get_authorization_scheme_param(authorization)
    
    if not authorization or scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    
    try:
        # Verify token
        payload = verify_jwt_token(token)
        request.state.user = payload
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
    
    response = await call_next(request)
    return response
```

## Database Integration

### CRUD Operations

```python
# crud/base.py
from typing import Generic, TypeVar, Type, Optional, List, Any
from pydantic import BaseModel
from supabase import Client

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base CRUD operations."""
    
    def __init__(self, table: str, client: Client):
        self.table = table
        self.client = client
    
    async def get(self, id: str) -> Optional[ModelType]:
        """Get single record by ID."""
        response = self.client.table(self.table).select("*").eq("id", id).single().execute()
        return response.data if response.data else None
    
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        **filters
    ) -> List[ModelType]:
        """Get multiple records with pagination."""
        query = self.client.table(self.table).select("*")
        
        for key, value in filters.items():
            query = query.eq(key, value)
        
        response = query.range(skip, skip + limit - 1).execute()
        return response.data
    
    async def create(self, obj_in: CreateSchemaType) -> ModelType:
        """Create new record."""
        obj_in_data = obj_in.dict()
        response = self.client.table(self.table).insert(obj_in_data).execute()
        return response.data[0]
    
    async def update(
        self, 
        id: str, 
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """Update existing record."""
        obj_data = obj_in.dict(exclude_unset=True)
        response = self.client.table(self.table).update(obj_data).eq("id", id).execute()
        return response.data[0]
    
    async def delete(self, id: str) -> bool:
        """Delete record."""
        response = self.client.table(self.table).delete().eq("id", id).execute()
        return True
```

### Database Connection Management

```python
# core/database.py
from supabase import create_client, Client
from app.core.config import settings

class DatabaseManager:
    """Database connection manager."""
    
    _client: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client."""
        if cls._client is None:
            cls._client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_SERVICE_KEY
            )
        return cls._client
    
    @classmethod
    def close(cls):
        """Close database connection."""
        if cls._client:
            # Supabase client doesn't need explicit closing
            cls._client = None

# Dependency for database session
def get_db() -> Client:
    """Get database client dependency."""
    return DatabaseManager.get_client()
```

## Background Tasks

### Task Queue Implementation

```python
# background/tasks.py
from typing import Any
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "vertical_farm",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

@celery_app.task(name="process_sensor_data")
async def process_sensor_data(sensor_data: dict) -> dict:
    """Process incoming sensor data."""
    # Validate data
    # Store in database
    # Check thresholds
    # Trigger alerts if needed
    return {"status": "processed", "data": sensor_data}

@celery_app.task(name="execute_automation_rule")
async def execute_automation_rule(rule_id: str) -> dict:
    """Execute an automation rule."""
    # Fetch rule details
    # Check conditions
    # Execute actions
    # Log execution
    return {"status": "executed", "rule_id": rule_id}

@celery_app.task(name="generate_report")
async def generate_report(farm_id: str, report_type: str) -> str:
    """Generate farm report."""
    # Fetch data
    # Process analytics
    # Generate report
    # Send notification
    return f"Report generated: {report_type}"
```

### Scheduled Tasks

```python
# background/scheduler.py
from celery.schedules import crontab
from app.background.tasks import celery_app

celery_app.conf.beat_schedule = {
    'check-sensor-health': {
        'task': 'check_sensor_health',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'process-automation-rules': {
        'task': 'process_automation_rules',
        'schedule': crontab(minute='*/1'),  # Every minute
    },
    'generate-daily-reports': {
        'task': 'generate_daily_reports',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
    'cleanup-old-data': {
        'task': 'cleanup_old_data',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}
```

## Error Handling

### Custom Exceptions

```python
# core/exceptions.py
from typing import Optional

class AppException(Exception):
    """Base application exception."""
    def __init__(
        self, 
        message: str, 
        code: Optional[str] = None,
        status_code: int = 500
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)

class ValidationError(AppException):
    """Validation error."""
    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR", 400)

class NotFoundError(AppException):
    """Resource not found error."""
    def __init__(self, message: str):
        super().__init__(message, "NOT_FOUND", 404)

class AuthenticationError(AppException):
    """Authentication error."""
    def __init__(self, message: str):
        super().__init__(message, "AUTHENTICATION_ERROR", 401)

class AuthorizationError(AppException):
    """Authorization error."""
    def __init__(self, message: str):
        super().__init__(message, "AUTHORIZATION_ERROR", 403)

class BusinessRuleViolation(AppException):
    """Business rule violation."""
    def __init__(self, message: str):
        super().__init__(message, "BUSINESS_RULE_VIOLATION", 422)
```

### Global Exception Handler

```python
# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppException

app = FastAPI()

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "code": exc.code,
                "status": exc.status_code
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    # Log the error
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "An unexpected error occurred",
                "code": "INTERNAL_ERROR",
                "status": 500
            }
        }
    )
```

## Monitoring & Logging

### Structured Logging

```python
# core/logging.py
import logging
import json
from datetime import datetime
from typing import Any, Dict

class StructuredLogger:
    """Structured JSON logger."""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        self.logger.addHandler(handler)
    
    def _log(self, level: str, message: str, **kwargs):
        """Log with structured data."""
        extra = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            **kwargs
        }
        getattr(self.logger, level.lower())(message, extra={"structured": extra})
    
    def info(self, message: str, **kwargs):
        self._log("INFO", message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log("ERROR", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log("WARNING", message, **kwargs)

class JSONFormatter(logging.Formatter):
    """JSON log formatter."""
    
    def format(self, record):
        if hasattr(record, 'structured'):
            return json.dumps(record.structured)
        
        return json.dumps({
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        })
```

### Datadog Integration

```python
# core/monitoring.py
from datadog import initialize, statsd
from app.core.config import settings

# Initialize Datadog
initialize(
    api_key=settings.DATADOG_API_KEY,
    app_key=settings.DATADOG_APP_KEY
)

class Metrics:
    """Application metrics collector."""
    
    @staticmethod
    def increment(metric: str, value: int = 1, tags: list = None):
        """Increment a counter metric."""
        statsd.increment(f"verticalfarm.{metric}", value, tags=tags)
    
    @staticmethod
    def gauge(metric: str, value: float, tags: list = None):
        """Set a gauge metric."""
        statsd.gauge(f"verticalfarm.{metric}", value, tags=tags)
    
    @staticmethod
    def timing(metric: str, value: float, tags: list = None):
        """Record a timing metric."""
        statsd.timing(f"verticalfarm.{metric}", value, tags=tags)
    
    @staticmethod
    def histogram(metric: str, value: float, tags: list = None):
        """Record a histogram metric."""
        statsd.histogram(f"verticalfarm.{metric}", value, tags=tags)

# Usage in endpoints
from app.core.monitoring import Metrics

@router.get("/farms")
async def get_farms():
    with statsd.timed('api.farms.get.duration'):
        farms = await farm_service.get_farms()
        
    Metrics.increment('api.farms.get.count')
    Metrics.gauge('api.farms.count', len(farms))
    
    return farms
```

## Testing

### Unit Testing

```python
# tests/unit/test_farm_service.py
import pytest
from unittest.mock import Mock, AsyncMock
from app.services.farm_service import FarmService
from app.schemas.farm import FarmCreate

@pytest.fixture
def farm_service():
    service = FarmService()
    service.farm_crud = Mock()
    service.ha_client = Mock()
    return service

@pytest.mark.asyncio
async def test_create_farm_success(farm_service):
    # Arrange
    farm_data = FarmCreate(name="Test Farm", location="Test Location")
    user_id = "test-user-id"
    
    farm_service.farm_crud.get_user_farms = AsyncMock(return_value=[])
    farm_service.farm_crud.create = AsyncMock(return_value={"id": "farm-id"})
    farm_service.ha_client.register_farm = AsyncMock()
    
    # Act
    result = await farm_service.create_farm(farm_data, user_id)
    
    # Assert
    assert result["id"] == "farm-id"
    farm_service.farm_crud.create.assert_called_once()
    farm_service.ha_client.register_farm.assert_called_once()

@pytest.mark.asyncio
async def test_create_farm_limit_exceeded(farm_service):
    # Arrange
    farm_data = FarmCreate(name="Test Farm", location="Test Location")
    user_id = "test-user-id"
    
    # User already has 5 farms
    existing_farms = [{"id": f"farm-{i}"} for i in range(5)]
    farm_service.farm_crud.get_user_farms = AsyncMock(return_value=existing_farms)
    
    # Act & Assert
    with pytest.raises(BusinessRuleViolation) as exc:
        await farm_service.create_farm(farm_data, user_id)
    
    assert "farm limit exceeded" in str(exc.value).lower()
```

### Integration Testing

```python
# tests/integration/test_api_farms.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_farm_crud_flow():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "testpass"}
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create farm
        create_response = await client.post(
            "/api/v1/farms",
            json={"name": "Test Farm", "location": "Test Location"},
            headers=headers
        )
        assert create_response.status_code == 201
        farm = create_response.json()
        
        # Get farm
        get_response = await client.get(
            f"/api/v1/farms/{farm['id']}",
            headers=headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Test Farm"
        
        # Update farm
        update_response = await client.put(
            f"/api/v1/farms/{farm['id']}",
            json={"name": "Updated Farm"},
            headers=headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Farm"
        
        # Delete farm
        delete_response = await client.delete(
            f"/api/v1/farms/{farm['id']}",
            headers=headers
        )
        assert delete_response.status_code == 204
```

## Performance Optimization

### Async Operations

```python
# Parallel data fetching
async def get_farm_dashboard(farm_id: str):
    """Get comprehensive farm dashboard data."""
    # Fetch all data in parallel
    (
        farm,
        devices,
        sensor_data,
        active_schedules,
        recent_alerts
    ) = await asyncio.gather(
        farm_service.get_farm(farm_id),
        device_service.get_farm_devices(farm_id),
        sensor_service.get_latest_readings(farm_id),
        schedule_service.get_active_schedules(farm_id),
        alert_service.get_recent_alerts(farm_id)
    )
    
    return {
        "farm": farm,
        "devices": devices,
        "sensor_data": sensor_data,
        "schedules": active_schedules,
        "alerts": recent_alerts
    }
```

### Caching Strategy

```python
# core/cache.py
import json
from typing import Optional, Any
from redis import Redis
from app.core.config import settings

class CacheManager:
    """Redis cache manager."""
    
    def __init__(self):
        self.redis = Redis.from_url(settings.REDIS_URL)
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        value = self.redis.get(key)
        if value:
            return json.loads(value)
        return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        expire: int = 300
    ):
        """Set value in cache with expiration."""
        self.redis.set(
            key, 
            json.dumps(value), 
            ex=expire
        )
    
    async def delete(self, key: str):
        """Delete value from cache."""
        self.redis.delete(key)
    
    def cache_key(self, prefix: str, *args) -> str:
        """Generate cache key."""
        return f"{prefix}:" + ":".join(str(arg) for arg in args)

# Usage in service
cache = CacheManager()

async def get_farm_with_cache(farm_id: str):
    # Try cache first
    cache_key = cache.cache_key("farm", farm_id)
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    # Fetch from database
    farm = await farm_crud.get(farm_id)
    
    # Cache for 5 minutes
    await cache.set(cache_key, farm, expire=300)
    
    return farm
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY ./app ./app

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Configuration

```python
# core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "VerticalFarm API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Monitoring
    DATADOG_API_KEY: str
    DATADOG_APP_KEY: str
    
    # External Services
    HOME_ASSISTANT_URL: str
    HOME_ASSISTANT_TOKEN: str
    WEATHER_API_KEY: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

## Summary

The backend architecture provides:
- **Scalability** through async operations and microservice-ready design
- **Maintainability** with clear separation of concerns
- **Security** with comprehensive authentication and authorization
- **Performance** through caching and optimized queries
- **Reliability** with error handling and monitoring
- **Testability** with dependency injection and clear interfaces

Follow these patterns to maintain consistency and quality in the backend codebase.

---

*For backend-specific questions or architectural decisions, consult the backend team lead or submit proposals for review.*