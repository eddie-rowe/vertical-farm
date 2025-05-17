"""
Platform setup for vertical farm binary sensors.
Creates a VerticalFarmBinarySensor entity for each binary_sensor device_id (e.g., door, shelf, etc.) assigned to any farm, row, rack, or shelf.
"""

import logging
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from .const import DOMAIN
from .entity import VerticalFarmBinarySensor
from typing import Any, List

_LOGGER = logging.getLogger(__name__)


async def async_setup_platform(
    hass, config, async_add_entities, discovery_info=None
):
    """Legacy platform setup (not used)."""
    return


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
):
    """Config entry setup (not used for YAML config)."""
    return


async def async_setup(
    hass: HomeAssistant,
    config: dict,
    async_add_entities: AddEntitiesCallback,
    discovery_info=None,
):
    """
    Set up vertical farm binary sensors from YAML config.
    """
    farms = hass.data[DOMAIN]
    entities: List[VerticalFarmBinarySensor] = []

    def add_binary_sensors_for_object(
        obj, level, parent_id=None, parent_type=None
    ):
        # Create binary sensors for device_ids that are Home Assistant binary_sensors or custom patterns
        for device_id in getattr(obj, "device_ids", []):
            if (
                device_id.startswith("binary_sensor.")
                or device_id.startswith("door_")
                or device_id.startswith("shelf_")
            ):
                entities.append(
                    VerticalFarmBinarySensor(
                        level=level,
                        object_id=obj.id,
                        name=obj.name,
                        device_ids=obj.device_ids,
                        position=getattr(obj, "position", None),
                        capacity=getattr(obj, "capacity", None),
                        notes=getattr(obj, "notes", None),
                        parent_id=parent_id,
                        parent_type=parent_type,
                        entity_id=device_id,
                    )
                )
        # Recurse into children
        if hasattr(obj, "rows"):
            for row in obj.rows:
                add_binary_sensors_for_object(row, "row", obj.id, level)
        if hasattr(obj, "racks"):
            for rack in obj.racks:
                add_binary_sensors_for_object(rack, "rack", obj.id, level)
        if hasattr(obj, "shelves"):
            for shelf in obj.shelves:
                add_binary_sensors_for_object(shelf, "shelf", obj.id, level)

    for farm in farms:
        add_binary_sensors_for_object(farm, "farm")

    if entities:
        async_add_entities(entities)
        _LOGGER.info(f"Added {len(entities)} vertical farm binary sensors.")
    else:
        _LOGGER.warning("No vertical farm binary sensors found to add.")
