from typing import Optional
from uuid import UUID
from pydantic import BaseModel

# Shared properties
class RowBase(BaseModel):
    name: str
    description: Optional[str] = None
    farm_id: UUID

# Properties to receive on item creation
class RowCreate(RowBase):
    pass

# Properties to receive on item update
class RowUpdate(RowBase): # Or make all fields optional: class RowUpdate(BaseModel): name: Optional[str] = None ...
    name: Optional[str] = None
    description: Optional[str] = None
    farm_id: Optional[UUID] = None


# Properties shared by models stored in DB
class RowInDBBase(RowBase):
    id: UUID

    class Config:
        orm_mode = True # Pydantic V1
        # from_attributes = True # Pydantic V2

# Properties to return to client
class Row(RowInDBBase):
    pass

# Properties stored in DB
class RowInDB(RowInDBBase):
    pass 