"""
Vertical Farm Home Assistant Integration
"""

import logging
from .const import DOMAIN
from .config_schema import CONFIG_SCHEMA
from .helpers import dict_to_farm
from .device_registry import DeviceRegistry

_LOGGER = logging.getLogger(__name__)


def register_entities_for_farm(farm, registry, level="farm"):
    # Register device_ids for the current object
    if hasattr(farm, "device_ids") and farm.device_ids:
        for entity_id in farm.device_ids:
            registry.assign_entity(entity_id, level, farm.id)
    # Recursively register for children
    if hasattr(farm, "rows"):
        for row in farm.rows:
            register_entities_for_farm(row, registry, level="row")
    if hasattr(farm, "racks"):
        for rack in farm.racks:
            register_entities_for_farm(rack, registry, level="rack")
    if hasattr(farm, "shelves"):
        for shelf in farm.shelves:
            register_entities_for_farm(shelf, registry, level="shelf")


async def async_setup(hass, config):
    """Set up the Vertical Farm integration from configuration.yaml."""
    _LOGGER.info("Setting up Vertical Farm integration")
    user_config = config.get(DOMAIN)
    if user_config is not None:
        try:
            validated = CONFIG_SCHEMA(user_config)
            farm = dict_to_farm(validated["farm"])
            hass.data[DOMAIN] = farm
            # Register entity assignments
            registry = DeviceRegistry()
            register_entities_for_farm(farm, registry)
            hass.data[f"{DOMAIN}_device_registry"] = registry
            _LOGGER.debug(f"Loaded farm model: {farm}")
            _LOGGER.debug(f"Device assignments: {registry.all_assignments()}")
        except Exception as e:
            _LOGGER.error(f"Config validation error: {e}")
            return False
    return True
