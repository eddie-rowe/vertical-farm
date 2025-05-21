from pydantic import BaseModel
from typing import Optional
import uuid

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[uuid.UUID] = None
    # exp: Optional[int] = None # If you handle token expiration checks 