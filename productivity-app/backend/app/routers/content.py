from datetime import date as Date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import ContentSession

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("")
def list_sessions(session: Session = Depends(get_session), limit: int = 30):
    rows = session.exec(select(ContentSession).order_by(ContentSession.date.desc()).limit(limit)).all()
    return rows


@router.post("")
def add_session(
    platform: str,
    description: str = "",
    minutes: int = 0,
    date: Date | None = None,
    session: Session = Depends(get_session),
):
    d = date or Date.today()
    row = ContentSession(date=d, platform=platform, description=description, minutes=minutes)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/{session_id}")
def delete_session(session_id: int, session: Session = Depends(get_session)):
    row = session.get(ContentSession, session_id)
    if row:
        session.delete(row)
        session.commit()
    return {"deleted": session_id}


@router.get("/streak")
def streak(session: Session = Depends(get_session)):
    dates = {r.date for r in session.exec(select(ContentSession)).all()}
    d = Date.today()
    count = 0
    while d in dates:
        count += 1
        d -= timedelta(days=1)
    return {"streak": count}
