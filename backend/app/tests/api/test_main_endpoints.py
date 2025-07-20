# backend/app/tests/api/test_main_endpoints.py
import pytest


@pytest.mark.asyncio
async def test_health_check_endpoint(setup_test_environment, client) -> None:
    """Test the health check endpoint returns proper status and structure"""
    response = await client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert "services" in data
    # The status can be "healthy" or "degraded" depending on background services
    assert data["status"] in ["healthy", "degraded"]


@pytest.mark.asyncio
async def test_root_endpoint(setup_test_environment, client) -> None:
    """Test the main root endpoint returns welcome message"""
    response = await client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert "message" in data
    assert "Welcome to" in data["message"]


@pytest.mark.asyncio
async def test_cors_endpoint(setup_test_environment, client) -> None:
    """Test the CORS test endpoint"""
    response = await client.get("/cors-test-simple")
    assert response.status_code == 200

    data = response.json()
    assert data["message"] == "CORS is working!"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_endpoint_response_headers(setup_test_environment, client) -> None:
    """Test that API endpoints return proper headers"""
    response = await client.get("/health")
    assert response.status_code == 200
    assert "content-type" in response.headers
    assert "application/json" in response.headers["content-type"]


@pytest.mark.asyncio
async def test_api_error_handling(setup_test_environment, client) -> None:
    """Test API error handling for non-existent endpoints"""
    response = await client.get("/nonexistent-endpoint")
    assert response.status_code == 404
