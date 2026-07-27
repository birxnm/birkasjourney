from datetime import date as Date
from typing import Optional

from sqlmodel import Field, SQLModel


class IeltsTarget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    skill: str  # "listening" | "reading" | "writing" | "speaking"
    target_band: float
    current_band: float = 0.0


class StudyTask(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    skill: str  # listening | reading | writing | speaking
    title: str
    description: str = ""
    done: bool = False


class WritingLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    prompt: str
    word_count: int = 0
    minutes: int = 0
    self_band: float = 0.0
    notes: str = ""


class SpeakingLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    part: int = 2  # 1 | 2 | 3
    topic: str
    minutes: int = 0
    self_band: float = 0.0
    notes: str = ""


class MockTest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    listening: float
    reading: float
    writing: float
    speaking: float
    overall: float = 0.0


class ErrorLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    category: str  # grammar | vocab | collocation | linker
    note: str
    resolved: bool = False


class HabitCheckin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    type: str  # "gym" | "pilates"
    done: bool = True


class WaterLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    ml: int


class SleepLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True, unique=True)
    bedtime: str  # "23:30"
    wake_time: str  # "07:00"
    hours: float = 0.0
    quality: int = 3  # 1-5


class ContentSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Date = Field(index=True)
    platform: str
    description: str = ""
    minutes: int = 0
