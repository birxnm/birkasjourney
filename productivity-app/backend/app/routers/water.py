from datetime import date as Date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import WaterLog

router = APIRouter(prefix="/api/water", tags=["water"])

GOAL_ML = 2000


def _day_total(session: Session, d: Date) -> int:
    rows = session.exec(select(WaterLog).where(WaterLog.date == d)).all()
    return sum(r.ml for r in rows)


@router.get("")
def today_water(session: Session = Depends(get_session), date: Date | None = None):
    d = date or Date.today()
    total = _day_total(session, d)
    return {"date": d.isoformat(), "total_ml": total, "goal_ml": GOAL_ML, "reached": total >= GOAL_ML}


@router.post("/add")
def add_water(ml: int = 250, date: Date | None = None, session: Session = Depends(get_session)):
    d = date or Date.today()
    session.add(WaterLog(date=d, ml=ml))
    session.commit()
    return today_water(session=session, date=d)


@router.post("/reset")
def reset_water(date: Date | None = None, session: Session = Depends(get_session)):
    d = date or Date.today()
    for r in session.exec(select(WaterLog).where(WaterLog.date == d)).all():
        session.delete(r)
    session.commit()
    return today_water(session=session, date=d)


@router.get("/streak")
def streak(session: Session = Depends(get_session)):
    d = Date.today()
    count = 0
    while True:
        if _day_total(session, d) >= GOAL_ML:
            count += 1
            d -= timedelta(days=1)
        else:
            break
    return {"streak": count}
