from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.sensor_device import SensorDeviceCreate, SensorDeviceUpdate

# Test data
VALID_SENSOR_ID = uuid4()
VALID_PARENT_ID = uuid4()


def test_sensor_device_create_valid():
    valid_data = {
        "name": "Temp Sensor A1",
        "model_number": "TS-A1-XYZ",
        "sensor_type": "temperature",
        "measurement_unit": "°C",
        "data_range_min": -10.0,
        "data_range_max": 50.0,
        "accuracy": "+/- 0.5°C",
        "parent_type": "shelf",
        "parent_id": VALID_PARENT_ID,
        "position_x": 0.5,
        "position_y": 0.2,
        "position_z": 0.1,
    }
    sensor = SensorDeviceCreate(**valid_data)
    assert sensor.name == valid_data["name"]
    assert sensor.parent_id == VALID_PARENT_ID
    assert sensor.sensor_type == "temperature"


def test_sensor_device_create_missing_required_fields():
    invalid_data = {
        # name is missing
        "sensor_type": "humidity",
        "parent_type": "rack",
        # parent_id is missing
    }
    with pytest.raises(ValidationError) as excinfo:
        SensorDeviceCreate(**invalid_data)
    assert "name" in str(excinfo.value)
    assert "parent_id" in str(excinfo.value)


def test_sensor_device_create_invalid_enum_value():
    invalid_data = {
        "name": "Test Sensor",
        "sensor_type": "invalid_sensor_type",  # Invalid enum
        "parent_type": "farm",
        "parent_id": VALID_PARENT_ID,
    }
    with pytest.raises(ValidationError):
        SensorDeviceCreate(**invalid_data)


def test_sensor_device_create_invalid_data_range():
    invalid_data = {
        "name": "Range Test Sensor",
        "sensor_type": "co2",
        "parent_type": "row",
        "parent_id": VALID_PARENT_ID,
        "data_range_min": 100.0,
        "data_range_max": 50.0,  # Max < Min
    }
    with pytest.raises(ValueError) as excinfo:  # model_validator raises ValueError
        SensorDeviceCreate(**invalid_data)
    assert "Max data range must be greater than or equal to min data range" in str(
        excinfo.value
    )


def test_sensor_device_update_valid_partial():
    update_data = {"name": "Updated Sensor Name", "accuracy": "+/- 1%"}
    sensor_update = SensorDeviceUpdate(**update_data)
    assert sensor_update.name == update_data["name"]
    assert sensor_update.accuracy == update_data["accuracy"]


def test_sensor_device_update_invalid_data_range():
    update_data = {
        "data_range_min": 200.0,
        "data_range_max": 150.0,  # Max < Min
    }
    with pytest.raises(ValueError) as excinfo:  # model_validator raises ValueError
        SensorDeviceUpdate(**update_data)
    assert "Max data range must be greater than or equal to min data range" in str(
        excinfo.value
    )


def test_sensor_device_create_data_range_only_min():
    # Should pass as per validation logic (only triggers if both are numbers)
    data = {
        "name": "MinOnly Sensor",
        "sensor_type": "ph",
        "parent_type": "farm",
        "parent_id": VALID_PARENT_ID,
        "data_range_min": 7.0,
    }
    sensor = SensorDeviceCreate(**data)
    assert sensor.data_range_min == 7.0
    assert sensor.data_range_max is None


def test_sensor_device_create_data_range_only_max():
    # Should pass
    data = {
        "name": "MaxOnly Sensor",
        "sensor_type": "ec",
        "parent_type": "rack",
        "parent_id": VALID_PARENT_ID,
        "data_range_max": 2.5,
    }
    sensor = SensorDeviceCreate(**data)
    assert sensor.data_range_max == 2.5
    assert sensor.data_range_min is None


def test_sensor_device_create_data_range_both_none():
    # Should pass
    data = {
        "name": "NoRange Sensor",
        "sensor_type": "water_level",
        "parent_type": "shelf",
        "parent_id": VALID_PARENT_ID,
    }
    sensor = SensorDeviceCreate(**data)
    assert sensor.data_range_min is None
    assert sensor.data_range_max is None
