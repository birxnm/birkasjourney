from datetime import date as Date

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models import (
    ErrorLog,
    IeltsTarget,
    MockTest,
    SpeakingLog,
    StudyTask,
    WritingLog,
)

router = APIRouter(prefix="/api/ielts", tags=["ielts"])


def _round_half(x: float) -> float:
    return round(x * 2) / 2


# ---------- Targets ----------
@router.get("/targets")
def get_targets(session: Session = Depends(get_session)):
    return session.exec(select(IeltsTarget)).all()


@router.patch("/targets/{skill}")
def update_current(skill: str, current_band: float, session: Session = Depends(get_session)):
    row = session.exec(select(IeltsTarget).where(IeltsTarget.skill == skill)).first()
    if row:
        row.current_band = current_band
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


# ---------- Study tasks ----------
@router.get("/tasks")
def tasks_for_day(date: Date | None = None, session: Session = Depends(get_session)):
    d = date or Date.today()
    return session.exec(select(StudyTask).where(StudyTask.date == d)).all()


@router.post("/tasks/{task_id}/toggle")
def toggle_task(task_id: int, session: Session = Depends(get_session)):
    row = session.get(StudyTask, task_id)
    if row:
        row.done = not row.done
        session.add(row)
        session.commit()
    return row


# ---------- Writing ----------
@router.get("/writing")
def list_writing(session: Session = Depends(get_session), limit: int = 60):
    return session.exec(select(WritingLog).order_by(WritingLog.date.asc()).limit(limit)).all()


@router.post("/writing")
def add_writing(
    prompt: str,
    word_count: int = 0,
    minutes: int = 0,
    self_band: float = 0.0,
    notes: str = "",
    date: Date | None = None,
    session: Session = Depends(get_session),
):
    row = WritingLog(
        date=date or Date.today(),
        prompt=prompt,
        word_count=word_count,
        minutes=minutes,
        self_band=self_band,
        notes=notes,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# ---------- Speaking ----------
@router.get("/speaking")
def list_speaking(session: Session = Depends(get_session), limit: int = 60):
    return session.exec(select(SpeakingLog).order_by(SpeakingLog.date.asc()).limit(limit)).all()


@router.post("/speaking")
def add_speaking(
    topic: str,
    part: int = 2,
    minutes: int = 0,
    self_band: float = 0.0,
    notes: str = "",
    date: Date | None = None,
    session: Session = Depends(get_session),
):
    row = SpeakingLog(
        date=date or Date.today(),
        topic=topic,
        part=part,
        minutes=minutes,
        self_band=self_band,
        notes=notes,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


# ---------- Mock tests ----------
@router.get("/mocks")
def list_mocks(session: Session = Depends(get_session)):
    return session.exec(select(MockTest).order_by(MockTest.date.asc())).all()


@router.post("/mocks")
def add_mock(
    listening: float,
    reading: float,
    writing: float,
    speaking: float,
    date: Date | None = None,
    session: Session = Depends(get_session),
):
    overall = _round_half((listening + reading + writing + speaking) / 4)
    row = MockTest(
        date=date or Date.today(),
        listening=listening,
        reading=reading,
        writing=writing,
        speaking=speaking,
        overall=overall,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/mocks/{mock_id}")
def delete_mock(mock_id: int, session: Session = Depends(get_session)):
    row = session.get(MockTest, mock_id)
    if row:
        session.delete(row)
        session.commit()
    return {"deleted": mock_id}


# ---------- Error log ----------
@router.get("/errors")
def list_errors(session: Session = Depends(get_session)):
    return session.exec(select(ErrorLog).order_by(ErrorLog.date.desc())).all()


@router.post("/errors")
def add_error(category: str, note: str, date: Date | None = None, session: Session = Depends(get_session)):
    row = ErrorLog(date=date or Date.today(), category=category, note=note)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.post("/errors/{error_id}/resolve")
def resolve_error(error_id: int, session: Session = Depends(get_session)):
    row = session.get(ErrorLog, error_id)
    if row:
        row.resolved = not row.resolved
        session.add(row)
        session.commit()
    return row
