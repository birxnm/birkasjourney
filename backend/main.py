"""
main.py — FastAPI entry point.

Startup: load config, init the SQLite schema, seed habits and quotes, start the
Telegram bot and the reminder scheduler as background tasks.
Shutdown: stop the scheduler and close the bot session cleanly.

Run from the backend/ directory:
    uvicorn main:app --reload
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import database as db
from config import settings
from quotes_data import QUOTES
from routers import auth_router, habits_router, quotes_router, reminders_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("Starting Birka's Journey…")

    try:
        settings.validate()
    except ValueError as e:
        # The API can still serve the web app without a bot token; log loudly.
        logger.warning("Configuration warning: %s", e)

    await db.init_db()
    await db.seed_habits()
    await db.seed_quotes(QUOTES)

    bot_task = None
    scheduler_task = None
    if settings.BOT_TOKEN:
        from bot.runner import start_bot, stop_bot
        from scheduler import start_scheduler

        bot_task = await start_bot()
        scheduler_task = await start_scheduler()
        logger.info("Telegram bot and reminder scheduler started")
    else:
        logger.warning("BOT_TOKEN missing — running web API only, bot disabled")

    yield

    logger.info("Shutting down…")
    if scheduler_task:
        scheduler_task.cancel()
    if bot_task:
        from bot.runner import stop_bot

        await stop_bot(bot_task)
    logger.info("Shutdown complete")


app = FastAPI(
    title="Birka's Journey API",
    description="Habit tracking with a Telegram bot and a web dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP runs locally; tighten before any public deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Category 4 — unexpected: log the detail, show the user a plain message."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Something went wrong on our side. Please try again."},
    )


app.include_router(auth_router)
app.include_router(habits_router)
app.include_router(quotes_router)
app.include_router(reminders_router)


@app.get("/api/health", tags=["system"])
async def health() -> dict:
    """Liveness probe used by the QA checklist."""
    return {"status": "ok", "bot_enabled": bool(settings.BOT_TOKEN)}


# ─── Static frontend ─────────────────────────────────────────────────────────
# Mounted last so /api/* routes always win.

if FRONTEND_DIR.exists():
    for folder in ("css", "js", "assets"):
        if (FRONTEND_DIR / folder).exists():
            app.mount(
                f"/{folder}",
                StaticFiles(directory=FRONTEND_DIR / folder),
                name=folder,
            )

    @app.get("/", include_in_schema=False)
    async def index() -> FileResponse:
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/dashboard", include_in_schema=False)
    async def dashboard() -> FileResponse:
        return FileResponse(FRONTEND_DIR / "dashboard.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
