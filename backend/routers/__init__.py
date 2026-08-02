"""routers — FastAPI route modules, one per resource."""

from routers.auth_router import router as auth_router
from routers.habits_router import router as habits_router
from routers.quotes_router import router as quotes_router
from routers.reminders_router import router as reminders_router

__all__ = ["auth_router", "habits_router", "quotes_router", "reminders_router"]
