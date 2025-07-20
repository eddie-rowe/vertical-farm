"""
Shared test fixtures and configuration for the backend test suite.
"""

import os
import sys
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Add the backend directory to Python path
backend_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import get_settings
from app.main import app


@pytest.fixture
def settings():
    """Provide test settings."""
    return get_settings()


# Removed duplicate client fixture - using async version below


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock_client = MagicMock()
    mock_client.auth = MagicMock()
    mock_client.table = MagicMock()
    mock_client.storage = MagicMock()
    return mock_client


@pytest.fixture
def mock_home_assistant_client():
    """Mock Home Assistant client for testing."""
    mock_client = AsyncMock()
    mock_client.test_connection = AsyncMock(return_value=True)
    mock_client.get_states = AsyncMock(return_value=[])
    mock_client.get_services = AsyncMock(return_value={})
    mock_client.call_service = AsyncMock(return_value={"success": True})
    mock_client.get_device_state = AsyncMock(return_value={"state": "off"})
    return mock_client


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.delete = AsyncMock(return_value=1)
    mock_redis.exists = AsyncMock(return_value=False)
    mock_redis.expire = AsyncMock(return_value=True)
    return mock_redis


@pytest.fixture
def mock_user_service():
    """Mock user service for testing."""
    mock_service = MagicMock()
    mock_service.get_user_home_assistant_config = MagicMock(return_value=None)
    mock_service.save_user_home_assistant_config = MagicMock(return_value=True)
    mock_service.get_user_device_assignments = MagicMock(return_value=[])
    mock_service.save_device_assignment = MagicMock(return_value=True)
    return mock_service


@pytest.fixture
def sample_home_assistant_config():
    """Sample Home Assistant configuration for testing."""
    return {
        "url": "http://homeassistant.local:8123",
        "access_token": "test_token_123",
        "name": "Test Home Assistant",
    }


@pytest.fixture
def sample_device_data():
    """Sample device data for testing."""
    return {
        "entity_id": "light.living_room",
        "state": "off",
        "attributes": {
            "friendly_name": "Living Room Light",
            "supported_features": 41,
            "brightness": None,
        },
    }


@pytest.fixture
def sample_device_assignment():
    """Sample device assignment for testing."""
    return {
        "device_id": "light.living_room",
        "farm_location": {"row": 1, "rack": 2, "shelf": 3},
        "device_type": "light",
        "name": "Living Room Light",
    }


@pytest_asyncio.fixture(autouse=True)
async def setup_test_environment():
    """Set up test environment before each test."""
    # Clear any existing patches
    yield
    # Cleanup after test


# Removed custom event_loop fixture to avoid deprecation warnings
# Using default pytest-asyncio event loop management


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI application."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def mock_user():
    """Create a mock authenticated user."""
    user = MagicMock()
    user.id = "test-user-123"
    user.email = "test@example.com"
    user.is_active = True
    user.is_superuser = False
    return user


@pytest.fixture
def mock_admin_user():
    """Create a mock admin user."""
    user = MagicMock()
    user.id = "admin-user-456"
    user.email = "admin@example.com"
    user.is_active = True
    user.is_superuser = True
    return user


@pytest.fixture
def mock_home_assistant_service():
    """Create a mock Home Assistant service with default responses."""
    service = AsyncMock()

    # Default successful responses
    service.get_user_integration_status.return_value = {
        "healthy": True,
        "rest_api": True,
        "websocket": True,
        "last_updated": "2024-01-01T12:00:00Z",
    }

    service.get_user_devices.return_value = [
        {
            "entity_id": "light.test_light",
            "name": "Test Light",
            "state": "on",
            "attributes": {"brightness": 255, "friendly_name": "Test Light"},
            "last_changed": "2024-01-01T12:00:00Z",
            "last_updated": "2024-01-01T12:00:00Z",
        },
        {
            "entity_id": "sensor.temperature",
            "name": "Temperature Sensor",
            "state": "22.5",
            "attributes": {"unit_of_measurement": "°C", "friendly_name": "Temperature"},
            "last_changed": "2024-01-01T12:00:00Z",
            "last_updated": "2024-01-01T12:00:00Z",
        },
    ]

    service.control_device.return_value = {
        "success": True,
        "entity_id": "light.test_light",
        "action": "turn_on",
        "message": "Device controlled successfully",
    }

    service.test_connection.return_value = {
        "success": True,
        "message": "Connection successful",
        "version": "2024.1.0",
        "response_time": 0.123,
    }

    return service


@pytest.fixture
def mock_database_service():
    """Create a mock database service."""
    service = AsyncMock()
    service.get_user_configs.return_value = []
    service.create_config.return_value = {
        "id": "config-123",
        "user_id": "test-user-123",
        "name": "Test Config",
        "created_at": "2024-01-01T12:00:00Z",
    }
    return service


@pytest.fixture
def mock_error_handler():
    """Create a mock error handler service."""
    handler = AsyncMock()
    handler.get_service_health.return_value = {
        "healthy": True,
        "services": {"home_assistant_rest": True, "home_assistant_websocket": True},
        "circuit_breaker_status": "closed",
    }

    handler.get_circuit_breaker_status.return_value = {
        "home_assistant_rest": "closed",
        "home_assistant_websocket": "closed",
        "failure_counts": {"home_assistant_rest": 0, "home_assistant_websocket": 0},
    }

    return handler


@pytest.fixture(autouse=True)
def mock_environment_variables(monkeypatch):
    """Mock environment variables for testing."""
    test_env_vars = {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "test_service_key",
        "SUPABASE_ANON_KEY": "test_anon_key",
        "JWT_SECRET_KEY": "test_jwt_secret",
        "ENVIRONMENT": "test",
        "CORS_ORIGINS": '["http://localhost:3000"]',
        "LOG_LEVEL": "INFO",
    }

    for key, value in test_env_vars.items():
        monkeypatch.setenv(key, value)


# Pytest markers for test categorization
pytestmark = [
    pytest.mark.asyncio,
]
