# backend/tests/test_main.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(setup_test_environment, client):
    """Test the health check endpoint"""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data
    # The status can be "healthy" or "degraded" depending on background services
    assert data["status"] in ["healthy", "degraded"]

@pytest.mark.asyncio
async def test_read_main(setup_test_environment, client):
    """Test the main root endpoint"""
    response = await client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "Welcome to" in response.json()["message"]

@pytest.mark.asyncio
async def test_cors_test_simple(setup_test_environment, client):
    """Test the simple CORS test endpoint"""
    response = await client.get("/cors-test-simple")
    assert response.status_code == 200
    assert response.json()["message"] == "CORS is working!"
    assert "timestamp" in response.json()

# def test_create_item():
#    item_data = {
#        "name": "Test Item",
#        "description": "A simple test item",
#        "price": 10.0,
#        "tax": 1.0
#    }
#    response = client.post("/items/", json=item_data)
#    assert response.status_code == 200
#    assert response.json()["name"] == item_data["name"]
