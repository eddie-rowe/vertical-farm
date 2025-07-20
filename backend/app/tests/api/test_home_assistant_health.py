"""
Tests for Home Assistant health and status endpoints.
Focused on connectivity, integration status, and health checks.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from fastapi import status
from httpx import ASGITransport, AsyncClient

from app.main import app


class TestHomeAssistantHealth:
    """Test suite for Home Assistant health and status endpoints."""

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

        # Mock integration status
        mock_service.get_user_integration_status.return_value = {
            "healthy": True,
            "enabled": True,
            "initialized": True,
            "rest_api_available": True,
            "websocket_connected": False,
            "last_check": "2024-06-19T13:20:05.111018",
        }

        return mock_service

    def setup_dependency_overrides(self, mock_user, mock_ha_service) -> None:
        """Set up FastAPI dependency overrides."""
        from app.api.v1.endpoints.home_assistant import (
            get_current_user,
            get_user_home_assistant_service,
        )

        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[get_user_home_assistant_service] = (
            lambda: mock_ha_service
        )

    def cleanup_dependency_overrides(self) -> None:
        """Clean up dependency overrides after test."""
        app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_health_check_endpoint(self, client, mock_user, mock_ha_service) -> None:
        """Test the health check endpoint returns proper status."""
        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/health")
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            assert "healthy" in data
            assert "enabled" in data
            assert "last_check" in data
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_integration_status_endpoint(
        self, client, mock_user, mock_ha_service
    ) -> None:
        """Test integration status endpoint."""
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
    async def test_health_check_failure(self, client, mock_user, mock_ha_service) -> None:
        """Test health check endpoint when service is unhealthy."""
        # Mock failure response
        mock_ha_service.get_user_integration_status.return_value = {
            "healthy": False,
            "enabled": True,
            "initialized": False,
            "rest_api_available": False,
            "websocket_connected": False,
            "last_check": "2024-06-19T13:20:05.111018",
            "error": "Connection refused",
        }

        self.setup_dependency_overrides(mock_user, mock_ha_service)

        try:
            response = await client.get("/api/v1/home-assistant/health")
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            assert data["healthy"] is False
            assert "error" in data
        finally:
            self.cleanup_dependency_overrides()

    @pytest.mark.asyncio
    async def test_unauthorized_health_access(self, client) -> None:
        """Test health endpoint requires authentication."""
        response = await client.get("/api/v1/home-assistant/health")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
