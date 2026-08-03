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
from models import (
    HabitCreate,
    HabitCreatedResponse,
    HabitDefinition,
    HabitLogRequest,
    HabitLogResponse,
    HabitUpdate,
    StatsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.get("", response_model=list[HabitDefinition])
async def list_habits(
    user_id: int = Depends(get_current_user_id),
) -> list[HabitDefinition]:
    """The built-in habits plus the ones this user created."""
    habits = await db.get_all_habits(user_id)
    return [
        HabitDefinition(**h, is_custom=h["user_id"] is not None) for h in habits
    ]


@router.post("", response_model=HabitCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    payload: HabitCreate, user_id: int = Depends(get_current_user_id)
) -> HabitCreatedResponse:
    """Create a habit owned by this user, optionally with a daily reminder."""
    try:
        habit = await services.create_habit_for_user(
            user_id=user_id,
            display_name=payload.display_name,
            icon=payload.icon,
            color=payload.color,
            category=payload.category,
            target_days=payload.target_days,
            notes=payload.notes,
            reminder_time=payload.reminder_time,
        )
    except ValueError as e:
        # User error: blank name, bad target, or a name they already use
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Failed to create habit for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save that habit. Please try again.",
        )
    return HabitCreatedResponse(**habit)


@router.patch("/{habit_id}", response_model=HabitDefinition)
async def update_habit(
    habit_id: int,
    payload: HabitUpdate,
    user_id: int = Depends(get_current_user_id),
) -> HabitDefinition:
    """Edit a habit this user owns. Built-in habits cannot be edited."""
    try:
        habit = await services.update_habit_for_user(
            user_id, habit_id, payload.model_dump(exclude_unset=True)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error("Failed to update habit %s for user %s: %s", habit_id, user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update that habit. Please try again.",
        )
    return HabitDefinition(**habit)


@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: int, user_id: int = Depends(get_current_user_id)
) -> dict:
    """
    Delete a habit this user owns, with its logs and reminders.

    A built-in habit has no owner, so it can never match and is never deleted.
    """
    try:
        await services.delete_habit_for_user(user_id, habit_id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error("Failed to delete habit %s for user %s: %s", habit_id, user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete that habit. Please try again.",
        )
    return {"deleted": True, "id": habit_id}


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
    habit = await db.get_habit_by_name(habit_name.lower().strip(), user_id)
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
