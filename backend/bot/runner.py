"""
runner.py — Telegram bot lifecycle.

The bot runs as an asyncio task inside the FastAPI process, so one command
(`uvicorn main:app`) starts both the web API and the bot.
"""

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand

from bot.handlers import router as handlers_router
from config import settings

logger = logging.getLogger(__name__)

_bot: Bot | None = None
_dispatcher: Dispatcher | None = None

COMMANDS = [
    BotCommand(command="start", description="Main menu"),
    BotCommand(command="today", description="Today's progress"),
    BotCommand(command="log", description="Log a habit"),
    BotCommand(command="quote", description="Daily motivation"),
    BotCommand(command="remind", description="Set a daily reminder"),
    BotCommand(command="reminders", description="List your reminders"),
    BotCommand(command="summary", description="Last 7 days"),
    BotCommand(command="link", description="Connect your web account"),
    BotCommand(command="help", description="All commands"),
]


def get_bot() -> Bot | None:
    """The live Bot instance — used by the scheduler to push reminders."""
    return _bot


async def start_bot() -> asyncio.Task:
    """Create the bot, register handlers, and start polling in the background."""
    global _bot, _dispatcher

    _bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    _dispatcher = Dispatcher()
    _dispatcher.include_router(handlers_router)

    try:
        await _bot.set_my_commands(COMMANDS)
    except Exception as e:
        # Network error at startup must not stop the web API from serving.
        logger.warning("Could not set bot commands (network?): %s", e)

    async def _poll() -> None:
        try:
            await _dispatcher.start_polling(_bot, handle_signals=False)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Bot polling stopped unexpectedly")

    return asyncio.create_task(_poll(), name="telegram-bot-polling")


async def stop_bot(task: asyncio.Task) -> None:
    """Stop polling and close the HTTP session cleanly."""
    global _bot, _dispatcher

    if _dispatcher is not None:
        try:
            await _dispatcher.stop_polling()
        except Exception as e:
            logger.warning("Error stopping polling: %s", e)

    task.cancel()
    try:
        await task
    except (asyncio.CancelledError, Exception):
        pass

    if _bot is not None:
        try:
            await _bot.session.close()
        except Exception as e:
            logger.warning("Error closing bot session: %s", e)

    _bot = None
    _dispatcher = None
