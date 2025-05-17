"""
Vertical Farm HACS Integration (helper-driven)

- Discovers Home Assistant helpers (input_boolean, input_button, etc.) matching the farm naming convention
- Sets up listeners for helper changes
- Optionally registers services for farm actions
"""
import logging
from homeassistant.core import HomeAssistant
from .const import DOMAIN
from .helpers import discover_helpers, parse_helper_name

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """
    Set up the Vertical Farm integration (helper-driven).
    Discovers helpers and logs their structure.
    """
    _LOGGER.info("Setting up Vertical Farm (helper-driven) integration")
    helpers = discover_helpers(hass)
    for entity_id, state in helpers.items():
        structure = parse_helper_name(entity_id)
        _LOGGER.info(f"Discovered helper: {entity_id} | Structure: {structure}")
    # Optionally: set up listeners, register services, etc.
    return True
