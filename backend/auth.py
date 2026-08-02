"""
auth.py — JWT authentication for the web application.

Handles registration, login, token creation, and token verification.
Passwords are hashed with bcrypt. Tokens use HS256 JWT.
"""

import hashlib
import hmac
import os
import time
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using SHA-256 with salt (lightweight, no bcrypt dependency)."""
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return salt.hex() + ":" + key.hex()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    try:
        salt_hex, key_hex = password_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        stored_key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
        return hmac.compare_digest(stored_key, new_key)
    except (ValueError, AttributeError):
        return False


def create_access_token(user_id: int, email: Optional[str] = None) -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token. Please log in again.",
        )


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> int:
    """Extract and validate the current user ID from the JWT token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )
    return user_id


# ─── Link Code Store (in-memory, simple for MVP) ────────────────────────────

_link_codes: dict[str, dict] = {}  # code -> {"user_id": int, "expires": float}


def generate_link_code(user_id: int) -> str:
    """Generate a 6-character link code for Telegram account linking."""
    code = os.urandom(3).hex().upper()  # 6 char hex code
    _link_codes[code] = {
        "user_id": user_id,
        "expires": time.time() + 300,  # 5 minutes
    }
    return code


def validate_link_code(code: str) -> Optional[int]:
    """Validate a link code and return the user_id if valid."""
    code = code.upper().strip()
    entry = _link_codes.get(code)
    if entry is None:
        return None
    if time.time() > entry["expires"]:
        del _link_codes[code]
        return None
    user_id = entry["user_id"]
    del _link_codes[code]  # One-time use
    return user_id
