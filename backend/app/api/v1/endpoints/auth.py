from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import Dict, Any, Tuple
from app.core.security import (
    get_current_active_user,
    get_current_active_user_with_session_health, 
    get_session_health,
    validate_session_health,
    get_validated_supabase_token_payload
)
from app.schemas.user import User

router = APIRouter()

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user information.
    """
    return current_user

@router.get("/session-health")
async def get_session_health_status(
    request: Request,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get detailed session health information.
    
    Returns session status, token information, and recommendations.
    """
    try:
        session_health = await get_session_health(request)
        return session_health
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session health: {str(e)}"
        )

@router.get("/validate-session")
async def validate_session(
    user_data: Tuple[User, Dict[str, Any]] = Depends(get_current_active_user_with_session_health)
) -> Dict[str, Any]:
    """
    Validate current session and return health information.
    
    Returns user info and session health status.
    """
    user, session_health = user_data
    
    return {
        "user": user.dict(),
        "session_health": session_health,
        "valid": True
    }

@router.post("/refresh-token-check")
async def check_token_refresh_needed(
    request: Request,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Check if token refresh is recommended or required.
    
    Returns recommendations for token refresh.
    """
    try:
        payload, token = await get_validated_supabase_token_payload(request)
        session_health = validate_session_health(payload)
        
        return {
            "user_id": current_user.id,
            "session_health": session_health,
            "token_valid": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token validation failed: {str(e)}"
        ) 