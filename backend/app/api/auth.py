from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserLogin
from app.schemas.token import Token, RefreshToken
from app.services import user_service
from app.core.security import create_access_token, create_refresh_token, get_current_user
import jwt
import logging
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """
    Register a new user and return an access token, refresh token, and user info.
    """
    try:
        user = await user_service.create_user(user_data)

        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        return {
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user.to_response()
        }
    except ValueError as e:
        # This is for known errors, like "email already registered"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # This is for unexpected errors
        logging.error(f"Unhandled exception during user registration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@router.post("/login", response_model=dict)
async def login_for_access_token(user_data: UserLogin):
    """
    Authenticate a user and return tokens and user info.
    """
    user = await user_service.authenticate_user(user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return {
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user.to_response()
    }

@router.post("/refresh", response_model=Token)
async def refresh_access_token(refresh_token_data: RefreshToken):
    """
    Refresh an access token using a valid refresh token.
    """
    try:
        payload = jwt.decode(
            refresh_token_data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        access_token = create_access_token(subject=user_id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_data.refresh_token, # Return the same refresh token
            "token_type": "bearer",
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

@router.get("/me", response_model=dict)
async def read_users_me(current_user_id: str = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    """
    user = await user_service.get_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"success": True, "user": user.to_response()}