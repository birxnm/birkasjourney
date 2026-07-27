from datetime import date as Date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import HabitCheckin

router = APIRouter(prefix="/api/habits", tags=["habits"])

WEEKLY_TARGET = {"gym": 3, "pilates": 2}


def _week_start(d: Date) -> Date:
    return d - timedelta(days=d.weekday())


@router.get("")
def week_summary(session: Session = Depends(get_session), today: Date | None = None):
    today = today or Date.today()
    start = _week_start(today)
    rows = session.exec(
        select(HabitCheckin).where(HabitCheckin.date >= start, HabitCheckin.date <= today)
    ).all()
    out = {}
    for htype, target in WEEKLY_TARGET.items():
        done_dates = sorted({r.date.isoformat() for r in rows if r.type == htype and r.done})
        out[htype] = {"target": target, "done": len(done_dates), "dates": done_dates}
    return {"week_start": start.isoformat(), "habits": out}


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
