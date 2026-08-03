"""
services.py — Business logic layer.

Contains validation rules, ownership checks, formatting.
No SQL here. No Telegram objects here.
"""

import hashlib
import logging
import re
from datetime import date
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

def calculate_completion(habit: dict, value: float) -> bool:
    """
    Determine whether today's value counts the habit as done.

    A binary habit ("did I meditate?") is done as soon as it is logged; a
    measured one is judged against its target.
    """
    if habit.get("kind") == "binary":
        return value >= 1

    target = habit.get("target_value")
    if target is None:
        return value > 0

    habit_name = habit["name"]
    if habit_name == "sleep":
        # Bedtime: target is 22.5 (22:30). Completed if value <= target
        return value <= target
    elif habit_name == "wake":
        # Wake up: target is 5.0 (5:00). Completed if value <= target
        return value <= target
    else:
        # For water, steps, ielts, it_projects: completed if value >= target
        return value >= target


def calculate_progress(habit: dict, value: float) -> float:
    """Progress towards today's target, 0-100."""
    if habit.get("kind") == "binary":
        # Nothing partial about a binary habit: it is done or it is not.
        return 100.0 if value >= 1 else 0.0

    habit_name = habit["name"]
    target = habit.get("target_value")
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


# Sanity ceilings for the six built-in habits. A custom habit has no natural
# ceiling, so it falls back to the generic range.
BUILTIN_VALUE_RANGES = {
    "water": (0, 20),        # 0-20 litres
    "steps": (0, 100000),    # 0-100k steps
    "sleep": (0, 24),        # 0-24 hours (decimal)
    "wake": (0, 24),         # 0-24 hours (decimal)
    "ielts": (0, 1440),      # 0-1440 minutes (24 hours)
    "it_projects": (0, 50),  # 0-50 contributions
}


def validate_habit_value(habit: dict, value: float) -> float:
    """Validate that a habit value is within an acceptable range."""
    if habit.get("kind") == "binary":
        if value < 0 or value > 1:
            raise ValueError(
                f"{habit['display_name']} is a yes/no habit — its value must be 0 or 1."
            )
        return value

    min_val, max_val = BUILTIN_VALUE_RANGES.get(habit["name"], (0, 999999))
    if value < min_val or value > max_val:
        raise ValueError(
            f"Value for {habit['display_name']} must be between {min_val} and "
            f"{max_val}. Got: {value:g}"
        )
    return value


async def log_habit_for_user(user_id: int, habit_name: str, value: float, log_date: Optional[str] = None) -> dict:
    """
    Log a habit value for a user. Returns the log entry with progress info.

    The habit is resolved within the user's own scope, so a custom habit is
    only ever loggable by the account that created it.
    """
    habit = await db.get_habit_by_name(habit_name, user_id)
    if not habit:
        available = ", ".join(h["name"] for h in await db.get_all_habits(user_id))
        raise ValueError(f"Unknown habit: '{habit_name}'. You track: {available}")

    value = validate_habit_value(habit, value)
    is_completed = calculate_completion(habit, value)

    if log_date is None:
        log_date = date.today().isoformat()

    await db.log_habit(
        user_id=user_id,
        habit_id=habit["id"],
        log_date=log_date,
        value=value,
        is_completed=is_completed,
    )

    return {
        "habit_name": habit["name"],
        "display_name": habit["display_name"],
        "icon": habit["icon"],
        "kind": habit["kind"],
        "value": value,
        "target": habit["target_value"],
        "unit": habit["unit"],
        "is_completed": is_completed,
        "progress": calculate_progress(habit, value),
        "log_date": log_date,
    }


async def get_today_summary(user_id: int) -> list[dict]:
    """Today's habits — the built-ins plus this user's own — with progress."""
    today = date.today().isoformat()
    logs = await db.get_today_logs(user_id, today)
    week_counts = await db.count_days_completed_by_habit(user_id, days=7)

    result = []
    for log in logs:
        value = log.get("value")

        progress = 0.0
        is_completed = False
        if value is not None:
            progress = calculate_progress(log, value)
            is_completed = calculate_completion(log, value)

        result.append({
            "habit_id": log["habit_id"],
            "name": log["name"],
            "display_name": log["display_name"],
            "kind": log["kind"] or "measured",
            "target_value": log.get("target_value"),
            "target_days": log.get("target_days") or 7,
            "unit": log["unit"],
            "icon": log["icon"],
            "color": log.get("color"),
            "category": log.get("category"),
            "notes": log.get("notes"),
            "sort_order": log["sort_order"],
            "value": value,
            "is_completed": is_completed if value is not None else None,
            "log_date": log.get("log_date"),
            "progress": progress,
            "days_done": week_counts.get(log["habit_id"], 0),
            "is_custom": log.get("owner_id") is not None,
        })

    return result


