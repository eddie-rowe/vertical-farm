"""
Comprehensive tests for critical Home Assistant API endpoints.

This test suite covers the most critical endpoints identified in the code review:
- Health checks and status endpoints
- Device discovery and listing
- Device control operations
- Configuration management
- Error handling and edge cases
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi import status
from httpx import ASGITransport, AsyncClient

from app.main import app


class TestHomeAssistantEndpoints:
    """Test suite for Home Assistant integration endpoints."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac

    def setup_dependency_overrides(self, mock_user, mock_ha_service):
        """Helper method to set up FastAPI dependency overrides."""
        from app.api.v1.endpoints.home_assistant import (
            get_current_user,
            get_user_home_assistant_service,
        )
        from app.main import app

        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_user_home_assistant_service] = (
            lambda: mock_ha_service
        )

    def cleanup_dependency_overrides(self):
        """Clean up dependency overrides after test."""
        from app.main import app

        app.dependency_overrides.clear()

    @pytest.fixture
    def mock_user(self):
        """Create a mock user for testing."""
        from unittest.mock import MagicMock

        user = MagicMock()
        user.id = "550e8400-e29b-41d4-a716-446655440000"  # Proper UUID format
        user.email = "test@example.com"
        user.is_active = True
        return user

    @pytest.fixture
    def mock_ha_service(self):
        """Create a mock Home Assistant service for testing."""
        from datetime import datetime
        from unittest.mock import AsyncMock

        # Create an AsyncMock for the service
        mock_service = AsyncMock()

        # Configure return values for various methods - these should be actual values, not coroutines
        mock_service.get_user_integration_status.return_value = {
            "healthy": True,
            "enabled": True,
            "initialized": True,
            "rest_api_available": True,
            "websocket_connected": False,
            "last_check": "2024-06-19T13:20:05.111018",
        }

        # Mock device discovery - return actual list, not coroutine
        mock_service.get_user_devices.return_value = [
            {
                "entity_id": "light.test_light",
                "name": "Test Light",
                "domain": "light",
                "state": "on",
                "attributes": {"brightness": 255},
                "last_changed": "2024-01-01T12:00:00Z",
                "last_updated": "2024-01-01T12:00:00Z",
            }
        ]

        # Mock discover devices method
        mock_service.discover_devices.return_value = {
            "devices": [
                {
                    "entity_id": "light.test_light",
                    "name": "Test Light",
                    "domain": "light",
                    "state": "on",
                    "attributes": {"brightness": 255},
                }
            ],
            "total_count": 1,
        }

        # Mock device details - return actual dict, not coroutine
        mock_service.get_user_device.return_value = {
            "entity_id": "light.test_light",
            "name": "Test Light",
            "domain": "light",
            "state": "on",
            "attributes": {"brightness": 255, "friendly_name": "Test Light"},
            "last_changed": "2024-01-01T12:00:00Z",
            "last_updated": "2024-01-01T12:00:00Z",
        }

        # Mock device control - return actual dict with timestamp
        mock_service.control_device.return_value = {
            "success": True,
            "entity_id": "light.test_light",
            "action": "on",
            "timestamp": datetime.utcnow().isoformat(),
            "result": {"success": True},
        }

        # Mock light control - return actual dict with timestamp
        mock_service.control_light.return_value = {
            "success": True,
            "entity_id": "light.test_light",
            "action": "on",
            "timestamp": datetime.utcnow().isoformat(),
            "result": {"success": True},
        }

        # Mock sensor data - return actual dict with proper datetime fields
        mock_service.get_sensor_data.return_value = {
            "sensors": [
                {
                    "entity_id": "sensor.temperature",
                    "state": "22.5",
                    "unit": "°C",
                    "timestamp": "2024-01-01T12:00:00Z",
                    "last_updated": "2024-01-01T12:00:00Z",
                }
            ],
            "total_count": 1,
        }

        # Mock test connection - use regular function, not async mock for this one
        def mock_test_connection(url, access_token):
            return {
                "success": True,
                "url": url,
                "status": "connected",
                "message": "Connection successful",
                "home_assistant_version": "2024.1.0",
                "device_count": 10,
                "websocket_supported": True,
                "rest_api_working": True,
                "cloudflare_working": False,
                "error_details": None,
            }

        # Assign the function directly (not as a coroutine)
        mock_service.test_connection = mock_test_connection

        return mock_service

    @pytest.mark.asyncio
    async def test_health_check_endpoint(self, client, mock_user, mock_ha_service):
        """Test the health check endpoint returns proper status."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/health")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "healthy" in data
            assert "services" in data
            assert data["services"]["home_assistant"] is True
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_health_check_failure(self, client, mock_user, mock_ha_service):
        """Test health check when service is unhealthy."""
        mock_ha_service.get_user_integration_status.side_effect = Exception(
            "Service unavailable"
        )

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/health")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["healthy"] is False
            assert data["services"]["home_assistant"] is False
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_integration_status_endpoint(
        self, client, mock_user, mock_ha_service
    ):
        """Test the integration status endpoint."""
        mock_ha_service.get_user_integration_status.return_value = {
            "healthy": True,
            "enabled": True,
            "initialized": True,
            "rest_api_available": True,
            "websocket_connected": False,
            "last_check": "2024-06-19T13:20:05.111018",
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/status")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["healthy"] is True
            assert data["enabled"] is True
            assert data["initialized"] is True
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_integration_status_failure(self, client, mock_user, mock_ha_service):
        """Test integration status when service fails."""
        mock_ha_service.get_user_integration_status.side_effect = Exception(
            "Connection failed"
        )

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/status")

            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_discover_devices_endpoint(self, client, mock_user, mock_ha_service):
        """Test device discovery endpoint."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.post("/api/v1/home-assistant/discover")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "devices" in data
            assert "total_count" in data
            assert len(data["devices"]) == 1
            assert data["devices"][0]["entity_id"] == "light.test_light"
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_get_all_devices_endpoint(self, client, mock_user, mock_ha_service):
        """Test get all devices endpoint."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/devices")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "devices" in data
            assert "total_count" in data
            assert len(data["devices"]) == 1
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_get_devices_with_filter(self, client, mock_user, mock_ha_service):
        """Test get devices with device type filter."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get(
                "/api/v1/home-assistant/devices?device_type=light"
            )

            assert response.status_code == status.HTTP_200_OK
            mock_ha_service.get_user_devices.assert_called_with(
                "550e8400-e29b-41d4-a716-446655440000", "light"
            )
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_get_device_details_endpoint(
        self, client, mock_user, mock_ha_service
    ):
        """Test get specific device details."""
        mock_ha_service.get_user_device.return_value = {
            "entity_id": "light.test_light",
            "name": "Test Light",
            "domain": "light",
            "state": "on",
            "attributes": {"brightness": 255, "friendly_name": "Test Light"},
            "last_changed": "2024-01-01T12:00:00Z",
            "last_updated": "2024-01-01T12:00:00Z",
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get(
                "/api/v1/home-assistant/devices/light.test_light"
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()

            # The response is wrapped in a DeviceDetailsResponse structure
            assert data["found"] is True
            assert "device" in data
            device = data["device"]
            assert device["entity_id"] == "light.test_light"
            assert device["friendly_name"] == "Test Light"
            assert device["state"] == "on"
            assert device["domain"] == "light"
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_control_device_endpoint(self, client, mock_user, mock_ha_service):
        """Test device control endpoint."""
        mock_ha_service.control_device.return_value = {
            "success": True,
            "entity_id": "light.test_light",
            "action": "on",
            "timestamp": datetime.utcnow().isoformat(),
            "result": {"success": True},
        }

        control_request = {"entity_id": "light.test_light", "action": "on"}

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.post(
                "/api/v1/home-assistant/devices/control", json=control_request
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert data["entity_id"] == "light.test_light"
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_control_device_failure(self, client, mock_user, mock_ha_service):
        """Test device control when operation fails."""
        mock_ha_service.control_device.side_effect = Exception("Device not found")

        control_request = {"entity_id": "light.nonexistent", "action": "on"}

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.post(
                "/api/v1/home-assistant/devices/control", json=control_request
            )

            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_control_light_endpoint(self, client, mock_user, mock_ha_service):
        """Test light control with advanced parameters."""
        mock_ha_service.control_light.return_value = {
            "success": True,
            "entity_id": "light.test_light",
            "action": "on",
            "timestamp": datetime.utcnow().isoformat(),
            "result": {"success": True},
        }

        light_request = {
            "entity_id": "light.test_light",
            "action": "on",
            "brightness": 128,
            "rgb_color": [255, 0, 0],
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.post(
                "/api/v1/home-assistant/lights/control", json=light_request
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert data["entity_id"] == "light.test_light"
            assert data["action"] == "on"
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_get_sensor_data_endpoint(self, client, mock_user, mock_ha_service):
        """Test sensor data retrieval."""
        mock_ha_service.get_sensor_data.return_value = {
            "sensors": [
                {
                    "entity_id": "sensor.temperature",
                    "state": "22.5",
                    "unit": "°C",
                    "timestamp": "2024-01-01T12:00:00Z",
                    "last_updated": "2024-01-01T12:00:00Z",
                }
            ],
            "total_count": 1,
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/sensors")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "sensors" in data
            assert len(data["sensors"]) == 1
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_create_config_endpoint(self, client, mock_user):
        """Test creating Home Assistant configuration."""
        config_request = {
            "name": "Test HA Instance",
            "url": "http://homeassistant.local:8123",
            "access_token": "test_token_123",
            "verify_ssl": True,
        }

        self.setup_dependency_overrides(mock_user, None)

        try:
            # Mock the Supabase client function that the endpoint actually uses
            with patch(
                "app.api.v1.endpoints.home_assistant.get_async_supabase_client",
                new_callable=AsyncMock,
            ) as mock_get_client:
                # Create a proper mock client with async operations
                mock_client = MagicMock()
                mock_table = MagicMock()
                mock_select_chain = MagicMock()
                mock_insert_chain = MagicMock()

                # Mock the select query for existing configs (should return empty)
                mock_select_result = MagicMock()
                mock_select_result.data = []
                mock_select_chain.execute = AsyncMock(return_value=mock_select_result)

                # Set up the chain: from_ -> select -> eq -> execute
                mock_table.select.return_value.eq.return_value = mock_select_chain

                # Mock the insert operation
                mock_insert_result = MagicMock()
                mock_insert_result.data = [
                    {
                        "id": "test-config-id",
                        "name": "Test HA Instance",
                        "url": "http://homeassistant.local:8123",
                        "local_url": None,
                        "cloudflare_enabled": False,
                        "is_default": True,
                        "enabled": True,
                        "last_tested": None,
                        "last_successful_connection": None,
                        "test_result": None,
                        "created_at": "2024-01-01T12:00:00Z",
                        "updated_at": "2024-01-01T12:00:00Z",
                    }
                ]
                mock_insert_chain.execute = AsyncMock(return_value=mock_insert_result)
                mock_table.insert.return_value = mock_insert_chain

                # Wire up the mock client
                mock_client.from_.return_value = mock_table
                # Configure the AsyncMock to return the mock client when awaited
                mock_get_client.return_value = mock_client

                response = await client.post(
                    "/api/v1/home-assistant/config", json=config_request
                )

                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["name"] == "Test HA Instance"
                assert data["url"] == "http://homeassistant.local:8123"
                assert data["is_default"] is True
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_test_connection_endpoint(self, client, mock_user, mock_ha_service):
        """Test Home Assistant connection testing."""
        # Mock the test_user_connection method properly to return actual values
        mock_ha_service.test_user_connection = AsyncMock(
            return_value={
                "success": True,
                "url": "http://homeassistant.local:8123",
                "status": "connected",
                "message": "Connection successful",
                "home_assistant_version": "2024.1.0",
                "device_count": 10,
                "websocket_supported": True,
                "rest_api_working": True,
                "cloudflare_working": False,
                "error_details": None,
            }
        )

        test_request = {
            "url": "http://homeassistant.local:8123",
            "access_token": "test_token_123",
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.post(
                "/api/v1/home-assistant/test-connection", json=test_request
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert data["url"] == "http://homeassistant.local:8123"
            assert data["status"] == "connected"
            assert data["home_assistant_version"] == "2024.1.0"
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_test_connection_failure(self, client, mock_user, mock_ha_service):
        """Test Home Assistant connection testing with failure."""
        # Mock the test_user_connection method to return failure
        mock_ha_service.test_user_connection = AsyncMock(
            return_value={
                "success": False,
                "url": "http://invalid.local:8123",
                "status": "failed",
                "message": "Connection failed",
                "home_assistant_version": None,
                "device_count": None,
                "websocket_supported": False,
                "rest_api_working": False,
                "cloudflare_working": None,
                "error_details": "Connection timeout after 10 seconds",
            }
        )

        test_request = {
            "url": "http://invalid.local:8123",
            "access_token": "invalid_token",
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.post(
                "/api/v1/home-assistant/test-connection", json=test_request
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is False
            assert data["status"] == "failed"
            assert "timeout" in data["error_details"]
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, client):
        """Test that endpoints require authentication."""
        response = await client.get("/api/v1/home-assistant/status")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_invalid_device_control_request(
        self, client, mock_user, mock_ha_service
    ):
        """Test device control with invalid request data."""
        invalid_request = {
            "entity_id": "",  # Empty entity_id should fail validation
            "action": "invalid_action",
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.post(
                "/api/v1/home-assistant/devices/control", json=invalid_request
            )

            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_error_monitoring_health(self, client, mock_user):
        """Test error monitoring health endpoint."""
        self.setup_dependency_overrides(mock_user, None)

        try:
            with patch(
                "app.services.error_handling.global_error_handler"
            ) as mock_error_handler:
                mock_error_handler.get_service_health.return_value = {
                    "healthy": True,
                    "services": {
                        "home_assistant_rest": True,
                        "home_assistant_websocket": True,
                    },
                    "circuit_breaker_status": "closed",
                }

                response = await client.get(
                    "/api/v1/home-assistant/error-monitoring/health"
                )

                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert "overall_healthy" in data
                assert "services" in data
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_circuit_breaker_status(self, client, mock_user):
        """Test circuit breaker status endpoint."""
        self.setup_dependency_overrides(mock_user, None)

        try:
            with patch(
                "app.services.error_handling.global_error_handler"
            ) as mock_error_handler:
                mock_error_handler.get_circuit_breaker_status.return_value = {
                    "home_assistant_rest": "closed",
                    "home_assistant_websocket": "open",
                    "failure_counts": {
                        "home_assistant_rest": 0,
                        "home_assistant_websocket": 5,
                    },
                }

                response = await client.get(
                    "/api/v1/home-assistant/error-monitoring/circuit-breaker-status"
                )

                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert "circuit_breakers" in data
                assert "overall_healthy" in data
        finally:
            self.cleanup_dependency_overrides()


@pytest.mark.asyncio
async def test_main_health_endpoint():
    """Test the main application health endpoint."""
    with patch(
        "app.main.supabase_background_service.get_system_health"
    ) as mock_bg_health:

        # Mock background service health as healthy
        mock_bg_health.return_value = {
            "status": "healthy",
            "success_rate": 100.0,
            "total_queue_length": 0,
        }

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            response = await ac.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert data["services"]["background_processor"]["status"] == "healthy"
        assert data["services"]["database"]["status"] == "supabase_postgrest"


@pytest.mark.asyncio
async def test_main_healthz_endpoint():
    """Test the Kubernetes-style health endpoint."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    # healthz returns simple "ok" status for Kubernetes compatibility
    assert data["status"] == "ok"
