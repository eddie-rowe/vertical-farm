# backend/tests/test_main.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

# from models import Item

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_read_main():
    """Test the main root endpoint"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "Welcome to" in response.json()["message"]

@pytest.mark.asyncio
async def test_cors_test_simple():
    """Test the simple CORS test endpoint"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/cors-test-simple")
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
