"""
handlers.py — aiogram v3 command and callback handlers.

Handlers parse Telegram input, resolve the sender to a user row, and delegate to
services. No SQL is written here. Every data call passes the resolved user_id,
so a Telegram account can only ever touch its own rows.
"""

import logging
from datetime import date

from aiogram import F, Router
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import CallbackQuery, Message

import database as db
import services
from auth import validate_link_code
from bot import bot_services, keyboards

logger = logging.getLogger(__name__)

router = Router(name="birkasjourney")

GENERIC_ERROR = (
    "⚠️ Something went wrong on my side. Nothing was saved.\n"
    "Please try again in a moment."
)


async def _resolve_user(message_or_query) -> dict:
    """Get (or create) the user row for whoever sent this update."""
    from_user = message_or_query.from_user
    return await services.get_or_create_telegram_user(
        telegram_id=from_user.id,
        username=from_user.username or from_user.first_name,
    )


# ─── /start and /help ────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    """Register the Telegram user and show the main menu."""
    try:
        user = await _resolve_user(message)
    except Exception as e:
        logger.error("start failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    name = user.get("username") or "there"
    await message.answer(
        f"👋 Hey <b>{name}</b>, welcome to <b>Birka's Journey</b>!\n\n"
        "I track six daily habits with you:\n"
        "💧 Water · 🚶 Steps · 🌙 Bedtime\n"
        "⏰ Wake up · 📚 IELTS · 💻 IT projects\n\n"
        "Tap a button below, or use /help to see every command.",
        reply_markup=keyboards.main_menu(),
    )


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    """List every command."""
    await message.answer(
        "<b>Commands</b>\n\n"
        "/start — main menu\n"
        "/today — today's progress\n"
        "/log — log a habit (<code>/log water 1.5</code>)\n"
        "/quote — your three daily quotes\n"
        "/remind — daily reminder (<code>/remind 21:00 Drink water</code>)\n"
        "/reminders — list your reminders\n"
        "/summary — last 7 days\n"
        "/link — connect your web account (<code>/link ABC123</code>)\n"
        "/help — this message"
    )


# ─── /today ──────────────────────────────────────────────────────────────────

@router.message(Command("today"))
async def cmd_today(message: Message) -> None:
    """Show today's progress across all six habits."""
    try:
        user = await _resolve_user(message)
        summary = await services.get_today_summary(user["id"])
    except Exception as e:
        logger.error("today failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    await message.answer(
        services.format_today_summary(summary),
        reply_markup=keyboards.main_menu(),
    )


# ─── /log ────────────────────────────────────────────────────────────────────

@router.message(Command("log"))
async def cmd_log(message: Message, command: CommandObject) -> None:
    """Log a habit value: /log <habit> <value>."""
    if not command.args:
        await message.answer(
            "Pick a habit to log 👇", reply_markup=keyboards.habit_picker()
        )
        return

    try:
        habit_name, value = bot_services.parse_log_command(command.args)
    except ValueError as e:
        await message.answer(f"❌ {e}")
        return

    try:
        user = await _resolve_user(message)
        result = await services.log_habit_for_user(user["id"], habit_name, value)
    except ValueError as e:
        # Out-of-range value caught by the service layer
        await message.answer(f"❌ {e}")
        return
    except Exception as e:
        logger.error("log failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    await message.answer(
        bot_services.format_log_confirmation(result),
        reply_markup=keyboards.main_menu(),
    )


# ─── /quote ──────────────────────────────────────────────────────────────────

@router.message(Command("quote"))
async def cmd_quote(message: Message) -> None:
    """Send the user's three quotes for today."""
    try:
        user = await _resolve_user(message)
        quotes = await db.get_daily_quotes(user["id"], date.today().isoformat())
    except Exception as e:
        logger.error("quote failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    if not quotes:
        await message.answer("💫 No quotes available right now — try again shortly.")
        return

    await message.answer(services.format_quotes(quotes))


# ─── /remind and /reminders ──────────────────────────────────────────────────

@router.message(Command("remind"))
async def cmd_remind(message: Message, command: CommandObject) -> None:
    """Create a daily reminder: /remind HH:MM <message>."""
    if not command.args:
        await message.answer(
            "⏰ Set a daily reminder like this:\n"
            "<code>/remind 21:00 Drink your last glass of water</code>"
        )
        return

    try:
        remind_at, text = bot_services.parse_remind_command(command.args)
    except ValueError as e:
        await message.answer(f"❌ {e}")
        return

    try:
        user = await _resolve_user(message)
        await db.create_reminder(user_id=user["id"], message=text, remind_at=remind_at)
    except Exception as e:
        logger.error("remind failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    await message.answer(
        f"✅ Reminder saved.\n\nEvery day at <b>{remind_at}</b> I'll send:\n<i>{text}</i>"
    )


@router.message(Command("reminders"))
async def cmd_reminders(message: Message) -> None:
    """List the sender's active reminders."""
    try:
        user = await _resolve_user(message)
        reminders = await db.get_user_reminders(user["id"])
    except Exception as e:
        logger.error("reminders failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    if not reminders:
        await message.answer(
            "⏰ You have no reminders yet.\n\n"
            "Create one with <code>/remind 21:00 Drink water</code>"
        )
        return

    lines = ["⏰ <b>Your reminders</b>\n"]
    for r in reminders:
        icon = r.get("habit_icon") or "•"
        lines.append(f"{icon} <b>{r['remind_at']}</b> — {r['message']}")
    await message.answer("\n".join(lines))


# ─── /summary ────────────────────────────────────────────────────────────────

@router.message(Command("summary"))
async def cmd_summary(message: Message) -> None:
    """Seven-day report with per-habit averages and a streak."""
    try:
        user = await _resolve_user(message)
        rows = await db.get_habit_history(user["id"], days=7)
        streak = await db.get_streak(user["id"])
    except Exception as e:
        logger.error("summary failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    text = bot_services.format_week_summary(rows, days=7)
    if streak:
        text += f"\n\n🔥 Current streak: <b>{streak}</b> day(s)"
    await message.answer(text, reply_markup=keyboards.main_menu())


# ─── /link ───────────────────────────────────────────────────────────────────

@router.message(Command("link"))
async def cmd_link(message: Message, command: CommandObject) -> None:
    """Connect this Telegram account to a web account using a one-time code."""
    if not command.args:
        await message.answer(
            "🔗 To connect your web account:\n\n"
            "1. Log in on the dashboard\n"
            "2. Press <b>Link Telegram</b> to get a 6-character code\n"
            "3. Send me <code>/link YOURCODE</code>"
        )
        return

    web_user_id = validate_link_code(command.args.strip())
    if web_user_id is None:
        await message.answer(
            "❌ That code is invalid or has expired.\n"
            "Codes last 5 minutes and work once — generate a fresh one."
        )
        return

    try:
        linked = await db.link_telegram_to_user(web_user_id, message.from_user.id)
    except Exception as e:
        logger.error("link failed for %s: %s", message.from_user.id, e)
        await message.answer(GENERIC_ERROR)
        return

    if not linked:
        await message.answer(
            "❌ This Telegram account is already linked to another web account."
        )
        return

    await message.answer(
        "✅ Linked! Your bot logs and your dashboard now share the same data.\n\n"
        "Try /today to see it."
    )


# ─── Inline keyboard callbacks ───────────────────────────────────────────────

@router.callback_query(F.data == "menu:root")
async def cb_root(query: CallbackQuery) -> None:
    await query.message.edit_text(
        "What would you like to do?", reply_markup=keyboards.main_menu()
    )
    await query.answer()


@router.callback_query(F.data == "menu:log")
async def cb_log_menu(query: CallbackQuery) -> None:
    await query.message.edit_text(
        "Pick a habit to log 👇", reply_markup=keyboards.habit_picker()
    )
    await query.answer()


@router.callback_query(F.data.startswith("pick:"))
async def cb_pick_habit(query: CallbackQuery) -> None:
    habit_name = query.data.split(":", 1)[1]
    label = keyboards.HABIT_LABELS.get(habit_name, habit_name)
    await query.message.edit_text(
        f"{label} — pick a value 👇", reply_markup=keyboards.value_picker(habit_name)
    )
    await query.answer()


@router.callback_query(F.data.startswith("log:"))
async def cb_log_value(query: CallbackQuery) -> None:
    """One-tap logging from a preset button."""
    try:
        _, habit_name, raw_value = query.data.split(":", 2)
        value = float(raw_value)
    except ValueError:
        await query.answer("That button is no longer valid.", show_alert=True)
        return

    try:
        user = await _resolve_user(query)
        result = await services.log_habit_for_user(user["id"], habit_name, value)
    except ValueError as e:
        await query.answer(str(e), show_alert=True)
        return
    except Exception as e:
        logger.error("callback log failed for %s: %s", query.from_user.id, e)
        await query.answer("Could not save that. Please try again.", show_alert=True)
        return

    await query.message.edit_text(
        bot_services.format_log_confirmation(result),
        reply_markup=keyboards.main_menu(),
    )
    await query.answer("Saved ✅")


@router.callback_query(F.data == "menu:today")
async def cb_today(query: CallbackQuery) -> None:
    try:
        user = await _resolve_user(query)
        summary = await services.get_today_summary(user["id"])
    except Exception as e:
        logger.error("callback today failed for %s: %s", query.from_user.id, e)
        await query.answer("Could not load that. Please try again.", show_alert=True)
        return

    await query.message.edit_text(
        services.format_today_summary(summary), reply_markup=keyboards.main_menu()
    )
    await query.answer()


@router.callback_query(F.data == "menu:quote")
async def cb_quote(query: CallbackQuery) -> None:
    try:
        user = await _resolve_user(query)
        quotes = await db.get_daily_quotes(user["id"], date.today().isoformat())
    except Exception as e:
        logger.error("callback quote failed for %s: %s", query.from_user.id, e)
        await query.answer("Could not load that. Please try again.", show_alert=True)
        return

    text = (
        services.format_quotes(quotes)
        if quotes
        else "💫 No quotes available right now — try again shortly."
    )
    await query.message.edit_text(text, reply_markup=keyboards.main_menu())
    await query.answer()


@router.callback_query(F.data == "menu:summary")
async def cb_summary(query: CallbackQuery) -> None:
    try:
        user = await _resolve_user(query)
        rows = await db.get_habit_history(user["id"], days=7)
    except Exception as e:
        logger.error("callback summary failed for %s: %s", query.from_user.id, e)
        await query.answer("Could not load that. Please try again.", show_alert=True)
        return

    await query.message.edit_text(
        bot_services.format_week_summary(rows, days=7),
        reply_markup=keyboards.main_menu(),
    )
    await query.answer()


# ─── Fallback for unknown input ──────────────────────────────────────────────

@router.message()
async def unknown(message: Message) -> None:
    """Anything that isn't a known command."""
    await message.answer(
        "🤔 I didn't recognise that.\n\n"
        "Try /today, /log, /quote, /summary — or /help for the full list.",
        reply_markup=keyboards.main_menu(),
    )
