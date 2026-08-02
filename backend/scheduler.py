"""
scheduler.py — Background reminder loop.

Wakes once a minute, reads the local wall-clock time in the configured timezone,
and pushes every reminder scheduled for that HH:MM through the Telegram bot.

Each minute is processed at most once, so a slow tick can never double-send.
"""

import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import database as db
from config import settings

logger = logging.getLogger(__name__)

TICK_SECONDS = 30


def _local_now() -> datetime:
    """Current time in the configured timezone, falling back to system time."""
    try:
        return datetime.now(ZoneInfo(settings.TIMEZONE))
    except (ZoneInfoNotFoundError, ValueError):
        logger.warning("Unknown timezone '%s' — using system time", settings.TIMEZONE)
        return datetime.now()


async def _send_due_reminders(current_hhmm: str) -> None:
    """Deliver every active reminder scheduled for this minute."""
    from bot.runner import get_bot

    bot = get_bot()
    if bot is None:
        return

    try:
        reminders = await db.get_active_reminders_at(current_hhmm)
    except Exception as e:
        logger.error("Could not read reminders for %s: %s", current_hhmm, e)
        return

    for reminder in reminders:
        telegram_id = reminder.get("telegram_id")
        if not telegram_id:
            continue
        try:
            await bot.send_message(
                chat_id=telegram_id,
                text=f"⏰ <b>Reminder</b>\n\n{reminder['message']}",
            )
        except Exception as e:
            # A blocked chat or a network blip must not stop the other sends.
            logger.warning(
                "Could not deliver reminder %s to %s: %s",
                reminder.get("id"),
                telegram_id,
                e,
            )

    if reminders:
        logger.info("Delivered %d reminder(s) at %s", len(reminders), current_hhmm)


async def _run() -> None:
    """The scheduler loop itself."""
    last_minute: str | None = None
    logger.info("Reminder scheduler running (timezone: %s)", settings.TIMEZONE)

    while True:
        try:
            current_hhmm = _local_now().strftime("%H:%M")
            if current_hhmm != last_minute:
                last_minute = current_hhmm
                await _send_due_reminders(current_hhmm)
        except asyncio.CancelledError:
            raise
        except Exception:
            # Unexpected errors are logged; the loop keeps running.
            logger.exception("Scheduler tick failed")

        await asyncio.sleep(TICK_SECONDS)


async def start_scheduler() -> asyncio.Task:
    """Start the loop as a background task."""
    return asyncio.create_task(_run(), name="reminder-scheduler")
