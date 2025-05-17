"""Constants for the Vertical Farm Home Assistant integration."""

# Base component constants
NAME = "Vertical Farm"
DOMAIN = "vertical_farm"
VERSION = "0.0.7"
ISSUE_URL = "https://github.com/eddie-rowe/vertical-farm/issues"

# Configuration keys (for YAML/config schema)
CONF_FARMS = "farms"
CONF_ID = "id"
CONF_NAME = "name"
CONF_LOCATION = "location"
CONF_NOTES = "notes"
CONF_DEVICE_IDS = "device_ids"
CONF_POSITION = "position"
CONF_ROWS = "rows"
CONF_RACKS = "racks"
CONF_SHELVES = "shelves"
CONF_CAPACITY = "capacity"

# Entity attributes (for sensors/entities)
ATTR_LEVEL = "level"
ATTR_OBJECT_ID = "object_id"
ATTR_DEVICE_IDS = "device_ids"
ATTR_POSITION = "position"
ATTR_CAPACITY = "capacity"
ATTR_NOTES = "notes"
ATTR_PARENT_ID = "parent_id"
ATTR_PARENT_TYPE = "parent_type"

# Platforms
PLATFORM_SENSOR = "sensor"
PLATFORMS = [PLATFORM_SENSOR]

# Services (add more as needed for vertical farm actions)
SERVICE_MARK_HARVESTED = "mark_harvested"
SERVICE_ASSIGN_DEVICE = "assign_device"
SERVICE_UNASSIGN_DEVICE = "unassign_device"

# Events (add more as needed)
EVENT_SHELF_HARVESTED = "shelf_harvested"
EVENT_DEVICE_ASSIGNED = "device_assigned"
EVENT_DEVICE_UNASSIGNED = "device_unassigned"

# Misc
STARTUP_MESSAGE = f"""
-------------------------------------------------------------------
{NAME}
Version: {VERSION}
If you have any issues with this you need to open an issue here:
{ISSUE_URL}
-------------------------------------------------------------------
"""
