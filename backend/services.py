"""
services.py — Business logic layer.

Contains validation rules, ownership checks, formatting.
No SQL here. No Telegram objects here.
"""

import logging
from datetime import date, datetime
from typing import Optional

import database as db

logger = logging.getLogger(__name__)


# ─── User Services ───────────────────────────────────────────────────────────

async def get_or_create_telegram_user(telegram_id: int, username: Optional[str] = None) -> dict:
    """Get existing user or create a new one from Telegram. Returns user dict."""
    user = await db.get_user_by_telegram_id(telegram_id)
    if user:
        return user

    try:
        user_id = await db.create_user(telegram_id=telegram_id, username=username)
        return {
            "id": user_id,
            "telegram_id": telegram_id,
            "username": username,
            "email": None,
            "password_hash": None,
        }
    except Exception as e:
        logger.error("Failed to create Telegram user %s: %s", telegram_id, e)
        raise


async def register_web_user(email: str, password_hash: str, username: Optional[str] = None) -> dict:
    """Register a new web user. Raises if email already exists."""
    existing = await db.get_user_by_email(email)
    if existing:
        raise ValueError("An account with this email already exists.")

    user_id = await db.create_user(
        email=email, password_hash=password_hash, username=username
    )
    return {"id": user_id, "email": email, "username": username}


# ─── Habit Services ──────────────────────────────────────────────────────────

def calculate_completion(habit_name: str, value: float, target: float) -> bool:
    """Determine if a habit value meets the target."""
    if habit_name == "sleep":
        # Bedtime: target is 22.5 (22:30). Completed if value <= target
        return value <= target
    elif habit_name == "wake":
        # Wake up: target is 5.0 (5:00). Completed if value <= target
        return value <= target
    else:
        # For water, steps, ielts, it_projects: completed if value >= target
        return value >= target


def calculate_progress(habit_name: str, value: float, target: float) -> float:
    """Calculate progress percentage (0-100)."""
    if target is None or target == 0:
        return 100.0 if value > 0 else 0.0

    if habit_name in ("sleep", "wake"):
        # For time-based: closer to or better than target = higher %
        # If target is 22:30 (22.5) and value is 22:00 (22.0) → 100%
        # If value is 23:00 (23.0) → partial
        if habit_name == "sleep":
            if value <= target:
                return 100.0
            # How far past the target (max 2 hours late = 0%)
            excess = value - target
            return max(0.0, round(100.0 - (excess / 2.0 * 100.0), 1))
        else:  # wake
            if value <= target:
                return 100.0
            excess = value - target
            return max(0.0, round(100.0 - (excess / 3.0 * 100.0), 1))
    else:
        return min(100.0, round((value / target) * 100.0, 1))


def time_str_to_decimal(time_str: str) -> float:
    """Convert 'HH:MM' to decimal hours (e.g., '22:30' → 22.5)."""
    try:
        parts = time_str.split(":")
        return int(parts[0]) + int(parts[1]) / 60.0
    except (ValueError, IndexError):
        raise ValueError(f"Invalid time format: '{time_str}'. Use HH:MM (e.g., 22:30)")


def decimal_to_time_str(decimal: float) -> str:
    """Convert decimal hours to 'HH:MM' (e.g., 22.5 → '22:30')."""
    hours = int(decimal)
    minutes = int((decimal - hours) * 60)
    return f"{hours:02d}:{minutes:02d}"


def validate_habit_value(habit_name: str, value: float) -> float:
    """Validate that a habit value is within acceptable range."""
    ranges = {
        "water": (0, 20),      # 0-20 litres
        "steps": (0, 100000),  # 0-100k steps
        "sleep": (0, 24),      # 0-24 hours (decimal)
        "wake": (0, 24),       # 0-24 hours (decimal)
        "ielts": (0, 1440),    # 0-1440 minutes (24 hours)
        "it_projects": (0, 50),  # 0-50 contributions
    }
    min_val, max_val = ranges.get(habit_name, (0, 999999))

    if value < min_val or value > max_val:
        raise ValueError(
            f"Value for {habit_name} must be between {min_val} and {max_val}. Got: {value}"
        )
    return value


