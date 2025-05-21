from typing import Optional
from uuid import UUID
from pydantic import BaseModel

# Shared properties
class RackBase(BaseModel):
    name: str
    description: Optional[str] = None
    row_id: UUID # Foreign key to Row

# Properties to receive on item creation
class RackCreate(RackBase):
    pass

# Properties to receive on item update
class RackUpdate(RackBase):
    name: Optional[str] = None
    description: Optional[str] = None
    row_id: Optional[UUID] = None


# Properties shared by models stored in DB
class RackInDBBase(RackBase):
    id: UUID

    class Config:
        orm_mode = True # Pydantic V1
        # from_attributes = True # Pydantic V2

# Properties to return to client
class Rack(RackInDBBase):
    pass

# Properties stored in DB
class RackInDB(RackInDBBase):
    pass 