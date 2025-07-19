import pytest
from uuid import uuid4
from pydantic import ValidationError

from app.schemas.fan import FanCreate, FanUpdate

# Test data
VALID_FAN_ID = uuid4()
VALID_PARENT_ID = uuid4()


def test_fan_create_valid():
    valid_data = {
        "name": "Circulation Fan FX-100",
        "model_number": "FX-100-C",
        "type": "circulation",
        "size_cm": 30.5,
        "airflow_cfm": 1200.0,
        "power_watts": 75.0,
        "parent_type": "rack",
        "parent_id": VALID_PARENT_ID,
        "position_x": 10.0,
        "position_y": 5.0,
        "position_z": 2.0,
        "orientation": "front",
    }
    fan = FanCreate(**valid_data)
    assert fan.name == valid_data["name"]
    assert fan.parent_id == VALID_PARENT_ID
    assert fan.type == "circulation"


def test_fan_create_missing_required_fields():
    invalid_data = {
        # name is missing
        "parent_type": "row",
        "parent_id": VALID_PARENT_ID,
    }
    with pytest.raises(ValidationError) as excinfo:
        FanCreate(**invalid_data)
    assert "name" in str(excinfo.value)


def test_fan_create_invalid_type():
    invalid_data = {
        "name": "Test Fan",
        "type": "invalid_fan_type",  # Invalid enum value
        "parent_type": "rack",
        "parent_id": VALID_PARENT_ID,
    }
    with pytest.raises(ValidationError):
        FanCreate(**invalid_data)


def test_fan_create_invalid_value_constraint():
    invalid_data = {
        "name": "F",  # Too short
        "parent_type": "rack",
        "parent_id": VALID_PARENT_ID,
        "size_cm": -10,  # Not positive
    }
    with pytest.raises(ValidationError) as excinfo:
        FanCreate(**invalid_data)
    assert "name" in str(excinfo.value)
    assert "size_cm" in str(excinfo.value)


def test_fan_update_valid_partial():
    update_data = {"name": "Updated Fan Name", "power_watts": 80.0}
    fan_update = FanUpdate(**update_data)
    assert fan_update.name == update_data["name"]
    assert fan_update.power_watts == update_data["power_watts"]


def test_fan_update_invalid_value_constraint():
    update_data = {"airflow_cfm": -500}  # Not positive
    with pytest.raises(ValidationError) as excinfo:
        FanUpdate(**update_data)
    assert "airflow_cfm" in str(excinfo.value)


def test_fan_create_optional_fields_not_provided():
    # Only required fields for FanCreate
    required_data = {
        "name": "Minimal Fan",
        "parent_type": "row",
        "parent_id": VALID_PARENT_ID,
    }
    fan = FanCreate(**required_data)
    assert fan.name == required_data["name"]
    assert fan.parent_id == required_data["parent_id"]
    assert fan.model_number is None  # Check optional fields are None by default
    assert fan.size_cm is None


# Example for testing FanUpdate with all fields (can be extensive)
# def test_fan_update_all_fields():
#     full_update_data = {
# "name": "Super Fan Max",
# "model_number": "SF-MAX-9000",
# "type": "exhaust",
# "size_cm": 50.0,
# "airflow_cfm": 3000.0,
# "power_watts": 150.0,
#         # parent_type and parent_id are not in FanUpdate typically
# "position_x": 1.0,
# "position_y": 2.0,
# "position_z": 3.0,
# "orientation": "up"
#     }
#     fan_update = FanUpdate(**full_update_data)
# for key, value in full_update_data.items():
# assert getattr(fan_update, key) == value
