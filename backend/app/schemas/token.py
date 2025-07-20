import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    model_config = ConfigDict()

    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    model_config = ConfigDict()

    sub: uuid.UUID | None = None
    # exp: Optional[int] = None # If you handle token expiration checks
