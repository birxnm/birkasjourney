# Architecture — Birka's Journey

A daily habit tracker with **two front ends over one backend**: a Telegram bot for
logging on the move, and a web dashboard for reviewing progress. Both read and write
the same SQLite database, so an entry made in Telegram appears on the dashboard and
vice versa.

The layering rule from Lecture 6 still holds — the only change is that there are now
two entry points into the service layer instead of one.

---

## Message path

```
Telegram  →  Bot API  →  aiogram  →  bot/handlers.py  ─┐
                                                       ├→  services.py  →  database.py  →  SQLite
Browser   →  fetch()  →  FastAPI  →  routers/*.py    ─┘   (rules)         (SQL only)
```

- **Bot API** is the HTTP interface; **aiogram** is the Python library over it.
- **Polling:** the bot repeatedly asks Bot API for new updates. This is the project's
  required network call — see *Networking* below.
- **handlers / routers** parse and validate input, **services** apply the rules,
  **database** runs parameterized SQL only.

Handlers never contain SQL. `database.py` never imports aiogram or FastAPI.

Both front ends run in **one process**: `uvicorn main:app` starts the web API, and the
FastAPI lifespan starts bot polling and the reminder scheduler as asyncio tasks.

## Module map

| File                          | Role                                                        |
|-------------------------------|-------------------------------------------------------------|
| `backend/main.py`             | FastAPI app; lifespan starts DB, seeds, bot, scheduler      |
| `backend/config.py`           | Settings from env (`BOT_TOKEN`, DB path, JWT secret, TZ)    |
| `backend/database.py`         | SQLite access via aiosqlite, parameterized SQL only         |
| `backend/services.py`         | Rules: validation, progress maths, formatting               |
| `backend/models.py`           | Pydantic request/response schemas (web input validation)    |
| `backend/auth.py`             | Password hashing, JWT issue/verify, one-time link codes     |
| `backend/scheduler.py`        | Minute loop that pushes due reminders through the bot       |
| `backend/quotes_data.py`      | 107 curated quotes, seeded on first run                     |
| `backend/routers/*.py`        | REST endpoints: auth, habits, quotes, reminders             |
| `backend/bot/handlers.py`     | Telegram commands and callback buttons                      |
| `backend/bot/keyboards.py`    | Inline keyboards for one-tap logging                        |
| `backend/bot/bot_services.py` | Command parsing and Telegram message formatting             |
| `backend/bot/runner.py`       | Bot lifecycle: build, poll, shut down                       |
| `backend/tests/`              | API and bot test scripts                                    |
| `frontend/`                   | Static dashboard (HTML/CSS/vanilla JS + Chart.js)           |
| `backend/requirements.txt`    | Pinned dependencies                                         |
| `backend/.env` / `.env.example` | Secrets / template                                        |

## Startup sequence (`main.py` lifespan)

