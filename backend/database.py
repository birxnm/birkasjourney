"""
database.py — SQLite access layer using aiosqlite.

Contains ONLY parameterized SQL. No Telegram objects, no business logic.
Every user-data query includes WHERE user_id = ? for isolation.
"""

import aiosqlite
import logging
from datetime import date, datetime
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


async def get_db() -> aiosqlite.Connection:
    """Get a database connection."""
    db = await aiosqlite.connect(settings.DB_FULL_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db() -> None:
    """Create all tables if they don't exist."""
    db = await get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id     INTEGER UNIQUE,
                username        TEXT,
                email           TEXT UNIQUE,
                password_hash   TEXT,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS habits (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                name            TEXT NOT NULL UNIQUE,
                display_name    TEXT NOT NULL,
                target_value    REAL,
                unit            TEXT,
                icon            TEXT,
                sort_order      INTEGER DEFAULT 0,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS habit_logs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER NOT NULL,
                habit_id        INTEGER NOT NULL,
                log_date        DATE NOT NULL,
                value           REAL NOT NULL,
                is_completed    BOOLEAN NOT NULL DEFAULT 0,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (habit_id) REFERENCES habits(id),
                UNIQUE(user_id, habit_id, log_date)
            );

            CREATE TABLE IF NOT EXISTS reminders (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER NOT NULL,
                habit_id        INTEGER,
                message         TEXT NOT NULL,
                remind_at       TEXT NOT NULL,
                is_active       BOOLEAN NOT NULL DEFAULT 1,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (habit_id) REFERENCES habits(id)
            );

            CREATE TABLE IF NOT EXISTS quotes (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                text            TEXT NOT NULL,
                author          TEXT NOT NULL,
                category        TEXT DEFAULT 'general'
            );

            CREATE TABLE IF NOT EXISTS daily_quotes (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER NOT NULL,
                quote_id        INTEGER NOT NULL,
                assigned_date   DATE NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (quote_id) REFERENCES quotes(id),
                UNIQUE(user_id, quote_id, assigned_date)
            );
        """)
        await db.commit()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize database: %s", e)
        raise
    finally:
        await db.close()


async def seed_habits() -> None:
    """Seed default habit definitions if not already present."""
    habits = [
        ("water", "Water Intake", 2.0, "litres", "💧", 1),
        ("steps", "Daily Steps", 10000, "steps", "🚶", 2),
        ("sleep", "Bedtime", 22.5, "time", "🌙", 3),  # 22:30 as decimal
        ("wake", "Wake Up", 5.0, "time", "⏰", 4),  # 5:00 as decimal
        ("ielts", "IELTS Prep", 60, "minutes", "📚", 5),
        ("it_projects", "IT Projects", 1, "count", "💻", 6),
    ]
    db = await get_db()
    try:
        for name, display_name, target, unit, icon, order in habits:
            await db.execute(
                """INSERT OR IGNORE INTO habits (name, display_name, target_value, unit, icon, sort_order)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (name, display_name, target, unit, icon, order),
            )
        await db.commit()
        logger.info("Default habits seeded")
    except Exception as e:
        logger.error("Failed to seed habits: %s", e)
        raise
    finally:
        await db.close()


# ─── User Operations ────────────────────────────────────────────────────────

async def create_user(
    telegram_id: Optional[int] = None,
    username: Optional[str] = None,
    email: Optional[str] = None,
    password_hash: Optional[str] = None,
) -> int:
    """Create a new user and return their ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO users (telegram_id, username, email, password_hash)
               VALUES (?, ?, ?, ?)""",
            (telegram_id, username, email, password_hash),
        )
        await db.commit()
        return cursor.lastrowid
    except aiosqlite.IntegrityError as e:
        logger.warning("User creation integrity error: %s", e)
        raise
    finally:
        await db.close()


