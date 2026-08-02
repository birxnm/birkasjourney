"""
auth_router.py — Registration, login, current user, and Telegram link codes.

Parses/validates HTTP input, delegates rules to services.py.
No SQL lives here.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

import database as db
import services
from auth import (
    create_access_token,
    generate_link_code,
    get_current_user_id,
    hash_password,
    verify_password,
)
from models import (
    AuthResponse,
    GenerateLinkResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest) -> AuthResponse:
    """Create a web account and return a JWT."""
    try:
        user = await services.register_web_user(
            email=payload.email,
            password_hash=hash_password(payload.password),
            username=payload.username,
        )
    except ValueError as e:
        # User error: email already taken
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error("Registration failed for %s: %s", payload.email, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the account right now. Please try again.",
        )

    return AuthResponse(
        access_token=create_access_token(user["id"], user["email"]),
        user_id=user["id"],
        username=user.get("username"),
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> AuthResponse:
    """Verify credentials and return a JWT."""
    user = await db.get_user_by_email(payload.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return AuthResponse(
        access_token=create_access_token(user["id"], user["email"]),
        user_id=user["id"],
        username=user.get("username"),
    )


@router.get("/me", response_model=UserResponse)
async def me(user_id: int = Depends(get_current_user_id)) -> UserResponse:
    """Return the profile of the authenticated user."""
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
        )
    return UserResponse(
        id=user["id"],
        username=user.get("username"),
        email=user.get("email"),
        telegram_id=user.get("telegram_id"),
        created_at=str(user.get("created_at")) if user.get("created_at") else None,
    )


@router.post("/link-code", response_model=GenerateLinkResponse)
async def link_code(user_id: int = Depends(get_current_user_id)) -> GenerateLinkResponse:
    """Issue a one-time code the user sends to the bot as /link <code>."""
    return GenerateLinkResponse(link_code=generate_link_code(user_id))
