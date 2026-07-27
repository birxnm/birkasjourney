from datetime import date as Date, datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import SleepLog

router = APIRouter(prefix="/api/sleep", tags=["sleep"])


def _compute_hours(bedtime: str, wake_time: str) -> float:
    bt = datetime.strptime(bedtime, "%H:%M")
    wt = datetime.strptime(wake_time, "%H:%M")
    diff = (wt - bt).total_seconds() / 3600
    if diff <= 0:  # slept past midnight
        diff += 24
    return round(diff, 1)


@router.get("")
def list_sleep(session: Session = Depends(get_session), limit: int = 30):
    rows = session.exec(select(SleepLog).order_by(SleepLog.date.desc()).limit(limit)).all()
    return list(reversed(rows))


@router.get("/today")
def today_sleep(session: Session = Depends(get_session), date: Date | None = None):
    d = date or Date.today()
    row = session.exec(select(SleepLog).where(SleepLog.date == d)).first()
    return row


@router.post("")
def log_sleep(
    bedtime: str,
    wake_time: str,
    quality: int = 3,
    date: Date | None = None,
    session: Session = Depends(get_session),
):
    d = date or Date.today()
    hours = _compute_hours(bedtime, wake_time)
    existing = session.exec(select(SleepLog).where(SleepLog.date == d)).first()
    if existing:
        existing.bedtime = bedtime
        existing.wake_time = wake_time
        existing.quality = quality
        existing.hours = hours
        session.add(existing)
    else:
        session.add(SleepLog(date=d, bedtime=bedtime, wake_time=wake_time, quality=quality, hours=hours))
    session.commit()
    return {"date": d.isoformat(), "hours": hours}
