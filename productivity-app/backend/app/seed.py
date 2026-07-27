"""Seed IELTS band targets and generate a study plan up to exam day.

Writing (target 7.0) and Speaking (target 8.0) are the focus, so they get the
most frequent tasks. Listening & Reading (target 9.0) get lighter maintenance.
"""
from datetime import date, timedelta

from sqlmodel import Session, select

from .models import Habit, IeltsTarget, Reminder, StudyTask

EXAM_DATE = date(2026, 8, 29)

TARGETS = [
    ("listening", 9.0),
    ("reading", 9.0),
    ("writing", 7.0),
    ("speaking", 8.0),
]

# Weekly template keyed by weekday (Mon=0 .. Sun=6).
# Each entry: (skill, title, description)
WEEKLY_PLAN = {
    0: [  # Monday
        ("writing", "Task 2 essay (opinion)", "Write a full 250+ word essay in 40 min. Focus on clear position + developed reasons."),
        ("speaking", "Speaking Part 2 cue card", "Record a 2-minute answer. Review fluency & lexical range."),
    ],
    1: [  # Tuesday
        ("reading", "Timed reading passage", "1 passage in 20 min to hold Band 9. Log any misread question types."),
        ("speaking", "Speaking Part 3 discussion", "Practice abstract follow-ups. Aim for extended, precise answers."),
        ("listening", "Listening Section 3-4", "One academic section, review missed answers."),
    ],
    2: [  # Wednesday
        ("writing", "Task 2 essay (discussion)", "Discuss both views + opinion, 40 min. Log linkers & collocations used."),
        ("speaking", "Speaking Part 1 rapid answers", "10 common topics, 30s each. Reduce hesitation."),
    ],
    3: [  # Thursday
        ("reading", "Timed reading passage", "1 passage in 20 min. Focus on matching-heading accuracy."),
        ("speaking", "Speaking Part 2 cue card", "New topic, record & self-score against Band 8 descriptors."),
        ("listening", "Listening Section 1-2", "One section, transcribe tricky spellings/numbers."),
    ],
    4: [  # Friday
        ("writing", "Task 2 essay (problem/solution)", "Full essay 40 min. Then rewrite one paragraph for band upgrade."),
        ("speaking", "Speaking Part 3 discussion", "Argue a position with examples. Record & review."),
    ],
    5: [  # Saturday
        ("writing", "Task 1 report", "Describe a chart/process in 20 min. Focus on overview + key trends."),
        ("listening", "Full listening test", "Timed 30-min test, log score toward Band 9."),
        ("speaking", "Speaking mock (full)", "Parts 1-3 recorded end-to-end, self-score."),
    ],
    6: [  # Sunday
        ("reading", "Full reading test", "Timed 60-min test, log score & error types."),
        ("writing", "Review week's essays", "Re-read your essays, fix recurring errors, extract 10 useful phrases."),
        ("speaking", "Vocabulary & pronunciation drill", "Shadow a native clip, note stress & intonation."),
    ],
}


def seed(session: Session, *, today: date | None = None, force: bool = False) -> dict:
    today = today or date.today()

    # --- Habits ---
    if not session.exec(select(Habit)).first():
        session.add(Habit(name="gym", emoji="🏋️", weekly_target=3))
        session.add(Habit(name="pilates", emoji="🧘", weekly_target=2))

    # --- Default reminders ---
    if not session.exec(select(Reminder)).first():
        session.add(Reminder(time="08:00", purpose="Drink water + morning routine", category="water"))
        session.add(Reminder(time="10:00", purpose="IELTS Writing / Speaking practice", category="ielts"))
        session.add(Reminder(time="20:00", purpose="Instagram unlocked — content creation time 🚀", category="content"))
        session.add(Reminder(time="23:00", purpose="Wind down — sleep on schedule", category="sleep"))

    # --- Targets ---
    existing_targets = session.exec(select(IeltsTarget)).all()
    if not existing_targets or force:
        if force:
            for t in existing_targets:
                session.delete(t)
        for skill, band in TARGETS:
            session.add(IeltsTarget(skill=skill, target_band=band))

    # --- Study tasks ---
    existing_tasks = session.exec(select(StudyTask)).first()
    created = 0
    if not existing_tasks or force:
        if force:
            for t in session.exec(select(StudyTask)).all():
                session.delete(t)
        cur = today
        while cur <= EXAM_DATE:
            for skill, title, desc in WEEKLY_PLAN[cur.weekday()]:
                session.add(StudyTask(date=cur, skill=skill, title=title, description=desc))
                created += 1
            cur += timedelta(days=1)

    session.commit()
    return {"tasks_created": created, "exam_date": EXAM_DATE.isoformat()}
