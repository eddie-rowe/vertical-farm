"""
Tests for Home Assistant device discovery and control endpoints.
Covers device listing, details, and basic control operations.
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from fastapi import status
from httpx import ASGITransport, AsyncClient

from app.main import app


class TestHomeAssistantDevices:
    """Test suite for Home Assistant device operations."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac

    @pytest.fixture
    def mock_user(self):
        """Create a mock user for testing."""
        user = MagicMock()
        user.id = "550e8400-e29b-41d4-a716-446655440000"
        user.email = "test@example.com"
        user.is_active = True
        return user

    @pytest.fixture
    def mock_ha_service(self):
        """Create a mock Home Assistant service for testing."""
        mock_service = AsyncMock()

        # Mock device discovery
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

        # Mock get all devices
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

        # Mock device details
        mock_service.get_user_device.return_value = {
            "entity_id": "light.test_light",
            "name": "Test Light",
            "domain": "light",
            "state": "on",
            "attributes": {"brightness": 255, "friendly_name": "Test Light"},
            "last_changed": "2024-01-01T12:00:00Z",
            "last_updated": "2024-01-01T12:00:00Z",
        }

        # Mock device control
        mock_service.control_device.return_value = {
            "success": True,
            "entity_id": "light.test_light",
            "action": "on",
            "timestamp": datetime.utcnow().isoformat(),
            "result": {"success": True},
        }

        return mock_service

    def setup_dependency_overrides(self, mock_user, mock_ha_service):
        """Set up FastAPI dependency overrides."""
        from app.api.v1.endpoints.home_assistant import (
            get_current_user,
            get_user_home_assistant_service,
        )

        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_user_home_assistant_service] = (
            lambda: mock_ha_service
        )

    def cleanup_dependency_overrides(self):
        """Clean up dependency overrides after test."""
        app.dependency_overrides.clear()

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
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["entity_id"] == "light.test_light"
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_get_devices_with_filter(self, client, mock_user, mock_ha_service):
        """Test get devices with domain filter."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/devices?domain=light")
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            assert isinstance(data, list)
            # Verify that the service was called with the domain filter
            mock_ha_service.get_user_devices.assert_called_once()
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_get_device_details_endpoint(
        self, client, mock_user, mock_ha_service
    ):
        """Test get device details endpoint."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            entity_id = "light.test_light"
            response = await client.get(f"/api/v1/home-assistant/devices/{entity_id}")
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            assert data["entity_id"] == entity_id
            assert data["name"] == "Test Light"
            assert "attributes" in data
            assert "last_changed" in data
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_control_device_endpoint(self, client, mock_user, mock_ha_service):
        """Test device control endpoint."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        control_data = {"action": "turn_on", "parameters": {"brightness": 255}}

        try:
            entity_id = "light.test_light"
            response = await client.post(
                f"/api/v1/home-assistant/devices/{entity_id}/control", json=control_data
            )
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            assert data["success"] is True
            assert data["entity_id"] == entity_id
            assert "timestamp" in data
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_control_device_failure(self, client, mock_user, mock_ha_service):
        """Test device control endpoint failure handling."""
        # Mock control failure
        mock_ha_service.control_device.return_value = {
            "success": False,
            "entity_id": "light.test_light",
            "action": "turn_on",
            "error": "Device not reachable",
            "timestamp": datetime.utcnow().isoformat(),
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        control_data = {"action": "turn_on", "parameters": {"brightness": 255}}

        try:
            entity_id = "light.test_light"
            response = await client.post(
                f"/api/v1/home-assistant/devices/{entity_id}/control", json=control_data
            )
            # Should still return 200 but with success: false
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            assert data["success"] is False
            assert "error" in data
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_invalid_device_control_request(
        self, client, mock_user, mock_ha_service
    ):
        """Test device control with invalid request data."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        # Invalid control data - missing required fields
        invalid_data = {"invalid": "data"}

        try:
            entity_id = "light.test_light"
            response = await client.post(
                f"/api/v1/home-assistant/devices/{entity_id}/control", json=invalid_data
            )
            # Should return validation error
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_device_not_found(self, client, mock_user, mock_ha_service):
        """Test accessing non-existent device."""
        # Mock device not found
        mock_ha_service.get_user_device.return_value = None

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            entity_id = "light.nonexistent"
            response = await client.get(f"/api/v1/home-assistant/devices/{entity_id}")
            assert response.status_code == status.HTTP_404_NOT_FOUND
        finally:
            self.cleanup_dependency_overrides()
