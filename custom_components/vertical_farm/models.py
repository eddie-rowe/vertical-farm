from dataclasses import dataclass, field, asdict
from typing import List, Optional, Type, TypeVar, Dict, Any
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

T = TypeVar("T", bound="BaseModel")


class BaseModel:
    def __post_init__(self):
        if not getattr(self, "id", None):
            raise ValueError(
                f"{self.__class__.__name__} requires a non-empty id"
            )
        if not getattr(self, "name", None):
            raise ValueError(
                f"{self.__class__.__name__} requires a non-empty name"
            )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        return cls(**data)


@dataclass
class Shelf(BaseModel):
    """Represents a shelf in the vertical farm.
    Fields: id, name, capacity, notes, device_ids, position
    """

    id: str
    name: str
    capacity: Optional[int] = None
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None


@dataclass
class Rack(BaseModel):
    """Represents a rack containing shelves.
    Fields: id, name, shelves, notes, device_ids, position
    """

    id: str
    name: str
    shelves: List[Shelf] = field(default_factory=list)
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None


@dataclass
class Row(BaseModel):
    """Represents a row containing racks.
    Fields: id, name, racks, notes, device_ids, position
    """

    id: str
    name: str
    racks: List[Rack] = field(default_factory=list)
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None


@dataclass
class Farm(BaseModel):
    """Represents a farm containing rows.
    Fields: id, name, rows, location, notes, device_ids, position
    """

    id: str
    name: str
    rows: List[Row] = field(default_factory=list)
    location: Optional[str] = None
    notes: Optional[str] = None
    device_ids: List[str] = field(default_factory=list)
    position: Optional[int] = None
