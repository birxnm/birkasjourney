"""
models.py — Pydantic schemas for request/response validation.

Used by FastAPI routers for automatic validation and OpenAPI documentation.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, datetime
import re


# ─── Auth Models ─────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    username: Optional[str] = Field(None, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email format")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v.strip()) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: Optional[str] = None
    email: Optional[str] = None
    telegram_id: Optional[int] = None
    created_at: Optional[str] = None


# ─── Habit Models ────────────────────────────────────────────────────────────

class HabitDefinition(BaseModel):
    id: int
    name: str
    display_name: str
    target_value: Optional[float] = None
    unit: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0


class HabitLogRequest(BaseModel):
    habit_name: str = Field(..., min_length=1, max_length=50)
    value: float = Field(..., ge=0)
    log_date: Optional[str] = None  # defaults to today

    @field_validator("habit_name")
    @classmethod
    def validate_habit_name(cls, v: str) -> str:
        valid_names = {"water", "steps", "sleep", "wake", "ielts", "it_projects"}
        v = v.lower().strip()
        if v not in valid_names:
            raise ValueError(
                f"Unknown habit '{v}'. Valid habits: {', '.join(sorted(valid_names))}"
            )
        return v

    @field_validator("log_date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class HabitLogResponse(BaseModel):
    habit_id: int
    name: str
    display_name: str
    target_value: Optional[float] = None
    unit: Optional[str] = None
    icon: Optional[str] = None
    value: Optional[float] = None
    is_completed: Optional[bool] = None
    log_date: Optional[str] = None
    sort_order: int = 0
    progress: float = 0.0  # Percentage


# ─── Reminder Models ─────────────────────────────────────────────────────────

class ReminderRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    remind_at: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    habit_name: Optional[str] = None

    @field_validator("remind_at")
    @classmethod
    def validate_time(cls, v: str) -> str:
        try:
            parts = v.split(":")
            hour, minute = int(parts[0]), int(parts[1])
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                raise ValueError()
        except (ValueError, IndexError):
            raise ValueError("Time must be in HH:MM format (00:00 - 23:59)")
        return v


class ReminderResponse(BaseModel):
    id: int
    message: str
    remind_at: str
    habit_name: Optional[str] = None
    habit_icon: Optional[str] = None
    is_active: bool = True


# ─── Quote Models ────────────────────────────────────────────────────────────

class QuoteResponse(BaseModel):
    text: str
    author: str
    category: str


# ─── Stats Models ────────────────────────────────────────────────────────────

class StatsResponse(BaseModel):
    streak: int = 0
    completion_rate: float = 0.0
    total_logs: int = 0


# ─── Link Models ─────────────────────────────────────────────────────────────

class GenerateLinkResponse(BaseModel):
    link_code: str
    expires_in: int = 300  # 5 minutes
