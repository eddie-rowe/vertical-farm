"""
Shared test fixtures and configuration for the backend test suite.
Updated for modern service architecture with comprehensive mocks and test data.
"""

import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator, Dict, Any, List
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
from app.models.enums import UserRole, PermissionLevel, SensorType, FanType, ParentType, RowOrientation


# =============================================================================
# CORE CONFIGURATION FIXTURES
# =============================================================================

@pytest.fixture
def settings():
    """Provide test settings."""
    return get_settings()


@pytest_asyncio.fixture(autouse=True)
async def setup_test_environment():
    """Set up test environment before each test."""
    # Clear any existing patches
    yield
    # Cleanup after test


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI application."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


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
        "DATABASE_URL": "postgresql://test:test@localhost:5432/test_db",
        "TESTING": "true",
    }

    for key, value in test_env_vars.items():
        monkeypatch.setenv(key, value)


# =============================================================================
# MODERN SERVICE MOCKS (Updated Architecture)
# =============================================================================

@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock_client = MagicMock()
    mock_client.auth = MagicMock()
    mock_client.table = MagicMock()
    mock_client.storage = MagicMock()
    mock_client.rpc = MagicMock()
    
    # Mock table operations
    mock_table = MagicMock()
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[])
    mock_client.table.return_value = mock_table
    
    return mock_client


@pytest.fixture
def mock_database_service():
    """Mock modern DatabaseService."""
    mock_service = AsyncMock()
    mock_service.is_available = True
    mock_service.connect = AsyncMock(return_value=True)
    mock_service.disconnect = AsyncMock()
    mock_service.execute_query = AsyncMock(return_value=[])
    mock_service.fetch_one = AsyncMock(return_value=None)
    mock_service.fetch_all = AsyncMock(return_value=[])
    return mock_service


@pytest.fixture
def mock_cache_service():
    """Mock CacheService for testing."""
    mock_service = AsyncMock()
    mock_service.get = AsyncMock(return_value=None)
    mock_service.set = AsyncMock(return_value=True)
    mock_service.delete = AsyncMock(return_value=True)
    mock_service.clear = AsyncMock(return_value=True)
    mock_service.get_stats = AsyncMock(return_value={
        "hits": 0, "misses": 0, "sets": 0, "deletes": 0
    })
    return mock_service


@pytest.fixture
def mock_sensor_cache_service():
    """Mock SensorCacheService for testing."""
    mock_service = AsyncMock()
    mock_service.get_latest_sensor_readings = AsyncMock(return_value=[])
    mock_service.get_sensor_history = AsyncMock(return_value=[])
    mock_service.get_sensor_aggregates = AsyncMock(return_value=[])
    mock_service.get_species_data = AsyncMock(return_value=[])
    mock_service.get_plant_varieties = AsyncMock(return_value=[])
    mock_service.get_grow_recipes = AsyncMock(return_value=[])
    mock_service.invalidate_cache = AsyncMock()
    return mock_service


@pytest.fixture
def mock_device_monitoring_service():
    """Mock DeviceMonitoringService for testing."""
    mock_service = AsyncMock()
    mock_service.start = AsyncMock()
    mock_service.stop = AsyncMock()
    mock_service.connect_websocket = AsyncMock()
    mock_service.disconnect_websocket = AsyncMock()
    mock_service.get_device_assignments = AsyncMock(return_value=[])
    mock_service.assign_device = AsyncMock(return_value=True)
    mock_service.control_device = AsyncMock(return_value={"success": True})
    mock_service.get_device_status = AsyncMock(return_value={"status": "online"})
    return mock_service


@pytest.fixture
def mock_grow_automation_service():
    """Mock GrowAutomationService for testing."""
    mock_service = AsyncMock()
    mock_service.create_schedule = AsyncMock(return_value={"id": "schedule-123"})
    mock_service.create_condition = AsyncMock(return_value={"id": "condition-123"})
    mock_service.create_rule = AsyncMock(return_value={"id": "rule-123"})
    mock_service.get_active_schedules = AsyncMock(return_value=[])
    mock_service.get_active_conditions = AsyncMock(return_value=[])
    mock_service.enable_schedule = AsyncMock(return_value=True)
    mock_service.disable_schedule = AsyncMock(return_value=True)
    return mock_service


