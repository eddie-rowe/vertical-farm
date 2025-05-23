from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any, Dict
from datetime import timedelta
import uuid

from app import crud
from app.schemas.token import Token
from app.core.security import create_access_token
from app.db.supabase_client import get_async_supabase_client
from supabase import AsyncClient
from app.core.config import settings

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    db_client: AsyncClient = Depends(get_async_supabase_client),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Authenticates against Supabase, then issues an app-specific JWT.
    """
    supabase_user_data = await crud.user.authenticate(
        supabase=db_client, email=form_data.username, password=form_data.password
    )

    if not supabase_user_data or not supabase_user_data.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = supabase_user_data.get("id")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found after authentication.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    app_access_token = create_access_token(
        data={"sub": user_id_str}, expires_delta=access_token_expires
    )
    return {"access_token": app_access_token, "token_type": "bearer"} 