from datetime import date as Date

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import ContentSession, SleepLog, StudyTask
from ..seed import EXAM_DATE
from . import habits, water

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(session: Session = Depends(get_session), date: Date | None = None):
    today = date or Date.today()

    # IELTS study tasks today
    tasks = session.exec(select(StudyTask).where(StudyTask.date == today)).all()
    tasks_done = sum(1 for t in tasks if t.done)

    # Water
    water_summary = water.today_water(session=session, date=today)

    # Habits (this week)
    habits_summary = habits.week_summary(session=session, today=today)

    # Sleep today
    sleep_row = session.exec(select(SleepLog).where(SleepLog.date == today)).first()

    # Content today
    content_today = session.exec(
        select(ContentSession).where(ContentSession.date == today)
    ).all()

    days_left = (EXAM_DATE - today).days

    return {
        "date": today.isoformat(),
        "exam_date": EXAM_DATE.isoformat(),
        "days_to_exam": days_left,
        "ielts_tasks": {
            "total": len(tasks),
            "done": tasks_done,
            "items": tasks,
        },
        "water": water_summary,
        "habits": habits_summary["habits"],
        "sleep": sleep_row,
        "content_today": {
            "count": len(content_today),
            "minutes": sum(c.minutes for c in content_today),
        },
    }
