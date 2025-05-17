from .models import Farm, Row, Rack, Shelf
from .const import (
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
from typing import Dict, Any, List, Optional


def dict_to_shelf(data: Dict[str, Any]) -> Shelf:
    """Convert a dict to a Shelf dataclass."""
    return Shelf(
        id=data[CONF_ID],
        name=data[CONF_NAME],
        capacity=data.get(CONF_CAPACITY),
        notes=data.get(CONF_NOTES),
        device_ids=data.get(CONF_DEVICE_IDS, []),
        position=data.get(CONF_POSITION),
    )


def dict_to_rack(data: Dict[str, Any]) -> Rack:
    """Convert a dict to a Rack dataclass."""
    shelves = [dict_to_shelf(s) for s in data.get(CONF_SHELVES, [])]
    return Rack(
        id=data[CONF_ID],
        name=data[CONF_NAME],
        shelves=shelves,
        notes=data.get(CONF_NOTES),
        device_ids=data.get(CONF_DEVICE_IDS, []),
        position=data.get(CONF_POSITION),
    )


def dict_to_row(data: Dict[str, Any]) -> Row:
    """Convert a dict to a Row dataclass."""
    racks = [dict_to_rack(r) for r in data.get(CONF_RACKS, [])]
    return Row(
        id=data[CONF_ID],
        name=data[CONF_NAME],
        racks=racks,
        notes=data.get(CONF_NOTES),
        device_ids=data.get(CONF_DEVICE_IDS, []),
        position=data.get(CONF_POSITION),
    )


def dict_to_farm(data: Dict[str, Any]) -> Farm:
    """Convert a dict to a Farm dataclass."""
    rows = [dict_to_row(r) for r in data.get(CONF_ROWS, [])]
    return Farm(
        id=data[CONF_ID],
        name=data[CONF_NAME],
        rows=rows,
        location=data.get(CONF_LOCATION),
        notes=data.get(CONF_NOTES),
        device_ids=data.get(CONF_DEVICE_IDS, []),
        position=data.get(CONF_POSITION),
    )