async def get_user_by_telegram_id(telegram_id: int) -> Optional[dict]:
    """Find a user by their Telegram ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM users WHERE telegram_id = ?", (telegram_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_user_by_email(email: str) -> Optional[dict]:
    """Find a user by their email."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_user_by_id(user_id: int) -> Optional[dict]:
    """Find a user by their internal ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def link_telegram_to_user(user_id: int, telegram_id: int) -> bool:
    """Link a Telegram account to an existing web user."""
    db = await get_db()
    try:
        await db.execute(
            "UPDATE users SET telegram_id = ? WHERE id = ?",
            (telegram_id, user_id),
        )
        await db.commit()
        return True
    except aiosqlite.IntegrityError:
        return False
    finally:
        await db.close()


# ─── Habit Operations ────────────────────────────────────────────────────────

async def get_all_habits() -> list[dict]:
    """Get all habit definitions."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM habits ORDER BY sort_order"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def get_habit_by_name(name: str) -> Optional[dict]:
    """Get a habit definition by its name."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM habits WHERE name = ?", (name,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def log_habit(user_id: int, habit_id: int, log_date: str, value: float, is_completed: bool) -> int:
    """Log or update a habit entry for a user on a specific date."""
    db = await get_db()
    try:
        # Upsert: insert or update if exists
        cursor = await db.execute(
            """INSERT INTO habit_logs (user_id, habit_id, log_date, value, is_completed, updated_at)
               VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(user_id, habit_id, log_date)
               DO UPDATE SET value = ?, is_completed = ?, updated_at = CURRENT_TIMESTAMP""",
            (user_id, habit_id, log_date, value, is_completed, value, is_completed),
        )
        await db.commit()
        return cursor.lastrowid
    except Exception as e:
        logger.error("Failed to log habit: %s", e)
        raise
    finally:
        await db.close()


async def get_today_logs(user_id: int, log_date: str) -> list[dict]:
    """Get all habit logs for a user on a specific date, joined with habit info."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT h.id as habit_id, h.name, h.display_name, h.target_value,
                      h.unit, h.icon, h.sort_order,
                      hl.value, hl.is_completed, hl.log_date
               FROM habits h
               LEFT JOIN habit_logs hl ON h.id = hl.habit_id
                   AND hl.user_id = ? AND hl.log_date = ?
               ORDER BY h.sort_order""",
            (user_id, log_date),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def delete_habit_log(user_id: int, habit_id: int, log_date: str) -> bool:
    """Delete a habit log entry (only if owned by the user)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM habit_logs WHERE user_id = ? AND habit_id = ? AND log_date = ?",
            (user_id, habit_id, log_date),
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def get_total_logs(user_id: int) -> int:
    """Count all habit log entries belonging to a user."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT COUNT(*) FROM habit_logs WHERE user_id = ?", (user_id,)
        )
        row = await cursor.fetchone()
        return row[0] if row else 0
    finally:
        await db.close()


async def get_habit_history(user_id: int, days: int = 7) -> list[dict]:
    """Get habit log history for the last N days for charts."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT h.name, h.display_name, h.target_value, h.icon,
                      hl.log_date, hl.value, hl.is_completed
               FROM habit_logs hl
               JOIN habits h ON hl.habit_id = h.id
               WHERE hl.user_id = ?
                 AND hl.log_date >= date('now', ?)
               ORDER BY hl.log_date, h.sort_order""",
            (user_id, f"-{days} days"),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


# ─── Reminder Operations ─────────────────────────────────────────────────────

async def create_reminder(
    user_id: int, message: str, remind_at: str, habit_id: Optional[int] = None
) -> int:
    """Create a new reminder for a user."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO reminders (user_id, habit_id, message, remind_at)
               VALUES (?, ?, ?, ?)""",
            (user_id, habit_id, message, remind_at),
        )
        await db.commit()
        return cursor.lastrowid
    except Exception as e:
        logger.error("Failed to create reminder: %s", e)
        raise
    finally:
        await db.close()


async def get_user_reminders(user_id: int) -> list[dict]:
    """Get all active reminders for a user."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT r.*, h.name as habit_name, h.icon as habit_icon
               FROM reminders r
               LEFT JOIN habits h ON r.habit_id = h.id
               WHERE r.user_id = ? AND r.is_active = 1
               ORDER BY r.remind_at""",
            (user_id,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def delete_reminder(user_id: int, reminder_id: int) -> bool:
    """Delete a reminder (only if owned by the user)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM reminders WHERE id = ? AND user_id = ?",
            (reminder_id, user_id),
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def get_active_reminders_at(time_str: str) -> list[dict]:
    """Get all active reminders that should fire at a specific time."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT r.*, u.telegram_id
               FROM reminders r
               JOIN users u ON r.user_id = u.id
               WHERE r.remind_at = ? AND r.is_active = 1 AND u.telegram_id IS NOT NULL""",
            (time_str,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


# ─── Quotes Operations ────────────────────────────────────────────────────────

async def seed_quotes(quotes: list[tuple[str, str, str]]) -> None:
    """Seed quotes into the database if empty."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT COUNT(*) FROM quotes")
        count = (await cursor.fetchone())[0]
        if count == 0:
            await db.executemany(
                "INSERT INTO quotes (text, author, category) VALUES (?, ?, ?)",
                quotes,
            )
            await db.commit()
            logger.info("Seeded %d quotes", len(quotes))
    finally:
        await db.close()


async def get_daily_quotes(user_id: int, today: str) -> list[dict]:
    """Get 3 daily quotes for a user. Assigns new ones if not yet assigned today."""
    db = await get_db()
    try:
        # Check if quotes are already assigned for today
        cursor = await db.execute(
            """SELECT q.text, q.author, q.category
               FROM daily_quotes dq
               JOIN quotes q ON dq.quote_id = q.id
               WHERE dq.user_id = ? AND dq.assigned_date = ?""",
            (user_id, today),
        )
        rows = await cursor.fetchall()
        if rows:
            return [dict(row) for row in rows]

        # Assign 3 random quotes for today
        cursor = await db.execute(
            "SELECT id FROM quotes ORDER BY RANDOM() LIMIT 3"
        )
        quote_ids = await cursor.fetchall()

        for row in quote_ids:
            await db.execute(
                """INSERT OR IGNORE INTO daily_quotes (user_id, quote_id, assigned_date)
                   VALUES (?, ?, ?)""",
                (user_id, row[0], today),
            )
        await db.commit()

        # Fetch the assigned quotes
        cursor = await db.execute(
            """SELECT q.text, q.author, q.category
               FROM daily_quotes dq
               JOIN quotes q ON dq.quote_id = q.id
               WHERE dq.user_id = ? AND dq.assigned_date = ?""",
            (user_id, today),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


# ─── Stats Operations ─────────────────────────────────────────────────────────

async def get_streak(user_id: int) -> int:
    """Calculate the current daily completion streak."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT DISTINCT log_date FROM habit_logs
               WHERE user_id = ? AND is_completed = 1
               ORDER BY log_date DESC""",
            (user_id,),
        )
        rows = await cursor.fetchall()
        if not rows:
            return 0

        streak = 0
        today = date.today()
        for row in rows:
            expected = today - __import__("datetime").timedelta(days=streak)
            log_d = date.fromisoformat(row[0]) if isinstance(row[0], str) else row[0]
            if log_d == expected:
                streak += 1
            else:
                break
        return streak
    finally:
        await db.close()


async def get_completion_rate(user_id: int, days: int = 7) -> float:
    """Get the completion rate over the last N days."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT
                 COUNT(*) as total,
                 SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
               FROM habit_logs
               WHERE user_id = ? AND log_date >= date('now', ?)""",
            (user_id, f"-{days} days"),
        )
        row = await cursor.fetchone()
        total = row[0] if row[0] else 0
        completed = row[1] if row[1] else 0
        return round((completed / total * 100), 1) if total > 0 else 0.0
    finally:
        await db.close()
