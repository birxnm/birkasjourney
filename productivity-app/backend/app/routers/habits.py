from datetime import date as Date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import Habit, HabitCheckin

router = APIRouter(prefix="/api/habits", tags=["habits"])


def _week_start(d: Date) -> Date:
    return d - timedelta(days=d.weekday())


@router.get("")
def week_summary(session: Session = Depends(get_session), today: Date | None = None):
    today = today or Date.today()
    start = _week_start(today)
    checkins = session.exec(
        select(HabitCheckin).where(HabitCheckin.date >= start, HabitCheckin.date <= today)
    ).all()
    habits = session.exec(select(Habit)).all()
    out = {}
    for h in habits:
        done_dates = sorted({c.date.isoformat() for c in checkins if c.type == h.name and c.done})
        out[h.name] = {
            "emoji": h.emoji,
            "target": h.weekly_target,
            "done": len(done_dates),
            "dates": done_dates,
        }
    return {"week_start": start.isoformat(), "habits": out}


@router.post("")
def add_habit(
    name: str,
    emoji: str = "✅",
    weekly_target: int = 3,
    session: Session = Depends(get_session),
):
    name = name.strip().lower()
    existing = session.exec(select(Habit).where(Habit.name == name)).first()
    if existing:
        existing.emoji = emoji
        existing.weekly_target = weekly_target
        session.add(existing)
    else:
        session.add(Habit(name=name, emoji=emoji, weekly_target=weekly_target))
    session.commit()
    return week_summary(session=session)


@router.delete("/{name}")
def delete_habit(name: str, session: Session = Depends(get_session)):
    h = session.exec(select(Habit).where(Habit.name == name)).first()
    if h:
        session.delete(h)
        for c in session.exec(select(HabitCheckin).where(HabitCheckin.type == name)).all():
            session.delete(c)
        session.commit()
    return {"deleted": name}


@router.post("/toggle")
def toggle(type: str, date: Date | None = None, session: Session = Depends(get_session)):
    d = date or Date.today()
    existing = session.exec(
        select(HabitCheckin).where(HabitCheckin.type == type, HabitCheckin.date == d)
    ).first()
    if existing:
        session.delete(existing)
        session.commit()
        return {"type": type, "date": d.isoformat(), "done": False}
    row = HabitCheckin(type=type, date=d, done=True)
    session.add(row)
    session.commit()
    return {"type": type, "date": d.isoformat(), "done": True}