@pytest.fixture
def mock_supabase_background_service():
    """Mock SupabaseBackgroundService for testing."""
    mock_service = AsyncMock()
    mock_service.queue_task = AsyncMock(return_value="task-123")
    mock_service.get_task_status = AsyncMock(return_value={
        "task_id": "task-123",
        "status": "completed",
        "result": {"success": True}
    })
    mock_service.cancel_task = AsyncMock(return_value=True)
    mock_service.get_queue_stats = AsyncMock(return_value={
        "queued": 0, "processing": 0, "completed": 5, "failed": 0
    })
    mock_service.get_registered_functions = AsyncMock(return_value=[])
    return mock_service


@pytest.fixture
def mock_home_assistant_service():
    """Create a mock Home Assistant service with enhanced responses."""
    service = AsyncMock()

    # Enhanced service responses
    service.initialize = AsyncMock(return_value=True)
    service.close = AsyncMock()
    service.is_enabled = AsyncMock(return_value=True)
    
    service.get_user_integration_status.return_value = {
        "healthy": True,
        "rest_api": True,
        "websocket": True,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "device_count": 15,
        "version": "2024.1.0"
    }

    service.get_user_devices.return_value = [
        {
            "entity_id": "light.test_light",
            "name": "Test Light",
            "state": "on",
            "attributes": {"brightness": 255, "friendly_name": "Test Light"},
            "domain": "light",
            "last_changed": datetime.now(timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        },
        {
            "entity_id": "sensor.temperature",
            "name": "Temperature Sensor",
            "state": "22.5",
            "attributes": {"unit_of_measurement": "°C", "friendly_name": "Temperature"},
            "domain": "sensor",
            "last_changed": datetime.now(timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat(),
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
        "rest_api_working": True,
        "websocket_supported": True,
        "cloudflare_working": False
    }

    service.discover_devices = AsyncMock(return_value={"devices_found": 15})
    service.get_available_services = AsyncMock(return_value={
        "light": {"turn_on": {}, "turn_off": {}},
        "switch": {"turn_on": {}, "turn_off": {}}
    })

    return service


@pytest.fixture
def mock_user_home_assistant_service():
    """Mock UserHomeAssistantService for testing."""
    mock_service = AsyncMock()
    mock_service.get_user_connection = AsyncMock(return_value=None)
    mock_service.create_user_connection = AsyncMock(return_value=True)
    mock_service.test_user_connection = AsyncMock(return_value={"success": True})
    mock_service.get_user_devices = AsyncMock(return_value=[])
    mock_service.control_user_device = AsyncMock(return_value={"success": True})
    mock_service.close_user_connection = AsyncMock()
    return mock_service


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

    handler.register_service = MagicMock()
    handler.register_recovery_callback = MagicMock()
    handler.start_health_monitoring = AsyncMock()
    handler.stop_health_monitoring = AsyncMock()

    return handler


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.delete = AsyncMock(return_value=1)
    mock_redis.exists = AsyncMock(return_value=False)
    mock_redis.expire = AsyncMock(return_value=True)
    mock_redis.flushdb = AsyncMock(return_value=True)
    return mock_redis


# =============================================================================
# USER & AUTHENTICATION FIXTURES
# =============================================================================

@pytest.fixture
def mock_user():
    """Create a mock authenticated user."""
    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.is_active = True
    user.is_superuser = False
    user.role = UserRole.OPERATOR
    user.is_admin = False
    user.is_manager = False
    user.can_manage_devices = False
    user.can_view_all_data = False
    return user


@pytest.fixture
def mock_admin_user():
    """Create a mock admin user."""
    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = "admin@example.com"
    user.full_name = "Admin User"
    user.is_active = True
    user.is_superuser = True
    user.role = UserRole.ADMIN
    user.is_admin = True
    user.is_manager = True
    user.can_manage_devices = True
    user.can_view_all_data = True
    return user


@pytest.fixture
def mock_manager_user():
    """Create a mock manager user."""
    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = "manager@example.com"
    user.full_name = "Farm Manager"
    user.is_active = True
    user.is_superuser = False
    user.role = UserRole.FARM_MANAGER
    user.is_admin = False
    user.is_manager = True
    user.can_manage_devices = True
    user.can_view_all_data = True
    return user


# =============================================================================
# COMPREHENSIVE SAMPLE DATA FIXTURES
# =============================================================================

@pytest.fixture
def sample_farm_data():
    """Sample farm data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "name": "Test Vertical Farm",
        "location": "Test City, Test State",
        "farm_image_url": "https://example.com/farm.jpg",
        "width": 10.0,
        "depth": 8.0,
        "height": 3.0,
        "user_id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_row_data():
    """Sample row data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "farm_id": str(uuid.uuid4()),
        "name": "Row A",
        "orientation": RowOrientation.NORTH_SOUTH,
        "position_x": 0.0,
        "position_y": 0.0,
        "width": 2.0,
        "depth": 8.0,
        "height": 3.0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_rack_data():
    """Sample rack data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "row_id": str(uuid.uuid4()),
        "name": "Rack 1",
        "position_x": 0.0,
        "position_y": 0.0,
        "width": 1.0,
        "depth": 2.0,
        "height": 3.0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_shelf_data():
    """Sample shelf data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "rack_id": str(uuid.uuid4()),
        "name": "Shelf 1",
        "level": 1,
        "position_z": 1.0,
        "width": 1.0,
        "depth": 2.0,
        "height": 0.5,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_sensor_device_data():
    """Sample sensor device data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "name": "Temperature Sensor 1",
        "model_number": "DHT22",
        "sensor_type": SensorType.TEMPERATURE,
        "measurement_unit": "°C",
        "data_range_min": -40.0,
        "data_range_max": 80.0,
        "accuracy": "±0.5°C",
        "parent_type": ParentType.SHELF,
        "parent_id": str(uuid.uuid4()),
        "position_x": 0.5,
        "position_y": 1.0,
        "position_z": 0.25,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_fan_data():
    """Sample fan data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "name": "Circulation Fan 1",
        "model_number": "CF120",
        "type": FanType.CIRCULATION,
        "size_cm": 12.0,
        "airflow_cfm": 120.0,
        "power_watts": 15.0,
        "parent_type": ParentType.RACK,
        "parent_id": str(uuid.uuid4()),
        "position_x": 0.5,
        "position_y": 0.0,
        "position_z": 2.5,
        "orientation": "front",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_user_permission_data():
    """Sample user permission data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "farm_id": str(uuid.uuid4()),
        "permission": PermissionLevel.READ_WRITE,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_home_assistant_config():
    """Enhanced Home Assistant configuration for testing."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "name": "Test Home Assistant",
        "url": "http://homeassistant.local:8123",
        "access_token": "test_token_123",
        "local_url": "http://192.168.1.100:8123",
        "cloudflare_enabled": False,
        "cloudflare_client_id": None,
        "cloudflare_client_secret": None,
        "is_default": True,
        "enabled": True,
        "last_tested": datetime.now(timezone.utc),
        "last_successful_connection": datetime.now(timezone.utc),
        "test_result": {
            "success": True,
            "version": "2024.1.0",
            "device_count": 15,
            "response_time": 0.123
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_device_data():
    """Enhanced device data for testing."""
    return {
        "entity_id": "light.grow_light_1",
        "state": "on",
        "attributes": {
            "friendly_name": "Grow Light 1",
            "supported_features": 41,
            "brightness": 255,
            "color_temp": 3000,
            "rgb_color": [255, 255, 255]
        },
        "domain": "light",
        "device_class": None,
        "unit_of_measurement": None,
        "last_changed": datetime.now(timezone.utc),
        "last_updated": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_device_assignment():
    """Enhanced device assignment for testing."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "device_id": "light.grow_light_1",
        "device_name": "Grow Light 1",
        "device_type": "light",
        "farm_location": {
            "farm_id": str(uuid.uuid4()),
            "row_id": str(uuid.uuid4()),
            "rack_id": str(uuid.uuid4()),
            "shelf_id": str(uuid.uuid4())
        },
        "position": {"x": 0.5, "y": 1.0, "z": 2.5},
        "configuration": {
            "brightness": 80,
            "color_temp": 3000,
            "schedule": "daily"
        },
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_sensor_reading_data():
    """Sample sensor reading data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "sensor_id": str(uuid.uuid4()),
        "entity_id": "sensor.temperature_1",
        "sensor_type": SensorType.TEMPERATURE,
        "value": 22.5,
        "unit": "°C",
        "timestamp": datetime.now(timezone.utc),
        "farm_location": {
            "farm_id": str(uuid.uuid4()),
            "row_id": str(uuid.uuid4()),
            "rack_id": str(uuid.uuid4()),
            "shelf_id": str(uuid.uuid4())
        },
        "metadata": {
            "accuracy": "±0.5°C",
            "calibration_date": datetime.now(timezone.utc) - timedelta(days=30),
            "battery_level": 85
        }
    }


@pytest.fixture
def sample_background_task_data():
    """Sample background task data for testing."""
    return {
        "id": "task_123",
        "type": "home_assistant.device_discovery",
        "priority": "normal",
        "status": "queued",
        "payload": {
            "user_id": str(uuid.uuid4()),
            "config_id": str(uuid.uuid4()),
            "filters": ["light", "sensor"]
        },
        "metadata": {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "retry_count": 0,
            "max_retries": 3,
            "estimated_duration": "10-30 seconds"
        },
        "result": None,
        "error": None,
        "started_at": None,
        "completed_at": None
    }


@pytest.fixture
def sample_automation_schedule_data():
    """Sample automation schedule data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "device_assignment_id": str(uuid.uuid4()),
        "schedule_name": "Daily Light Schedule",
        "schedule_type": "daily",
        "cron_expression": "0 6 * * *",
        "device_action": {
            "action_type": "turn_on",
            "parameters": {"brightness": 80, "color_temp": 3000}
        },
        "starts_at": datetime.now(timezone.utc),
        "ends_at": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_run": None,
        "next_run": datetime.now(timezone.utc) + timedelta(hours=24)
    }


# =============================================================================
# COMPLEX SCENARIO FIXTURES
# =============================================================================

@pytest.fixture
def complete_farm_setup(
    sample_farm_data,
    sample_row_data, 
    sample_rack_data,
    sample_shelf_data,
    sample_sensor_device_data,
    sample_device_assignment
):
    """Complete farm setup with hierarchical data."""
    # Link the data together
    sample_row_data["farm_id"] = sample_farm_data["id"]
    sample_rack_data["row_id"] = sample_row_data["id"]
    sample_shelf_data["rack_id"] = sample_rack_data["id"]
    sample_sensor_device_data["parent_id"] = sample_shelf_data["id"]
    
    return {
        "farm": sample_farm_data,
        "row": sample_row_data,
        "rack": sample_rack_data,
        "shelf": sample_shelf_data,
        "sensor": sample_sensor_device_data,
        "device_assignment": sample_device_assignment
    }


@pytest.fixture
def integration_test_data(
    mock_user,
    sample_home_assistant_config,
    sample_device_assignment,
    sample_background_task_data
):
    """Integration test data combining user, HA config, and device data."""
    return {
        "user": mock_user,
        "ha_config": sample_home_assistant_config,
        "device_assignment": sample_device_assignment,
        "background_task": sample_background_task_data
    }


# Pytest markers for test categorization
pytestmark = [
    pytest.mark.asyncio,
]
