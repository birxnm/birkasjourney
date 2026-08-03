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

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
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
DIST_DIR = FRONTEND_DIR / "dist"
INDEX_FILE = DIST_DIR / "index.html"

# Shown instead of the dashboard when the React app has not been built yet.
BUILD_MISSING_PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Birka's Journey — build the frontend</title>
<style>
  body{margin:0;display:grid;place-items:center;min-height:100vh;background:#0a0a14;
       color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  main{max-width:32rem;padding:2rem;text-align:center}
  code{display:block;margin:1rem 0;padding:.9rem;background:rgba(255,255,255,.06);
       border:1px solid rgba(255,255,255,.1);border-radius:10px;
       font-family:ui-monospace,Menlo,monospace;color:#22d3ee}
  a{color:#a78bfa}
</style></head>
<body><main>
  <h1>The dashboard isn't built yet</h1>
  <p>The API is running. Build the React frontend once, then reload this page:</p>
  <code>cd frontend &amp;&amp; npm install &amp;&amp; npm run build</code>
  <p>The API itself is fine — see <a href="/docs">/docs</a>.</p>
</main></body></html>
"""


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
    await db.migrate_db()  # brings an older database up to the current schema
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
    # Set ALLOWED_ORIGINS to the deployed origin in production; it defaults to
    # "*" for local development.
    allow_origins=settings.ALLOWED_ORIGINS,
    # Auth travels as an Authorization: Bearer header, not a cookie, so no
    # credentialed requests are needed. Leaving this on alongside "*" is also
    # something browsers reject outright.
    allow_credentials=False,
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
# The dashboard is a React app built by Vite into frontend/dist. Everything here
# is registered last so /api/* and /docs always win.

if DIST_DIR.exists():
    app.mount(
        "/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets"
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str) -> FileResponse:
        """
        Serve the single-page app for every non-API path.

        React Router owns /, /welcome and /dashboard on the client, so a hard
        refresh on any of them has to return index.html rather than a 404.
        """
        candidate = (DIST_DIR / full_path).resolve()
        # A request for a real file (favicon, icon, …) is served as itself; a
        # request for a *missing* file must 404 instead of silently returning
        # HTML, which would otherwise show up as a confusing parse error.
        if full_path and "." in Path(full_path).name:
            if candidate.is_file() and candidate.is_relative_to(DIST_DIR):
                return FileResponse(candidate)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return FileResponse(INDEX_FILE)

else:

    @app.get("/{full_path:path}", include_in_schema=False)
    async def build_missing(full_path: str) -> HTMLResponse:
        """The API works, but nobody built the frontend yet — say so plainly."""
        logger.warning("frontend/dist is missing — run `npm run build` in frontend/")
        return HTMLResponse(BUILD_MISSING_PAGE, status_code=503)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
