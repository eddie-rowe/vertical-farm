"""
Helper discovery and utility functions for the Vertical Farm integration.
"""
from homeassistant.core import HomeAssistant
from .const import HELPER_DOMAINS, HELPER_PREFIX


def discover_helpers(hass: HomeAssistant):
    """
    Discover all helpers (input_boolean, input_button, etc.) matching the farm naming convention.
    Returns a dict of {entity_id: state_obj} for all matching helpers.
    """
    helpers = {}
    for domain in HELPER_DOMAINS:
        for entity_id in hass.states.async_entity_ids(domain):
            if entity_id.split(".", 1)[-1].startswith(HELPER_PREFIX):
                helpers[entity_id] = hass.states.get(entity_id)
    return helpers


def parse_helper_name(entity_id: str):
    """
    Parse a helper entity_id into its farm structure components.
    Example: input_number.farm1_row2_rack3_shelf4_moisture_setpoint
    Returns a dict: {farm: ..., row: ..., rack: ..., shelf: ..., attribute: ...}
    """
    name = entity_id.split(".", 1)[-1]
    parts = name.split("_")
    # Simple parser: expects farm_row_rack_shelf_attribute
    # You can make this more robust as needed
    keys = ["farm", "row", "rack", "shelf"]
    result = {}
    for i, key in enumerate(keys):
        if i < len(parts):
            result[key] = parts[i]
    # The rest is the attribute
    if len(parts) > len(keys):
        result["attribute"] = "_".join(parts[len(keys):])
    return result
