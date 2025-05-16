from .models import Farm, Row, Rack, Shelf
from typing import Dict, Any


def dict_to_shelf(data: Dict[str, Any]) -> Shelf:
    return Shelf(
        id=data["id"],
        name=data["name"],
        capacity=data.get("capacity"),
        notes=data.get("notes"),
    )


def dict_to_rack(data: Dict[str, Any]) -> Rack:
    shelves = [dict_to_shelf(s) for s in data.get("shelves", [])]
    return Rack(
        id=data["id"],
        name=data["name"],
        shelves=shelves,
        notes=data.get("notes"),
    )


def dict_to_row(data: Dict[str, Any]) -> Row:
    racks = [dict_to_rack(r) for r in data.get("racks", [])]
    return Row(
        id=data["id"],
        name=data["name"],
        racks=racks,
        notes=data.get("notes"),
    )


def dict_to_farm(data: Dict[str, Any]) -> Farm:
    rows = [dict_to_row(r) for r in data.get("rows", [])]
    return Farm(
        id=data["id"],
        name=data["name"],
        rows=rows,
        location=data.get("location"),
        notes=data.get("notes"),
    )