1. Load settings from `backend/.env`; warn (don't crash) if `BOT_TOKEN` is missing.
2. Create the six tables if they don't exist.
3. Seed the six habit definitions (`INSERT OR IGNORE`, so restarts are safe).
4. Seed the quotes, but only if the `quotes` table is empty.
5. If `BOT_TOKEN` is set: start bot polling and the reminder scheduler as background
   tasks. Without a token the web API still serves — the bot is simply disabled.
6. On shutdown: cancel the scheduler, stop polling, close the bot's HTTP session.

---

## The six tracked habits

| Habit         | DB name       | Target  | Unit    | Met when      |
|---------------|---------------|---------|---------|---------------|
| 💧 Water      | `water`       | 2.0     | litres  | value ≥ target |
| 🚶 Steps      | `steps`       | 10000   | steps   | value ≥ target |
| 🌙 Bedtime    | `sleep`       | 22:30   | time    | value ≤ target |
| ⏰ Wake up    | `wake`        | 05:00   | time    | value ≤ target |
| 📚 IELTS prep | `ielts`       | 60      | minutes | value ≥ target |
| 💻 IT projects| `it_projects` | 1       | count   | value ≥ target |

The two time habits are stored as **decimal hours** (22:30 → 22.5) so they can be
compared and averaged with ordinary arithmetic. `services.time_str_to_decimal` and
`decimal_to_time_str` are the only places that conversion happens on the backend;
`frontend/js/habits.js` mirrors it for the browser.

---

## Data model

Six tables. `users` is the hub: habit logs, reminders, and daily quote assignments all
reference it, and every query on those tables filters by `user_id`.

```
                    ┌──────────────┐
                    │    users     │
                    │ id (PK)      │
                    │ telegram_id  │ UNIQUE
                    │ email        │ UNIQUE
                    │ password_hash│
                    └──┬────┬────┬─┘
        ┌──────────────┘    │    └──────────────┐
        │                   │                   │
┌───────▼──────┐    ┌───────▼──────┐    ┌───────▼───────┐
│  habit_logs  │    │  reminders   │    │ daily_quotes  │
│ user_id  FK  │    │ user_id  FK  │    │ user_id   FK  │
│ habit_id FK ─┼──┐ │ habit_id FK ─┼──┐ │ quote_id  FK ─┼──┐
│ log_date     │  │ │ remind_at    │  │ │ assigned_date │  │
│ value        │  │ │ message      │  │ └───────────────┘  │
│ is_completed │  │ │ is_active    │  │                    │
└──────────────┘  │ └──────────────┘  │              ┌─────▼─────┐
                  │                   │              │  quotes   │
                  └────►┌──────────┐◄─┘              │ id (PK)   │
                        │  habits  │                 │ text      │
                        │ id (PK)  │                 │ author    │
                        │ name UQ  │                 │ category  │
                        │ target   │                 └───────────┘
                        └──────────┘
```

`habits` and `quotes` are **reference tables**: shared, seeded once, not user-owned.
The other three are **user-owned** and always queried with `WHERE user_id = ?`.

### `users` — one row per person

| Field           | Type     | Required | Purpose                                     |
|-----------------|----------|----------|---------------------------------------------|
| `id`            | INTEGER  | PK       | Internal user id                            |
| `telegram_id`   | INTEGER  | optional, UNIQUE | Telegram account, if the user has one |
| `username`      | TEXT     | optional | Display name                                |
| `email`         | TEXT     | optional, UNIQUE | Web login, if the user registered on the web |
| `password_hash` | TEXT     | optional | PBKDF2-SHA256, `salt:key` hex               |
| `created_at`    | DATETIME | default  | First contact                               |

A user can arrive from either side: `/start` in Telegram creates a row with only
`telegram_id`; web registration creates one with only `email` + `password_hash`.
`/link <code>` merges the two by writing `telegram_id` onto the web row. Both columns
are `UNIQUE`, so one Telegram account cannot be linked to two web accounts.

### `habits` — the six definitions (reference table)

| Field          | Type    | Required | Purpose                             |
|----------------|---------|----------|-------------------------------------|
| `id`           | INTEGER | PK       | Habit id                            |
| `name`         | TEXT    | NOT NULL, UNIQUE | Machine name (`water`, `sleep`, …) |
| `display_name` | TEXT    | NOT NULL | Label shown to the user             |
| `target_value` | REAL    | optional | Daily goal                          |
| `unit`         | TEXT    | optional | `litres`, `steps`, `time`, …        |
| `icon`         | TEXT    | optional | Emoji                               |
| `sort_order`   | INTEGER | default 0| Display order                       |

### `habit_logs` — one row per user, per habit, per day

| Field          | Type     | Required | Purpose                        |
|----------------|----------|----------|--------------------------------|
| `id`           | INTEGER  | PK       | Log id                         |
| `user_id`      | INTEGER  | NOT NULL, FK → users.id  | Owner          |
| `habit_id`     | INTEGER  | NOT NULL, FK → habits.id | Which habit    |
| `log_date`     | DATE     | NOT NULL | The day being logged           |
| `value`        | REAL     | NOT NULL | Recorded amount                |
| `is_completed` | BOOLEAN  | NOT NULL | Whether the target was met     |
| `created_at` / `updated_at` | DATETIME | default | Audit times      |

```sql
UNIQUE(user_id, habit_id, log_date)
```

That constraint is what makes re-logging safe: `log_habit` uses
`INSERT … ON CONFLICT(user_id, habit_id, log_date) DO UPDATE`, so logging water twice
in one day **overwrites** rather than creating a duplicate row.

### `reminders` — daily push notifications

| Field       | Type     | Required | Purpose                                |
|-------------|----------|----------|----------------------------------------|
| `id`        | INTEGER  | PK       | Reminder id                            |
| `user_id`   | INTEGER  | NOT NULL, FK → users.id | Owner                   |
| `habit_id`  | INTEGER  | optional, FK → habits.id | Related habit, if any  |
| `message`   | TEXT     | NOT NULL | What to send                           |
| `remind_at` | TEXT     | NOT NULL | `HH:MM`, local to `TIMEZONE`           |
| `is_active` | BOOLEAN  | NOT NULL, default 1 | Soft on/off switch          |

### `quotes` and `daily_quotes`

`quotes` holds the 107 seeded quotes (`text`, `author`, `category`). `daily_quotes`
assigns three of them to a user for a given date:

```sql
UNIQUE(user_id, quote_id, assigned_date)
```

The first call on a new day picks three at random and stores the assignment; every
later call that day returns the same three, so the bot and the dashboard agree.

### No data duplication

`users` stores the person once and `habits` stores each definition once. `habit_logs`
holds only the measurement plus two foreign keys — no habit name or target is copied
into it, and no username is copied anywhere.

---

## Two different guarantees (don't confuse them)

- **`FOREIGN KEY`** confirms the referenced row exists. It does **not** filter other
  users' rows.
- **`WHERE user_id = ?`** is what isolates a user's data.

Every read, update, and delete of user data is parameterized and owner-scoped:

```sql
SELECT h.name, hl.value, hl.is_completed
FROM habits h
LEFT JOIN habit_logs hl
       ON h.id = hl.habit_id AND hl.user_id = ? AND hl.log_date = ?
ORDER BY h.sort_order;
```

Deletes carry the owner in the same statement, so a guessed id fails at the SQL level
rather than relying on a Python check:

```sql
DELETE FROM reminders WHERE id = ? AND user_id = ?;
```

Values are always passed separately from the SQL — never interpolated into the string.

---

## Bot commands

| Command             | Behavior                                                          |
|---------------------|-------------------------------------------------------------------|
| `/start`            | Create the user row on first contact; greeting + inline main menu  |
| `/today`            | All six habits with values, progress bars, and percentages         |
| `/log <habit> <value>` | Parse and validate → resolve `user_id` → save; no args opens the button picker |
| `/quote`            | The three quotes assigned to this user today                       |
| `/remind <HH:MM> <text>` | Validate the time and message → save a daily reminder         |
| `/reminders`        | List this user's active reminders                                  |
| `/summary`          | Last 7 days: days-on-target and average per habit, plus the streak  |
| `/link <code>`      | Consume a one-time code and attach this Telegram account to a web user |
| `/help`             | Every command                                                      |

Per-command flow, same shape throughout:

```
read arguments → validate format → resolve user_id → apply rule → save → confirm
```

Inline buttons follow the same path: callback data carries `log:<habit>:<value>`, which
the handler validates before it ever reaches the service layer. A value from a command
or a button can never reach another user's row, because `user_id` is resolved from the
Telegram sender, never from user input.

---

## REST API

All `/api` routes except `/api/health` require `Authorization: Bearer <JWT>`. The
`user_id` comes from the token's `sub` claim — never from the request body — so a
client cannot ask for someone else's data.

| Method | Path                          | Purpose                              |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/auth/register`          | Create an account, return a JWT       |
| POST   | `/api/auth/login`             | Verify credentials, return a JWT      |
| GET    | `/api/auth/me`                | Current user profile                  |
| POST   | `/api/auth/link-code`         | Issue a 6-character, 5-minute code    |
| GET    | `/api/habits`                 | The six habit definitions             |
| GET    | `/api/habits/today`           | Today's progress for all habits       |
| POST   | `/api/habits/log`             | Record or overwrite an entry          |
| DELETE | `/api/habits/log/{habit}`     | Clear an entry for a date             |
| GET    | `/api/habits/history?days=N`  | Raw log rows for the charts           |
| GET    | `/api/habits/stats?days=N`    | Streak, completion rate, total logs   |
| GET    | `/api/quotes/daily`           | Today's three quotes                  |
| GET/POST/DELETE | `/api/reminders`     | List, create, delete reminders        |
| GET    | `/api/health`                 | Liveness probe (no auth)              |

Interactive docs are served at `/docs` while the app is running.

---

## Networking, validation, and error handling

**Networking.** Bot API polling is the required network call: aiogram sends a
long-poll request, the response is parsed into updates, and each is turned into a user
message. Network failures are caught in three places — `set_my_commands` at startup
(logged, app continues), the polling loop (logged, other handlers unaffected), and each
reminder send (logged per recipient, remaining sends continue). The browser's `fetch`
calls are wrapped in `api.js`, which turns a failed request into
*"Cannot reach the server…"* rather than a silent break, and tolerates empty or
malformed JSON bodies.

**Validation** happens before anything is persisted, at two levels:

- *Shape* — Pydantic (`models.py`) for the web: email regex, password length,
  `HH:MM` pattern, known habit names, non-negative values, ISO dates.
- *Range and rules* — `services.validate_habit_value` for both front ends: water
  0–20 L, steps 0–100 000, times 0–24 h, IELTS 0–1440 min, projects 0–50.

The bot adds a parsing layer (`bot_services.parse_log_command`) that rejects unknown
habits, non-numeric values, and times without `HH:MM` — each with a message that shows
the correct form.

**Error handling** covers the four required categories:

| Category    | Where it's handled                                                    |
|-------------|-----------------------------------------------------------------------|
| Network     | Bot polling, `set_my_commands`, reminder sends, `api.js` fetch wrapper |
| Database    | `try/finally` around every connection; integrity errors become 409s    |
| User        | Pydantic 422s, service `ValueError` → 400, unknown record → 404, `/help` fallback for unknown commands |
| Unexpected  | FastAPI global exception handler; per-handler `try/except` in the bot; the scheduler logs and keeps looping |

User-facing messages never contain a stack trace or raw exception text — the technical
detail goes to the log, and the user sees what happened and what to do next.

---

## Security

- Secrets (`BOT_TOKEN`, `JWT_SECRET`) come from `backend/.env`, which is git-ignored.
  `backend/.env.example` is committed with keys but no values.
- Passwords are hashed with PBKDF2-SHA256, 100 000 iterations, per-password random
  salt. Verification uses `hmac.compare_digest`.
- JWTs are HS256 and expire after `JWT_EXPIRATION_HOURS` (default 24). An expired token
  returns 401 and the dashboard sends the user back to log in.
- Link codes are single-use and expire after 5 minutes.
- All SQL is parameterized — no f-strings or concatenation anywhere in `database.py`.

---

## Out of MVP

Deliberately not built, and worth naming in the defense as known scope:

- Per-user habit targets and custom habits (targets are currently global).
- Editing a past day from the web UI (the API supports it; the UI logs today only).
- Reminder snooze / one-off reminders.
- Password reset and email verification.
- Multi-timezone support — the scheduler uses one configured `TIMEZONE` for everyone.
- A production CORS policy and HTTPS (the MVP runs locally with `allow_origins=["*"]`).
