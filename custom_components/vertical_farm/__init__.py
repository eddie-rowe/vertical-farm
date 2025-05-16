"""
Vertical Farm Home Assistant Integration
"""

import logging
from .const import DOMAIN, CONF_FARMS, DEVICE_REGISTRY
from .schema import CONFIG_SCHEMA
from .helpers import dict_to_farm
from .device_registry import DeviceRegistry
from typing import Any, Dict

_LOGGER = logging.getLogger(__name__)


def register_entities_for_farm(
    farm: Any, registry: DeviceRegistry, level: str = "farm"
) -> None:
    """Recursively register device_ids for all farm elements."""
    if hasattr(farm, "device_ids") and farm.device_ids:
        for entity_id in farm.device_ids:
            registry.assign_entity(entity_id, level, farm.id)
    if hasattr(farm, "rows"):
        for row in farm.rows:
            register_entities_for_farm(row, registry, level="row")
    if hasattr(farm, "racks"):
        for rack in farm.racks:
            register_entities_for_farm(rack, registry, level="rack")
    if hasattr(farm, "shelves"):
        for shelf in farm.shelves:
            register_entities_for_farm(shelf, registry, level="shelf")


async def async_setup(hass, config: Dict[str, Any]) -> bool:
    """Set up the Vertical Farm integration from configuration.yaml."""
    _LOGGER.info("Setting up Vertical Farm integration")
    user_config = config.get(DOMAIN)
    if user_config is not None:
        try:
            validated = CONFIG_SCHEMA(user_config)
            # Support multiple farms
            farms = [
                dict_to_farm(farm_dict) for farm_dict in validated[CONF_FARMS]
            ]
            hass.data[DOMAIN] = farms
            # Register entity assignments for all farms
            registry = DeviceRegistry()
            for farm in farms:
                register_entities_for_farm(farm, registry)
            hass.data[DEVICE_REGISTRY] = registry
            _LOGGER.debug(f"Loaded farm models: {farms}")
            _LOGGER.debug(f"Device assignments: {registry.all_assignments()}")
        except Exception as e:
            _LOGGER.error(f"Config validation error: {e}")
            return False
    return True
