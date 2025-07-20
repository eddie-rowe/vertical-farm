import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import PermissionLevel

# from typing import Optional  # Removed unused import



# from sqlalchemy import Column, ForeignKey, Enum as SQLAlchemyEnum, DateTime
# from sqlalchemy.dialects.postgresql import UUID
# from sqlalchemy.sql import func

# from app.db.base_class import Base # Ensure Base is imported


# This model represents the structure of the 'user_permissions' table in the database.
class UserPermissionInDB(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    farm_id: uuid.UUID
    permission: PermissionLevel  # Stored as string/enum value in DB, Pydantic handles conversion
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


# class UserPermission(Base):
#     __tablename__ = "user_permissions"
#
#     # model_config = ConfigDict(from_attributes=True) # This was incorrect for SQLAlchemy
#
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
#     farm_id = Column(UUID(as_uuid=True), nullable=False)
#     permission = Column(SQLAlchemyEnum(PermissionLevel), nullable=False)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())
