"""
bot_services.py — Bot-facing business helpers.

Parsing of command arguments and Telegram-specific formatting that is not shared
with the web API. No SQL and no aiogram types here — handlers own those.
"""

import re
from collections import defaultdict

import services

# Aliases so the user can type what feels natural instead of the DB name.
HABIT_ALIASES: dict[str, str] = {
    "water": "water",
    "w": "water",
    "steps": "steps",
    "step": "steps",
    "s": "steps",
    "sleep": "sleep",
    "bedtime": "sleep",
    "bed": "sleep",
    "wake": "wake",
    "wakeup": "wake",
    "ielts": "ielts",
    "english": "ielts",
    "it": "it_projects",
    "it_projects": "it_projects",
    "projects": "it_projects",
    "code": "it_projects",
}

TIME_HABITS = {"sleep", "wake"}

USAGE = (
    "Usage: <code>/log &lt;habit&gt; &lt;value&gt;</code>\n\n"
    "Examples:\n"
    "• <code>/log water 1.5</code> — litres\n"
    "• <code>/log steps 8000</code>\n"
    "• <code>/log bedtime 22:30</code>\n"
    "• <code>/log wakeup 06:00</code>\n"
    "• <code>/log ielts 60</code> — minutes\n"
    "• <code>/log it 2</code> — tasks done\n\n"
    f"Built-in habits: {', '.join(sorted(set(HABIT_ALIASES.values())))}\n"
    "For a habit you added yourself, just <code>/log &lt;name&gt;</code> — "
    "logging it marks it done for today."
)


def parse_log_command(argument_text: str) -> tuple[str, float]:
    """
    Turn '/log' arguments into (habit_name, value).

    A name that isn't a built-in alias is passed through as a habit slug: only
    the database knows which custom habits this user has, and that check
    belongs in services. Those are yes/no habits, so the value may be left off
    and defaults to 1 — "done today".

    Raises ValueError with a user-friendly message on any malformed input.
    """
    parts = argument_text.split()
    if not parts:
        raise ValueError("I need a habit name.\n\n" + USAGE)

    raw_habit = parts[0].lower().strip()
    habit_name = HABIT_ALIASES.get(raw_habit)

    if habit_name is None:
        # Not a built-in — treat it as one of the user's own habits.
        if not re.fullmatch(r"[a-z0-9_]{1,50}", raw_habit):
            raise ValueError(
                f"'{parts[0]}' isn't a habit name I can read. Use the short name "
                "shown on your dashboard, e.g. <code>/log morning_run</code>."
            )
        habit_name = raw_habit
        if len(parts) < 2:
            return habit_name, 1.0

    if len(parts) < 2:
        raise ValueError("I need both a habit and a value.\n\n" + USAGE)

    raw_value = parts[1].strip()

    if habit_name in TIME_HABITS:
        if ":" not in raw_value:
            raise ValueError(
                f"'{raw_habit}' needs a time like <code>22:30</code>, not '{raw_value}'."
            )
        value = services.time_str_to_decimal(raw_value)
    else:
        try:
            value = float(raw_value.replace(",", "."))
        except ValueError:
            raise ValueError(
                f"'{raw_value}' is not a number. Try something like <code>/log {raw_habit} 2</code>."
            )

    return habit_name, value


def parse_remind_command(argument_text: str) -> tuple[str, str]:
    """
    Turn '/remind' arguments into (remind_at, message).

    Expected shape: '/remind 21:00 Drink water'.
    """
    parts = argument_text.split(maxsplit=1)
    if len(parts) < 2:
        raise ValueError(
            "I need a time and a message.\n\n"
            "Example: <code>/remind 21:00 Drink your last glass of water</code>"
        )

    remind_at, message = parts[0].strip(), parts[1].strip()

    if ":" not in remind_at:
        raise ValueError(
            f"'{remind_at}' is not a time. Use HH:MM, e.g. <code>21:00</code>."
        )
    try:
        hour, minute = (int(x) for x in remind_at.split(":", 1))
    except ValueError:
        raise ValueError(
            f"'{remind_at}' is not a time. Use HH:MM, e.g. <code>21:00</code>."
        )
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError("Time must be between 00:00 and 23:59.")

    if not message:
        raise ValueError("The reminder message cannot be empty.")
    if len(message) > 500:
        raise ValueError("Keep the reminder under 500 characters.")

    return f"{hour:02d}:{minute:02d}", message


def format_log_confirmation(result: dict) -> str:
    """Confirmation message after a successful habit log."""
    unit = result.get("unit") or ""
    if unit == "time":
        value_str = services.decimal_to_time_str(result["value"])
        target_str = services.decimal_to_time_str(result["target"])
        unit = ""
    else:
        value_str = f"{result['value']:g}"
        target_str = f"{result['target']:g}"

    status = "✅ Target reached!" if result["is_completed"] else "⏳ Keep going!"
    bar = services.progress_bar(result["progress"])

    return (
        f"{result['icon']} <b>{result['display_name']}</b> logged\n\n"
        f"{value_str} / {target_str} {unit}\n"
        f"{bar} {result['progress']:.0f}%\n\n"
        f"{status}"
    )


def format_week_summary(rows: list[dict], days: int = 7) -> str:
    """Aggregate raw history rows into a per-habit week report."""
    if not rows:
        return (
            f"📈 <b>Last {days} days</b>\n\n"
            "No entries yet. Log something with /log and check back tomorrow!"
        )

    totals: dict[str, dict] = defaultdict(
        lambda: {"days": 0, "completed": 0, "sum": 0.0, "icon": "•", "display_name": ""}
    )
    for row in rows:
        bucket = totals[row["name"]]
        bucket["days"] += 1
        bucket["completed"] += 1 if row["is_completed"] else 0
        bucket["sum"] += row["value"] or 0.0
        bucket["icon"] = row.get("icon") or "•"
        bucket["display_name"] = row.get("display_name") or row["name"]

    active_days = len({row["log_date"] for row in rows})
    lines = [f"📈 <b>Last {days} days</b> — {active_days} active day(s)\n"]

    for name, bucket in totals.items():
        average = bucket["sum"] / bucket["days"]
        average_str = (
            services.decimal_to_time_str(average)
            if name in TIME_HABITS
            else f"{average:.1f}".rstrip("0").rstrip(".")
        )
        lines.append(
            f"{bucket['icon']} <b>{bucket['display_name']}</b>\n"
            f"   {bucket['completed']}/{bucket['days']} days on target · avg {average_str}"
        )

    return "\n".join(lines)
