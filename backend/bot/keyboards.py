"""
keyboards.py — Inline keyboards for one-tap habit logging.

Callback data format: "log:<habit_name>:<value>" and "menu:<action>".
Values are baked into the button so the handler never has to parse free text.
"""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

# Quick-log presets per habit: (button label, value stored in the DB)
QUICK_VALUES: dict[str, list[tuple[str, float]]] = {
    "water": [("0.5 L", 0.5), ("1 L", 1.0), ("1.5 L", 1.5), ("2 L", 2.0), ("2.5 L", 2.5)],
    "steps": [("3k", 3000), ("5k", 5000), ("8k", 8000), ("10k", 10000), ("15k", 15000)],
    "sleep": [("22:00", 22.0), ("22:30", 22.5), ("23:00", 23.0), ("00:00", 24.0)],
    "wake": [("05:00", 5.0), ("06:00", 6.0), ("07:00", 7.0), ("08:00", 8.0)],
    "ielts": [("30 min", 30), ("60 min", 60), ("90 min", 90), ("120 min", 120)],
    "it_projects": [("1 task", 1), ("2 tasks", 2), ("3 tasks", 3)],
}

HABIT_LABELS: dict[str, str] = {
    "water": "💧 Water",
    "steps": "🚶 Steps",
    "sleep": "🌙 Bedtime",
    "wake": "⏰ Wake up",
    "ielts": "📚 IELTS",
    "it_projects": "💻 IT projects",
}


def main_menu() -> InlineKeyboardMarkup:
    """Root menu shown by /start."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📊 Today", callback_data="menu:today"),
                InlineKeyboardButton(text="✍️ Log a habit", callback_data="menu:log"),
            ],
            [
                InlineKeyboardButton(text="💫 Quotes", callback_data="menu:quote"),
                InlineKeyboardButton(text="📈 Week summary", callback_data="menu:summary"),
            ],
        ]
    )


def habit_picker() -> InlineKeyboardMarkup:
    """Choose which habit to log — two per row."""
    buttons = [
        InlineKeyboardButton(text=label, callback_data=f"pick:{name}")
        for name, label in HABIT_LABELS.items()
    ]
    rows = [buttons[i : i + 2] for i in range(0, len(buttons), 2)]
    rows.append([InlineKeyboardButton(text="« Back", callback_data="menu:root")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def value_picker(habit_name: str) -> InlineKeyboardMarkup:
    """Preset values for one habit — three per row."""
    presets = QUICK_VALUES.get(habit_name, [])
    buttons = [
        InlineKeyboardButton(text=label, callback_data=f"log:{habit_name}:{value:g}")
        for label, value in presets
    ]
    rows = [buttons[i : i + 3] for i in range(0, len(buttons), 3)]
    rows.append([InlineKeyboardButton(text="« Back", callback_data="menu:log")])
    return InlineKeyboardMarkup(inline_keyboard=rows)
