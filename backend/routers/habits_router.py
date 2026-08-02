"""
habits_router.py — Habit definitions, daily logging, history, and stats.

Every route resolves the user from the JWT and passes that user_id down,
so one account can never read or change another account's rows.
"""

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status

import database as db
import services
from auth import get_current_user_id
from models import HabitDefinition, HabitLogRequest, HabitLogResponse, StatsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("", response_model=list[HabitDefinition])
async def list_habits(_: int = Depends(get_current_user_id)) -> list[HabitDefinition]:
    """List the six tracked habit definitions."""
    habits = await db.get_all_habits()
    return [HabitDefinition(**h) for h in habits]


@router.get("/today", response_model=list[HabitLogResponse])
async def today(user_id: int = Depends(get_current_user_id)) -> list[HabitLogResponse]:
    """Today's progress for every habit — unlogged habits come back with value=None."""
    summary = await services.get_today_summary(user_id)
    return [HabitLogResponse(**h) for h in summary]


@router.post("/log", status_code=status.HTTP_201_CREATED)
async def log(payload: HabitLogRequest, user_id: int = Depends(get_current_user_id)) -> dict:
    """Record (or overwrite) a habit value for a date. Returns the computed progress."""
    try:
        return await services.log_habit_for_user(
            user_id=user_id,
            habit_name=payload.habit_name,
            value=payload.value,
            log_date=payload.log_date,
        )
    except ValueError as e:
        # User error: unknown habit or out-of-range value
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Failed to log habit for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save that entry. Please try again.",
        )


@router.delete("/log/{habit_name}", status_code=status.HTTP_200_OK)
async def delete_log(
    habit_name: str,
    log_date: str | None = Query(None, description="YYYY-MM-DD, defaults to today"),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    """Remove a habit entry for a date so it can be re-logged."""
    habit = await db.get_habit_by_name(habit_name.lower().strip())
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown habit '{habit_name}'.",
        )

    if log_date is None:
        log_date = date.today().isoformat()
    else:
        try:
            date.fromisoformat(log_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date must be in YYYY-MM-DD format.",
            )

    deleted = await db.delete_habit_log(user_id, habit["id"], log_date)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No entry for {habit['display_name']} on {log_date}.",
        )
    return {"deleted": True, "habit_name": habit["name"], "log_date": log_date}


@router.get("/history")
async def history(
    days: int = Query(7, ge=1, le=90),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    """Raw log rows for the last N days — the data behind the dashboard charts."""
    rows = await db.get_habit_history(user_id, days)
    return {"days": days, "logs": rows}


@router.get("/stats", response_model=StatsResponse)
async def stats(
    days: int = Query(7, ge=1, le=90),
    user_id: int = Depends(get_current_user_id),
) -> StatsResponse:
    """Streak, completion rate, and lifetime log count for the header cards."""
    return StatsResponse(
        streak=await db.get_streak(user_id),
        completion_rate=await db.get_completion_rate(user_id, days),
        total_logs=await db.get_total_logs(user_id),
    )
