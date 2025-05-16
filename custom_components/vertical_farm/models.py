from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class Shelf:
    id: str
    name: str
    capacity: Optional[int] = None
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None

@dataclass
class Rack:
    id: str
    name: str
    shelves: List[Shelf] = field(default_factory=list)
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None

@dataclass
class Row:
    id: str
    name: str
    racks: List[Rack] = field(default_factory=list)
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None

@dataclass
class Farm:
    id: str
    name: str
    rows: List[Row] = field(default_factory=list)
    location: Optional[str] = None
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None
