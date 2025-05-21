from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any

from app.crud import crud_user
from app.schemas.token import Token
from app.core.security import create_access_token # This will need to be created
from app.db.supabase_client import get_async_supabase_client
from supabase import AsyncClient, create_async_client
from app.core.config import settings
from datetime import timedelta

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    db: AsyncClient = Depends(get_async_supabase_client),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await crud_user.authenticate_user(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"} 