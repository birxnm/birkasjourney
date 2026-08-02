"""
reminders_router.py — Create, list, and delete habit reminders.

Reminders are fired by scheduler.py through the Telegram bot, so a reminder is
only useful once the account is linked to Telegram.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

import database as db
from auth import get_current_user_id
from models import ReminderRequest, ReminderResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderResponse])
async def list_reminders(user_id: int = Depends(get_current_user_id)) -> list[ReminderResponse]:
    """All active reminders for the authenticated user."""
    rows = await db.get_user_reminders(user_id)
    return [
        ReminderResponse(
            id=r["id"],
            message=r["message"],
            remind_at=r["remind_at"],
            habit_name=r.get("habit_name"),
            habit_icon=r.get("habit_icon"),
            is_active=bool(r["is_active"]),
        )
        for r in rows
    ]


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create(
    payload: ReminderRequest, user_id: int = Depends(get_current_user_id)
) -> ReminderResponse:
    """Schedule a daily reminder at HH:MM, optionally tied to a habit."""
    habit_id = None
    habit_icon = None
    if payload.habit_name:
        habit = await db.get_habit_by_name(payload.habit_name.lower().strip())
        if not habit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown habit '{payload.habit_name}'.",
            )
        habit_id = habit["id"]
        habit_icon = habit["icon"]

    try:
        reminder_id = await db.create_reminder(
            user_id=user_id,
            message=payload.message.strip(),
            remind_at=payload.remind_at,
            habit_id=habit_id,
        )
    except Exception as e:
        logger.error("Failed to create reminder for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save that reminder. Please try again.",
        )

    return ReminderResponse(
        id=reminder_id,
        message=payload.message.strip(),
        remind_at=payload.remind_at,
        habit_name=payload.habit_name,
        habit_icon=habit_icon,
        is_active=True,
    )


@router.delete("/{reminder_id}")
async def delete(
    reminder_id: int, user_id: int = Depends(get_current_user_id)
) -> dict:
    """Delete a reminder. Ownership is enforced in the SQL, not just here."""
    deleted = await db.delete_reminder(user_id, reminder_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found.",
        )
    return {"deleted": True, "id": reminder_id}