# ─── Custom habits ───────────────────────────────────────────────────────────

def slugify_habit_name(display_name: str) -> str:
    """
    Turn what the user typed into the short storage name commands use.

    "Morning run" → "morning_run". A name with no Latin letters (Cyrillic, for
    instance) has no readable slug, so it falls back to a stable digest of the
    name — same input always gives the same slug, which is what lets the
    duplicate check below still work.
    """
    slug = re.sub(r"[^a-z0-9]+", "_", display_name.lower()).strip("_")[:40]
    if not slug:
        digest = hashlib.sha1(display_name.strip().lower().encode()).hexdigest()[:8]
        slug = f"habit_{digest}"
    return slug


async def create_habit_for_user(
    user_id: int,
    display_name: str,
    icon: Optional[str] = None,
    color: Optional[str] = None,
    category: str = "Other",
    target_days: int = 7,
    notes: Optional[str] = None,
    reminder_time: Optional[str] = None,
) -> dict:
    """
    Create a habit for one user, optionally with its daily Telegram reminder.

    Raises ValueError with a message meant for the user when the name is blank
    or already in use.
    """
    display_name = display_name.strip()
    if not display_name:
        raise ValueError("Give the habit a name first.")
    if not 1 <= target_days <= 7:
        raise ValueError("Target must be between 1 and 7 days a week.")

    name = slugify_habit_name(display_name)

    # Checked up front so the common case gets a clear message; the unique
    # index is still what guarantees it if two requests race.
    existing = await db.get_habit_by_name(name, user_id)
    if existing:
        raise ValueError(f"You already have a habit called '{existing['display_name']}'.")

    try:
        habit_id = await db.create_habit(
            user_id=user_id,
            name=name,
            display_name=display_name,
            kind="binary",
            icon=icon,
            color=color,
            category=category,
            target_days=target_days,
            notes=notes,
        )
    except db.DuplicateHabitName:
        raise ValueError(f"You already have a habit called '{display_name}'.")

    if reminder_time:
        # A failed reminder must not lose the habit the user just created, so
        # it is logged and reported rather than raised.
        try:
            await db.create_reminder(
                user_id=user_id,
                message=f"Time for {display_name}",
                remind_at=reminder_time,
                habit_id=habit_id,
            )
        except Exception as e:
            logger.error("Habit %s created but its reminder failed: %s", habit_id, e)
            reminder_time = None

    return {
        "id": habit_id,
        "name": name,
        "display_name": display_name,
        "kind": "binary",
        "target_value": None,
        "target_days": target_days,
        "unit": None,
        "icon": icon,
        "color": color,
        "category": category,
        "notes": notes,
        "sort_order": 0,
        "is_custom": True,
        "reminder_time": reminder_time,
    }


async def update_habit_for_user(user_id: int, habit_id: int, fields: dict) -> dict:
    """Edit a habit the user owns. Built-ins are not editable."""
    updates = {k: v for k, v in fields.items() if v is not None}
    if not updates:
        raise ValueError("Nothing to update.")

    if "display_name" in updates and not updates["display_name"].strip():
        raise ValueError("Habit name cannot be empty.")
    if "is_archived" in updates:
        updates["is_archived"] = int(bool(updates["is_archived"]))

    updated = await db.update_habit(user_id, habit_id, updates)
    if not updated:
        raise LookupError("That habit doesn't exist, or it isn't one you can edit.")

    habit = await db.get_habit_by_id(habit_id, user_id)
    return {**habit, "is_custom": habit.get("user_id") is not None}


async def delete_habit_for_user(user_id: int, habit_id: int) -> None:
    """Delete a habit the user owns, with its logs and reminders."""
    deleted = await db.delete_habit(user_id, habit_id)
    if not deleted:
        raise LookupError("That habit doesn't exist, or it isn't one you can delete.")


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

        if h.get("kind") == "binary":
            # A yes/no habit has no value to show — what matters is whether it
            # is done today and how the week is going against its target.
            week = f"{h.get('days_done', 0)}/{h.get('target_days', 7)} this week"
            done = "✅ done today" if value is not None else "⬜ not yet"
            lines.append(f"{icon} <b>{name}</b>: {done} · {week}")
        elif value is not None:
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
