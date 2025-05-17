# backend/tests/test_main.py
from fastapi.testclient import TestClient
from backend.main import app
#from models import Item

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_get_supabase_items():
    response = client.get("/supabase-items")
    assert response.status_code == 200
    assert "data" in response.json()

#def test_create_item():
#    item_data = {
#        "name": "Test Item",
#        "description": "A simple test item",
#        "price": 10.0,
#        "tax": 1.0
#    }
#    response = client.post("/items/", json=item_data)
#    assert response.status_code == 200
#    assert response.json()["name"] == item_data["name"]