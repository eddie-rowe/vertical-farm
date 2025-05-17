"""
Platform setup for vertical farm switches.
Creates a VerticalFarmSwitch entity for each switch device_id (e.g., lights, water, fans) assigned to any farm, row, rack, or shelf.
"""

import logging
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from .const import DOMAIN
from .entity import VerticalFarmSwitch
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
    Set up vertical farm switches from YAML config.
    """
    farms = hass.data[DOMAIN]["farms"]
    entities: List[VerticalFarmSwitch] = []

    def add_switches_for_object(obj, level, parent_id=None, parent_type=None):
        # Create switches for device_ids that are Home Assistant switches/lights/fans/water
        for device_id in getattr(obj, "device_ids", []):
            if (
                device_id.startswith("switch.")
                or device_id.startswith("light.")
                or device_id.startswith("fan.")
                or device_id.startswith("water_")
            ):
                entities.append(
                    VerticalFarmSwitch(
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
                add_switches_for_object(row, "row", obj.id, level)
        if hasattr(obj, "racks"):
            for rack in obj.racks:
                add_switches_for_object(rack, "rack", obj.id, level)
        if hasattr(obj, "shelves"):
            for shelf in obj.shelves:
                add_switches_for_object(shelf, "shelf", obj.id, level)

    for farm in farms:
        add_switches_for_object(farm, "farm")

    if entities:
        async_add_entities(entities)
        _LOGGER.info(f"Added {len(entities)} vertical farm switches.")
    else:
        _LOGGER.warning("No vertical farm switches found to add.")
