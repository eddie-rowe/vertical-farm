"""
Vertical Farm entity base classes for Home Assistant.
Provides a clean, extensible foundation for all farm-related entities (sensors, switches, binary sensors, etc.).
"""

from homeassistant.helpers.entity import Entity
from homeassistant.components.sensor import SensorEntity
from homeassistant.components.switch import SwitchEntity
from homeassistant.components.binary_sensor import BinarySensorEntity
from .const import (
    DOMAIN,
    ATTR_LEVEL,
    ATTR_OBJECT_ID,
    ATTR_DEVICE_IDS,
    ATTR_POSITION,
    ATTR_CAPACITY,
    ATTR_NOTES,
    ATTR_PARENT_ID,
    ATTR_PARENT_TYPE,
)
from typing import List, Optional, Any


class VerticalFarmEntity(Entity):
    """
    Base class for all vertical farm entities (sensor, switch, binary sensor, etc.).
    Provides context, device_info, unique_id, and common attributes.
    """

    def __init__(
        self,
        level: str,
        object_id: str,
        name: Optional[str],
        device_ids: Optional[List[str]] = None,
        position: Optional[int] = None,
        capacity: Optional[int] = None,
        notes: Optional[str] = None,
        parent_id: Optional[str] = None,
        parent_type: Optional[str] = None,
    ):
        self._level = level
        self._object_id = object_id
        self._name = name or f"{level.capitalize()} {object_id}"
        self._device_ids = device_ids or []
        self._position = position
        self._capacity = capacity
        self._notes = notes
        self._parent_id = parent_id
        self._parent_type = parent_type

    @property
    def name(self) -> str:
        return self._name

    @property
    def unique_id(self) -> str:
        return f"vertical_farm_{self._level}_{self._object_id}_{self.entity_type()}"

    @property
    def extra_state_attributes(self) -> dict:
        attrs = {
            ATTR_LEVEL: self._level,
            ATTR_OBJECT_ID: self._object_id,
            ATTR_DEVICE_IDS: self._device_ids,
            ATTR_POSITION: self._position,
            ATTR_CAPACITY: self._capacity,
            ATTR_NOTES: self._notes,
        }
        if self._parent_id:
            attrs[ATTR_PARENT_ID] = self._parent_id
        if self._parent_type:
            attrs[ATTR_PARENT_TYPE] = self._parent_type
        return attrs

    @property
    def device_info(self) -> dict:
        parent = self._parent_id or self._object_id
        parent_type = self._parent_type or self._level
        return {
            "identifiers": {(DOMAIN, f"{parent_type}_{parent}")},
            "name": f"{parent_type.capitalize()} {parent}",
            "manufacturer": "Vertical Farm",
            "model": parent_type.capitalize(),
        }

    def entity_type(self) -> str:
        """Return the type of entity (sensor, switch, binary_sensor, etc.)."""
        return "entity"


class VerticalFarmSensor(VerticalFarmEntity, SensorEntity):
    """
    Sensor entity for vertical farm (e.g., humidity, temperature, energy, etc.).
    """

    def __init__(self, *args, entity_id: str, **kwargs):
        super().__init__(*args, **kwargs)
        self._entity_id = entity_id
        self._state = None

    def unique_id(self) -> str:
        return f"vertical_farm_{self._level}_{self._object_id}_{self._entity_id}"

    @property
    def name(self) -> str:
        return f"{self._name} ({self._entity_id})"

    def entity_type(self) -> str:
        return "sensor"

    @property
    def state(self) -> Any:
        return self._state

    async def async_update(self) -> None:
        hass = self.hass
        if hass is None:
            return
        state_obj = hass.states.get(self._entity_id)
        self._state = state_obj.state if state_obj else None


class VerticalFarmSwitch(VerticalFarmEntity, SwitchEntity):
    """
    Switch entity for vertical farm (e.g., lights, water, fans, etc.).
    """

    def __init__(self, *args, entity_id: str, **kwargs):
        super().__init__(*args, **kwargs)
        self._entity_id = entity_id
        self._is_on = False

    def unique_id(self) -> str:
        return f"vertical_farm_{self._level}_{self._object_id}_{self._entity_id}"

    @property
    def name(self) -> str:
        return f"{self._name} ({self._entity_id})"

    def entity_type(self) -> str:
        return "switch"

    @property
    def is_on(self) -> bool:
        return self._is_on

    async def async_turn_on(self, **kwargs):
        hass = self.hass
        if hass:
            await hass.services.async_call(
                "homeassistant",
                "turn_on",
                {"entity_id": self._entity_id},
                blocking=True,
            )
        self._is_on = True

    async def async_turn_off(self, **kwargs):
        hass = self.hass
        if hass:
            await hass.services.async_call(
                "homeassistant",
                "turn_off",
                {"entity_id": self._entity_id},
                blocking=True,
            )
        self._is_on = False

    async def async_update(self) -> None:
        hass = self.hass
        if hass is None:
            return
        state_obj = hass.states.get(self._entity_id)
        self._is_on = state_obj.state == "on" if state_obj else False


class VerticalFarmBinarySensor(VerticalFarmEntity, BinarySensorEntity):
    """
    Binary sensor entity for vertical farm (e.g., door open/closed, shelf full/empty, etc.).
    """

    def __init__(self, *args, entity_id: str, **kwargs):
        super().__init__(*args, **kwargs)
        self._entity_id = entity_id
        self._is_on = False

    def unique_id(self) -> str:
        return f"vertical_farm_{self._level}_{self._object_id}_{self._entity_id}"

    @property
    def name(self) -> str:
        return f"{self._name} ({self._entity_id})"

    def entity_type(self) -> str:
        return "binary_sensor"

    @property
    def is_on(self) -> bool:
        return self._is_on

    async def async_update(self) -> None:
        hass = self.hass
        if hass is None:
            return
        state_obj = hass.states.get(self._entity_id)
        self._is_on = state_obj.state == "on" if state_obj else False
