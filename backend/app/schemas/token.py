from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid


class Token(BaseModel):
    model_config = ConfigDict()

    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    model_config = ConfigDict()

    sub: Optional[uuid.UUID] = None
    # exp: Optional[int] = None # If you handle token expiration checks
