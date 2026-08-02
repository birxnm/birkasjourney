"""
quotes_router.py — Daily motivational quotes.

Each user gets three quotes assigned once per day; repeat calls on the same
day return the same three, so the dashboard and the bot stay in sync.
"""

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

import database as db
from auth import get_current_user_id
from models import QuoteResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quotes", tags=["quotes"])


@router.get("/daily", response_model=list[QuoteResponse])
async def daily(user_id: int = Depends(get_current_user_id)) -> list[QuoteResponse]:
    """Today's three quotes for the authenticated user."""
    try:
        quotes = await db.get_daily_quotes(user_id, date.today().isoformat())
    except Exception as e:
        logger.error("Failed to load daily quotes for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load your quotes right now. Please try again.",
        )

    if not quotes:
        # Empty response handled gracefully rather than returning a broken page
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quotes are available yet. Try again in a moment.",
        )
    return [QuoteResponse(**q) for q in quotes]