async def log_habit_for_user(user_id: int, habit_name: str, value: float, log_date: Optional[str] = None) -> dict:
    """Log a habit value for a user. Returns the log entry with progress info."""
    # Get habit definition
    habit = await db.get_habit_by_name(habit_name)
    if not habit:
        raise ValueError(f"Unknown habit: '{habit_name}'")

    # Validate value
    value = validate_habit_value(habit_name, value)

    # Determine completion
    is_completed = calculate_completion(habit_name, value, habit["target_value"])

    # Use today if no date specified
    if log_date is None:
        log_date = date.today().isoformat()

    # Save to database
    await db.log_habit(
        user_id=user_id,
        habit_id=habit["id"],
        log_date=log_date,
        value=value,
        is_completed=is_completed,
    )

    progress = calculate_progress(habit_name, value, habit["target_value"])

    return {
        "habit_name": habit_name,
        "display_name": habit["display_name"],
        "icon": habit["icon"],
        "value": value,
        "target": habit["target_value"],
        "unit": habit["unit"],
        "is_completed": is_completed,
        "progress": progress,
        "log_date": log_date,
    }


async def get_today_summary(user_id: int) -> list[dict]:
    """Get today's habit summary with progress calculations."""
    today = date.today().isoformat()
    logs = await db.get_today_logs(user_id, today)

    result = []
    for log in logs:
        value = log.get("value")
        target = log.get("target_value")
        name = log["name"]

        progress = 0.0
        is_completed = False
        if value is not None and target is not None:
            progress = calculate_progress(name, value, target)
            is_completed = calculate_completion(name, value, target)

        result.append({
            "habit_id": log["habit_id"],
            "name": name,
            "display_name": log["display_name"],
            "target_value": target,
            "unit": log["unit"],
            "icon": log["icon"],
            "sort_order": log["sort_order"],
            "value": value,
            "is_completed": is_completed if value is not None else None,
            "log_date": log.get("log_date"),
            "progress": progress,
        })

    return result


# ─── Formatting (for Telegram bot) ──────────────────────────────────────────

def format_today_summary(habits: list[dict]) -> str:
    """Format today's habit summary as a Telegram-friendly text."""
    today_str = date.today().strftime("%A, %B %d, %Y")
    lines = [f"📊 <b>Today's Progress</b> — {today_str}\n"]

    for h in habits:
        icon = h.get("icon", "•")
        name = h.get("display_name", h.get("name"))
        value = h.get("value")
        target = h.get("target_value")
        unit = h.get("unit", "")
        progress = h.get("progress", 0)

        if value is not None:
            if unit == "time":
                value_str = decimal_to_time_str(value)
                target_str = decimal_to_time_str(target) if target else "—"
            else:
                value_str = f"{value:g}"
                target_str = f"{target:g}" if target else "—"

            status = "✅" if h.get("is_completed") else "⏳"
            bar = progress_bar(progress)
            lines.append(
                f"{icon} <b>{name}</b>: {value_str}/{target_str} {unit}\n"
                f"   {bar} {progress:.0f}% {status}"
            )
        else:
            lines.append(f"{icon} <b>{name}</b>: Not logged yet ⬜")

    return "\n".join(lines)


def progress_bar(pct: float, length: int = 10) -> str:
    """Create a text progress bar."""
    filled = int(pct / 100 * length)
    empty = length - filled
    return "▓" * filled + "░" * empty


def format_quotes(quotes: list[dict]) -> str:
    """Format quotes for Telegram display."""
    lines = ["💫 <b>Your Daily Motivation</b>\n"]
    for i, q in enumerate(quotes, 1):
        lines.append(f'{i}. <i>"{q["text"]}"</i>\n   — <b>{q["author"]}</b>\n')
    return "\n".join(lines)
