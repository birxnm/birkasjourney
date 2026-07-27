from datetime import date as Date, datetime, timedelta
from statistics import pstdev

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


def _bedtime_minutes(hhmm: str) -> int:
    """Minutes on a continuous 'evening' scale so 23:30 and 00:30 sit close.
    Early-morning bedtimes (before noon) are shifted past midnight (+24h)."""
    h, m = map(int, hhmm.split(":"))
    total = h * 60 + m
    if h < 12:
        total += 24 * 60
    return total


def _wake_minutes(hhmm: str) -> int:
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m


def _hhmm(minutes: float) -> str:
    minutes = int(round(minutes)) % (24 * 60)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


@router.get("")
def list_sleep(session: Session = Depends(get_session), limit: int = 30):
    rows = session.exec(select(SleepLog).order_by(SleepLog.date.desc()).limit(limit)).all()
    return list(reversed(rows))


@router.get("/stats")
def sleep_stats(session: Session = Depends(get_session), date: Date | None = None, days: int = 7):
    """Weekly average hours + a 0-100 consistency score for the last `days` nights.

    Consistency rewards going to bed and waking at similar times. It is derived
    from the spread (population std-dev) of bedtimes and wake times: less spread
    → higher score. Needs at least 2 nights to be meaningful.
    """
    end = date or Date.today()
    start = end - timedelta(days=days - 1)
    rows = session.exec(
        select(SleepLog).where(SleepLog.date >= start, SleepLog.date <= end)
    ).all()

    nights = len(rows)
    if nights == 0:
        return {
            "nights": 0,
            "avg_hours": None,
            "consistency_score": None,
            "consistency_label": "No data",
            "avg_bedtime": None,
            "avg_wake": None,
            "target_hours": 8,
        }

    avg_hours = round(sum(r.hours for r in rows) / nights, 1)
    bed = [_bedtime_minutes(r.bedtime) for r in rows]
    wake = [_wake_minutes(r.wake_time) for r in rows]

    if nights >= 2:
        spread = (pstdev(bed) + pstdev(wake)) / 2  # avg std-dev in minutes
        score = max(0, min(100, round(100 - spread / 1.5)))
        if score >= 85:
            label = "Excellent"
        elif score >= 70:
            label = "Good"
        elif score >= 50:
            label = "Fair"
        else:
            label = "Needs work"
    else:
        score = None
        label = "Log 2+ nights"

    return {
        "nights": nights,
        "avg_hours": avg_hours,
        "consistency_score": score,
        "consistency_label": label,
        "avg_bedtime": _hhmm(sum(bed) / nights),
        "avg_wake": _hhmm(sum(wake) / nights),
        "target_hours": 8,
    }


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
