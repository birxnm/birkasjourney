from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import Reminder

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("")
def list_reminders(session: Session = Depends(get_session)):
    return session.exec(select(Reminder).order_by(Reminder.time.asc())).all()


@router.post("")
def add_reminder(
    time: str,
    purpose: str,
    category: str = "general",
    session: Session = Depends(get_session),
):
    row = Reminder(time=time, purpose=purpose, category=category, enabled=True)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.patch("/{reminder_id}")
def update_reminder(
    reminder_id: int,
    time: str | None = None,
    purpose: str | None = None,
    category: str | None = None,
    enabled: bool | None = None,
    session: Session = Depends(get_session),
):
    row = session.get(Reminder, reminder_id)
    if row:
        if time is not None:
            row.time = time
        if purpose is not None:
            row.purpose = purpose
        if category is not None:
            row.category = category
        if enabled is not None:
            row.enabled = enabled
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


@router.post("/{reminder_id}/toggle")
def toggle_reminder(reminder_id: int, session: Session = Depends(get_session)):
    row = session.get(Reminder, reminder_id)
    if row:
        row.enabled = not row.enabled
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int, session: Session = Depends(get_session)):
    row = session.get(Reminder, reminder_id)
    if row:
        session.delete(row)
        session.commit()
    return {"deleted": reminder_id}
