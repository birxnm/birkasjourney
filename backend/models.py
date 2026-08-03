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

# The categories offered in the dashboard's Add Habit form. Anything else is
# rejected, so the value stored is always one the UI can render back.
HABIT_CATEGORIES = (
    "Health & Fitness",
    "Learning & Education",
    "Productivity",
    "Creativity",
    "Mindfulness",
    "Social",
    "Finance",
    "Other",
)


class HabitDefinition(BaseModel):
    id: int
    name: str
    display_name: str
    kind: str = "measured"
    target_value: Optional[float] = None
    target_days: int = 7
    unit: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    sort_order: int = 0
    is_custom: bool = False


class HabitCreate(BaseModel):
    """
    A habit created from the dashboard.

    Only `display_name` is required; the storage name is derived from it in
    services. `reminder_time` is optional and, when present, also schedules the
    daily Telegram reminder for the new habit.
    """

    display_name: str = Field(..., min_length=1, max_length=50)
    icon: Optional[str] = Field(None, max_length=8)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    category: str = "Other"
    target_days: int = Field(7, ge=1, le=7)
    notes: Optional[str] = Field(None, max_length=500)
    reminder_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Habit name cannot be empty")
        return v

    @field_validator("notes")
    @classmethod
    def clean_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in HABIT_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(HABIT_CATEGORIES)}")
        return v

    @field_validator("reminder_time")
    @classmethod
    def validate_reminder_time(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        hour, minute = int(v[:2]), int(v[3:])
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            raise ValueError("Reminder time must be between 00:00 and 23:59")
        return v


class HabitCreatedResponse(HabitDefinition):
    """Echoes the reminder time back, or null if the reminder could not be saved."""

    reminder_time: Optional[str] = None


class HabitUpdate(BaseModel):
    """Partial edit of a habit the user owns. Every field is optional."""

    display_name: Optional[str] = Field(None, min_length=1, max_length=50)
    icon: Optional[str] = Field(None, max_length=8)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    category: Optional[str] = None
    target_days: Optional[int] = Field(None, ge=1, le=7)
    notes: Optional[str] = Field(None, max_length=500)
    is_archived: Optional[bool] = None

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("Habit name cannot be empty")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in HABIT_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(HABIT_CATEGORIES)}")
        return v


class HabitLogRequest(BaseModel):
    habit_name: str = Field(..., min_length=1, max_length=50)
    value: float = Field(..., ge=0)
    log_date: Optional[str] = None  # defaults to today

    @field_validator("habit_name")
    @classmethod
    def validate_habit_name(cls, v: str) -> str:
        """
        Check the shape only.

        Whether the habit exists is decided per user in services, because a
        custom habit belongs to one account and is unknown to every other.
        """
        v = v.lower().strip()
        if not v:
            raise ValueError("Habit name cannot be empty")
        if not re.fullmatch(r"[a-z0-9_]{1,50}", v):
            raise ValueError(
                "Habit name may only contain lowercase letters, numbers and underscores"
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
    kind: str = "measured"
    target_value: Optional[float] = None
    target_days: int = 7
    unit: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    value: Optional[float] = None
    is_completed: Optional[bool] = None
    log_date: Optional[str] = None
    sort_order: int = 0
    progress: float = 0.0  # Percentage
    days_done: int = 0  # Days completed this week — the target for binary habits
    is_custom: bool = False


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
