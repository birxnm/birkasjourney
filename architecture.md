# Architecture — reference build

Source: Lecture 6 (Vibecoding a Telegram TODO bot). This is the concrete "how" the agent
should follow. The MVP mirrors this design; the productivity extensions at the end are
optional and must not destabilize the core.

---

## Message path

```
Telegram  →  Bot API  →  aiogram  →  handler  →  service  →  database  →  SQLite
```

- **Bot API** is the HTTP interface; **aiogram** is the Python library over it.
- **Polling:** the bot regularly asks Bot API for new messages.
- **handler** parses/validates, **service** applies rules, **database** runs SQL only.

Never collapse these layers into one function.

## Module map

| File               | Role                                          |
|--------------------|-----------------------------------------------|
| `main.py`          | Startup: load config, ensure tables, poll     |
| `config.py`        | Settings from env (`BOT_TOKEN`, DB path)      |
| `database.py`      | SQLite access, parameterized SQL              |
| `services.py`      | Rules: validation, ownership, formatting      |
| `handlers.py`      | Command handlers (`/start`, `/add`, …)        |
| `keyboards.py`     | Buttons / menus                               |
| `integrations.py`  | *(optional)* external API client(s)           |
| `requirements.txt` | Dependencies                                  |
| `.env` / `.env.example` | Secrets / template                       |

## Startup sequence (main.py)

1. Load settings — `.env` and `BOT_TOKEN` available from the environment.
2. Open the SQLite database file in the project.
3. Create `users` and `tasks` tables if they don't exist.
4. Start polling.

---

## Data model

One user has many tasks. Each task stores its owner via `user_id`, so different users'
lists never mix.

```
users (1) ────< (many) tasks
  id                     id
  telegram_id            user_id  → owner (FK → users.id)
  username               title
  created_at             is_completed
                         created_at
                         completed_at
```

### Table `users` — one row per person, created on first contact

| Field         | Type     | Purpose                          |
|---------------|----------|----------------------------------|
| `id`          | INTEGER  | Internal user id (primary key)   |
| `telegram_id` | INTEGER  | Unique Telegram id               |
| `username`    | TEXT     | Telegram username, if any        |
| `created_at`  | DATETIME | Time of first contact            |

```sql
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL UNIQUE,
  username    TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

`telegram_id` is `UNIQUE` so one Telegram account can't create two local users. In bot
logic `telegram_id` is the external key to a user; `id` is the internal table key.

### Table `tasks` — one row per task, owned via `user_id`

| Field          | Type     | Purpose                         |
|----------------|----------|---------------------------------|
| `id`           | INTEGER  | Task id (primary key)           |
| `user_id`      | INTEGER  | Owner (foreign key → users.id)  |
| `title`        | TEXT     | Task text                       |
| `is_completed` | BOOLEAN  | Completion flag                 |
| `created_at`   | DATETIME | Created time                    |
| `completed_at` | DATETIME | Completed time, or NULL         |

```sql
CREATE TABLE tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  title        TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

`title NOT NULL` enforces non-empty at the schema level, but the handler still needs a
clear check on user input.

### No data duplication

`users` stores the person once; `tasks` stores task data plus the `user_id` reference
only — `username` is never copied into `tasks`.

---

## Two different guarantees (don't confuse them)

- **`FOREIGN KEY`** confirms the referenced user exists. It does **not** filter other
  users' rows.
- **`WHERE user_id = ?`** is what isolates a user's data.

Every read of task data uses a parameterized, owner-scoped query:

```sql
SELECT id, title, is_completed
FROM tasks
WHERE user_id = ?
ORDER BY is_completed, created_at;
```

The value is passed separately from the SQL (parameterized), never interpolated.

---

## MVP commands

| Command            | Behavior                                              |
|--------------------|-------------------------------------------------------|
| `/start`           | Greeting + short instructions; create the user row on first contact |
| `/add <text>`      | Read text → validate non-empty → resolve `user_id` from `telegram_id` → save |
| `/list`            | Owner-filtered, numbered list with status (✓ done, ○ pending); friendly message when empty |
| `/done <n>`        | Parse `n` → check it's a number → find task by `id` + `user_id` → update status + time |
| `/delete <n>`      | Parse `n` → validate → find by `id` + `user_id` → delete → confirm |

Per-command flow (same shape for `/done` and `/delete`):

```
read number → validate it's a number → find by id + user_id → apply change
```

The number from a command must never reach a task that belongs to another user.

---

## Productivity extensions (optional, after the MVP is stable)

These turn the TODO example into a project-preparation tool. Add them one at a time,
each behind Plan Mode, and keep the base commands working.

- **`projects` table** (`id`, `user_id`, `name`, `created_at`) and `tasks.project_id`
  (FK). Gives three related tables and lets tasks be grouped per project.
- **`tasks.due_date`** + a `/due <n> <date>` command, with date-format validation.
- **`tasks.priority`** (e.g. low/med/high) + sorting in `/list`.
- **Buttons/menus** via `keyboards.py` (inline keyboards) instead of typed commands —
  this is a rubric bonus (§14).
- **One external API** in `integrations.py`: for a productivity angle, an LLM API to
  parse a free-text line into a structured task fits your AI/ML background; a reminder or
  calendar feed also works. Handle its network and empty-response errors like any other.

Keep each extension minimal and covered by the QA checklist before moving on.
