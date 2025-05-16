"""
Vertical Farm Home Assistant Integration
"""

import logging
from .const import DOMAIN
from .config_schema import CONFIG_SCHEMA
from .helpers import dict_to_farm

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass, config):
    """Set up the Vertical Farm integration from configuration.yaml."""
    _LOGGER.info("Setting up Vertical Farm integration")
    user_config = config.get(DOMAIN)
    if user_config is not None:
        try:
            validated = CONFIG_SCHEMA(user_config)
            farm = dict_to_farm(validated['farm'])
            hass.data[DOMAIN] = farm
            _LOGGER.debug(f"Loaded farm model: {farm}")
        except Exception as e:
            _LOGGER.error(f"Config validation error: {e}")
            return False
    return True
