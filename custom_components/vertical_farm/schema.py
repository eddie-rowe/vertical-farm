import voluptuous as vol
import homeassistant.helpers.config_validation as cv
from .const import (
    CONF_FARMS,
    CONF_ID,
    CONF_NAME,
    CONF_LOCATION,
    CONF_NOTES,
    CONF_DEVICE_IDS,
    CONF_POSITION,
    CONF_ROWS,
    CONF_RACKS,
    CONF_SHELVES,
    CONF_CAPACITY,
)

"""Schema for the Vertical Farm integration."""

SHELF_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ID): cv.string,
        vol.Required(CONF_NAME): cv.string,
        vol.Optional(CONF_CAPACITY): vol.All(int, vol.Range(min=1)),
        vol.Optional(CONF_NOTES): cv.string,
        vol.Optional(CONF_DEVICE_IDS, default=[]): [cv.entity_id],
        vol.Optional(CONF_POSITION): vol.All(int, vol.Range(min=0)),
    }
)

RACK_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ID): cv.string,
        vol.Required(CONF_NAME): cv.string,
        vol.Optional(CONF_NOTES): cv.string,
        vol.Optional(CONF_DEVICE_IDS, default=[]): [cv.entity_id],
        vol.Optional(CONF_POSITION): vol.All(int, vol.Range(min=0)),
        vol.Required(CONF_SHELVES, default=[]): [SHELF_SCHEMA],
    }
)

ROW_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ID): cv.string,
        vol.Required(CONF_NAME): cv.string,
        vol.Optional(CONF_NOTES): cv.string,
        vol.Optional(CONF_DEVICE_IDS, default=[]): [cv.entity_id],
        vol.Optional(CONF_POSITION): vol.All(int, vol.Range(min=0)),
        vol.Required(CONF_RACKS, default=[]): [RACK_SCHEMA],
    }
)

FARM_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ID): cv.string,
        vol.Required(CONF_NAME): cv.string,
        vol.Optional(CONF_LOCATION): cv.string,
        vol.Optional(CONF_NOTES): cv.string,
        vol.Optional(CONF_DEVICE_IDS, default=[]): [cv.entity_id],
        vol.Optional(CONF_POSITION): vol.All(int, vol.Range(min=0)),
        vol.Required(CONF_ROWS, default=[]): [ROW_SCHEMA],
    }
)

CONFIG_SCHEMA = vol.Schema(
    {CONF_FARMS: vol.All(cv.ensure_list, [FARM_SCHEMA])}, extra=vol.ALLOW_EXTRA
)
