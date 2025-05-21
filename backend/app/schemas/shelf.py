from typing import Optional
from uuid import UUID
from pydantic import BaseModel

# Shared properties
class ShelfBase(BaseModel):
    name: str
    description: Optional[str] = None
    rack_id: UUID # Foreign key to Rack
    # Example: Add position or capacity if relevant
    # position_in_rack: Optional[int] = None
    # max_trays: Optional[int] = None

# Properties to receive on item creation
class ShelfCreate(ShelfBase):
    pass

# Properties to receive on item update
class ShelfUpdate(ShelfBase):
    name: Optional[str] = None
    description: Optional[str] = None
    rack_id: Optional[UUID] = None
    # position_in_rack: Optional[int] = None
    # max_trays: Optional[int] = None

# Properties shared by models stored in DB
class ShelfInDBBase(ShelfBase):
    id: UUID

    class Config:
        orm_mode = True # Pydantic V1
        # from_attributes = True # Pydantic V2

# Properties to return to client
class Shelf(ShelfInDBBase):
    pass

# Properties stored in DB
class ShelfInDB(ShelfInDBBase):
    pass 