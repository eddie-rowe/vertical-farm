# Backend Test Suite

## 📂 **Organized Test Structure**

Our backend tests are now organized by **purpose and scope** for better maintainability:

```
backend/app/tests/
├── unit/                    # Fast isolated tests (< 100ms each)
│   └── test_crud_operations.py
├── integration/             # Multi-component tests (500ms-2s each)
│   ├── test_integration_features.py
│   └── test_background_queue_basic.py
├── api/                     # HTTP endpoint tests (100-500ms each)
│   ├── test_main_endpoints.py
│   ├── test_home_assistant_health.py
│   └── test_home_assistant_devices.py
├── schemas/                 # Pydantic validation tests (< 50ms each)
│   ├── test_fan_schemas.py
│   └── test_sensor_device_schemas.py
├── performance/             # Performance & load testing (manual)
│   ├── background-queue-test.py      # 325 lines - Load testing
│   ├── database-load-test.js          # k6 performance testing
│   └── README.md
└── conftest.py             # ✅ UPDATED: Modern service mocks & comprehensive test data
```

## 🎯 **Test Categories**

### **Unit Tests** (`unit/`)
- **Purpose**: Test individual functions/classes in isolation
- **Speed**: < 100ms per test
- **Mocking**: Heavy use of mocks for dependencies
- **Coverage**: Business logic, CRUD operations, services

### **API Tests** (`api/`)
- **Purpose**: Test HTTP endpoints and request/response validation
- **Speed**: 100-500ms per test  
- **Mocking**: Mock external services, use test database
- **Coverage**: Endpoint behavior, authentication, error handling

### **Integration Tests** (`integration/`)
- **Purpose**: Test component interactions and data flow
- **Speed**: 500ms-2s per test
- **Mocking**: Minimal - use real database connections when possible
- **Coverage**: Service integrations, database operations

### **Schema Tests** (`schemas/`)
- **Purpose**: Test Pydantic model validation and serialization
- **Speed**: < 50ms per test
- **Mocking**: None needed
- **Coverage**: Data validation, API contracts

## 🚀 **Running Tests**

### **Run All Tests**
```bash
cd backend
source venv/bin/activate
pytest app/tests/ -v
```

### **Run by Category**
```bash
# Unit tests only (fastest)
pytest app/tests/unit/ -v

# Integration tests only  
pytest app/tests/integration/ -v

# API tests only
pytest app/tests/api/ -v

# Schema tests only
pytest app/tests/schemas/ -v

# Performance tests (manual only)
cd app/tests/performance/
python background-queue-test.py
```

### **Run with Coverage**
```bash
pytest app/tests/ --cov=app --cov-report=html --cov-report=term
```

### **Run Specific Test File**
```bash
pytest app/tests/unit/test_crud_operations.py -v
```

### **Run Specific Test**
```bash
pytest app/tests/api/test_main_endpoints.py::test_health_check_endpoint -v
```

## 📊 **CI/CD Integration**

Our GitHub Actions CI/CD runs tests in **parallel** by category:

- ✅ **Unit Tests**: Fast isolated tests (< 100ms each)
- ✅ **Integration Tests**: Multi-component interaction tests (< 2s each)
- ✅ **API Tests**: Endpoint validation with mocked services (< 500ms each)
- ✅ **Schema Tests**: Data validation tests (< 50ms each)

**Note**: Performance tests are excluded from CI/CD and run manually for specialized testing.

## 🔧 **Updated Test Infrastructure**

### **`conftest.py` Modernization**

The `conftest.py` file has been updated to support the modern backend architecture:

**✅ Modern Service Mocks:**
- `mock_database_service` - PostgreSQL/Supabase connections
- `mock_cache_service` - Application-wide caching
- `mock_sensor_cache_service` - Sensor data caching
- `mock_device_monitoring_service` - Device control & WebSocket management
- `mock_grow_automation_service` - Automation schedules & conditions
- `mock_supabase_background_service` - Background task processing
- `mock_user_home_assistant_service` - User-specific HA connections
- `mock_error_handler` - Circuit breaker & error recovery

**✅ Comprehensive Test Data:**
- Farm hierarchy: `sample_farm_data`, `sample_row_data`, `sample_rack_data`, `sample_shelf_data`
- Device data: `sample_sensor_device_data`, `sample_fan_data`, `sample_device_assignment`
- User data: `mock_user`, `mock_admin_user`, `mock_manager_user` with proper roles
- Home Assistant: `sample_home_assistant_config`, `sample_device_data` with realistic attributes
- Background tasks: `sample_background_task_data`, `sample_automation_schedule_data`
- Sensor readings: `sample_sensor_reading_data` with metadata and farm location

**✅ Complex Scenario Fixtures:**
- `complete_farm_setup` - Full farm hierarchy with linked data
- `integration_test_data` - Combined user, HA config, and device data for integration tests

### **Integration vs Performance: Background Queue Example**

We have **two different tests** for background queue functionality to serve different purposes:

| Test | Purpose | Location | Duration | CI/CD |
|------|---------|----------|----------|-------|
| `test_background_queue_basic.py` | Component interaction testing | `integration/` | < 2s | ✅ Included |
| `background-queue-test.py` | Load testing & performance validation | `performance/` | 2-10 min | ❌ Manual only |

**Integration Test** focuses on:
- ✅ Task enqueuing works correctly
- ✅ Status checking returns proper data  
- ✅ Task failure handling
- ✅ Priority task ordering
- ✅ Service component interactions

**Performance Test** focuses on:
- ⚡ Queue throughput under load
- ⚡ Memory usage with many tasks
- ⚡ Task processing rates
- ⚡ System behavior under stress
- ⚡ Production-like scenarios

## 🔧 **Test Configuration**

Key pytest settings in `conftest.py`:
- Async test support (`pytest-asyncio`)
- Test database fixtures
- Mock user authentication
- Cleanup between tests

## 📝 **Writing New Tests**

### **Unit Test Example**
```python
# app/tests/unit/test_my_service.py
import pytest
from unittest.mock import MagicMock
from app.services.my_service import MyService

@pytest.mark.asyncio
async def test_my_service_function():
    service = MyService()
    result = await service.my_function("test_input")
    assert result == "expected_output"
```

### **API Test Example**
```python
# app/tests/api/test_my_endpoints.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_my_endpoint(client):
    response = await client.get("/api/v1/my-endpoint")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
```

## 🎯 **Coverage Goals**

- **Unit Tests**: 80%+ coverage of business logic
- **API Tests**: 100% of critical endpoints covered
- **Integration Tests**: Key user workflows covered
- **Schema Tests**: 100% of Pydantic models covered

## 🔍 **Test Quality Standards**

- **Fast**: Unit tests < 100ms, API tests < 500ms
- **Isolated**: No test dependencies on other tests
- **Descriptive**: Clear test names explaining what's being tested
- **Focused**: One assertion per test when possible
- **Reliable**: No flaky tests - fix or remove 