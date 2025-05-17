"""
Vertical Farm Home Assistant Integration

Initializes the integration, loads YAML config, and builds farm models.
"""

import logging
from .const import DOMAIN, CONF_FARMS
from .schema import CONFIG_SCHEMA
from .helpers import dict_to_farm
from typing import Any, Dict

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass, config: Dict[str, Any]) -> bool:
    """
    Set up the Vertical Farm integration from configuration.yaml.
    Loads and validates config, builds farm models, and stores them in hass.data.
    """
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
            _LOGGER.debug(f"Loaded farm models: {farms}")
        except Exception as e:
            _LOGGER.error(f"Config validation error: {e}")
            return False
    return True
