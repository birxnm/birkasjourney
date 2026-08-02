# AGENTS.md — Telegram Productivity Bot

Rules for any AI coding agent (Cursor, Claude Code, Codex CLI, Windsurf) working in
this repository. These rules are **binding**. If a request conflicts with them, stop
and flag the conflict instead of silently breaking a rule.

This project is **Birka's Journey**, a personal habit tracker with two front ends over
one backend: a Telegram bot for logging on the move and a web dashboard for reviewing
progress. It is also my university final project, so it must satisfy the course rubric
in `requirements.md`. The reference engineering approach comes from Lecture 6
(Vibecoding a Telegram TODO bot); the built system is captured in `architecture.md`.

---

## 1. Non-negotiables (the project fails the course without these)

All of the following must be true in the finished project. Treat them as acceptance
criteria, not suggestions. Full mapping in `requirements.md`.

- **Networking:** at least one real network call, with responses handled and errors
  caught. The Telegram Bot API (via aiogram polling) already counts as this. Empty /
  malformed responses must be handled, not crash.
- **SQL storage:** an SQL database (SQLite) for persistent data. Data must survive an
  app restart. At least one table; we use six related tables — `users`, `habits`,
  `habit_logs`, `reminders`, `quotes`, `daily_quotes`.
- **≥ 5 meaningful user scenarios**, each with a precondition, user action, app action,
  expected result, and error/alternative paths.
- **Input validation** on every user-provided value (empty, wrong type, wrong format,
  out-of-range, unknown command, acting on a non-existent record).
- **Error handling** for four categories: network, database, user, and unexpected.
  An unhandled error must never fully stop the bot.
- **User isolation:** every data query is filtered by the current user. One user must
  never see or modify another user's data.
- **Secrets out of code:** `BOT_TOKEN`, API keys, and DB credentials live only in `.env`
  (git-ignored). A `.env.example` with no real values is committed.
- **Layered project structure:** no single-file app. One responsibility per module.
- **A manual QA checklist** (≥ 10 checks) — see `qa-checklist.md` — filled in with
  real results before the demo.
- **A `README.md`** that lets another developer run the project with no verbal help.

---

## 2. Tech stack (do not substitute without asking)

- **Language:** Python 3.11+
- **Bot framework:** `aiogram` (v3)
- **Web API:** `FastAPI` + `uvicorn`, with `pydantic` schemas for request validation
- **Database:** SQLite via `aiosqlite` (async) — no ORM
- **Auth:** `PyJWT`, plus PBKDF2 password hashing from the standard library
- **Frontend:** static HTML/CSS/vanilla JS; Chart.js from a CDN. No build step, no
  frontend framework.
- **Config:** `python-dotenv`
- **Dependencies:** pinned in `backend/requirements.txt`

Do not add heavy dependencies (ORMs, message queues, frontend build tooling). Prefer
the standard library and the packages above.

---

## 3. Architecture — one responsibility per file

Keep the command path layered and never mix layers:

```
Telegram → bot/handlers.py ─┐
                            ├→ services.py → database.py → SQLite
Browser  → routers/*.py    ─┘  (rules)       (SQL only)
   (parse/validate)
```

Both front ends run in one process: `uvicorn main:app` serves the API and the static
dashboard, and the FastAPI lifespan starts bot polling and the reminder scheduler.

| File                     | Responsibility                                       |
|--------------------------|------------------------------------------------------|
| `main.py`                | Entry point: config, DB init, seeds, bot, scheduler   |
| `config.py`              | Settings from environment (`BOT_TOKEN`, DB path, …)  |
| `database.py`            | SQLite connection + parameterized SQL only           |
| `services.py`            | Business rules (validation, progress, formatting)    |
| `models.py`              | Pydantic schemas — web request/response validation   |
| `auth.py`                | Password hashing, JWT, one-time link codes           |
| `scheduler.py`           | Minute loop that pushes due reminders                |
| `routers/*.py`           | FastAPI endpoints: parse input, call services        |
| `bot/handlers.py`        | aiogram handlers: parse input, call services         |
| `bot/keyboards.py`       | Inline keyboards (buttons)                           |
| `bot/bot_services.py`    | Command parsing + Telegram formatting                |
| `bot/runner.py`          | Bot lifecycle: build, poll, shut down                |
| `tests/`                 | API, bot, and persistence test scripts               |
| `requirements.txt`       | Pinned dependencies                                  |
| `.env` / `.env.example`  | Secrets (real / template)                            |

Rules:
- Handlers and routers must **not** contain SQL. Database code must **not** contain
  Telegram or FastAPI objects.
- Business rules (e.g. "reject empty title", "only the owner can delete") live in
  `services.py`, not scattered across handlers.
- If a file grows past one clear responsibility, split it and tell me why.

Full data model and SQL in `architecture.md`.

---

## 4. Workflow — Plan Mode before code

This is the core habit from the lecture. Follow it on every non-trivial task.

1. **One task at a time.** Do not implement the whole bot in one shot.
2. **Plan first.** Before writing code, output: the goal, the files you'll touch, the
   steps, any DB changes, and how the result will be verified. **Wait for my
   confirmation.** Do not write code until I approve the plan.
3. **Narrow edits.** When I ask for one command (e.g. "implement `/list`"), touch only
   the files that command needs. Do not refactor or edit unrelated files.
4. **Explain, then verify.** After code, explain the key decisions and give the exact
   steps to test the change in a real Telegram chat.

A good implementation request already names the stack, the command, the isolation rule,
error handling, and asks for a plan before code. Mirror that precision back to me.

---

## 5. Coding rules

- **Parameterized SQL only.** Use `?` placeholders and pass values separately. Never
  build SQL with f-strings or string concatenation.
- **Filter by owner on every query.** Reads, updates, and deletes on user data all
  include `WHERE user_id = ?`. The `user_id` comes from the Telegram sender or the JWT
  `sub` claim — never from a request body. An id from user input must never reach
  another user's row.
- **Validate before you persist.** Reject blank text, non-numeric values, out-of-range
  values, and actions on non-existent records *before* touching the database.
- **Async correctly.** aiogram v3 handlers are `async`; use `await` for all DB calls
  when using `aiosqlite`. Don't block the event loop.
- **Small, named units.** Functions, files, and variables named for what they do.
  Short functions over long ones.
- **No secrets, tokens, or real IINs/emails in code, comments, logs, or test data.**

---

## 6. Security & configuration

- `BOT_TOKEN` and every secret come from the environment via `config.py`. Never inline
  a token, even temporarily.
- Commit `.env.example` (keys only, no values). Never commit `.env`.
- `.gitignore` must include at least:
  ```
  .env
  *.db
  __pycache__/
  ```
- User-facing error messages never show a stack trace or raw exception text. Log the
  technical detail; show the user a plain, actionable message.

---

## 7. Error handling (four required categories)

Every category below must be handled somewhere and produce a clear user message:

- **Network:** no connection, timeout, server error, unexpected/empty API response.
- **Database:** can't connect, can't save, record not found, uniqueness violation.
- **User:** unknown command, missing required input, wrong format, action not allowed,
  duplicate/repeated request.
- **Unexpected:** catch it, log the technical info, show a friendly message, and let the
  user retry — the bot must keep running.

A user message should say **what happened, why, and what to do next**.

---

## 8. Definition of Done

A task is done only when:

- [ ] It runs — verified in a real Telegram chat, not just "looks right".
- [ ] Data is read/written correctly and survives a restart.
- [ ] The relevant validation and error paths are handled and tested.
- [ ] User isolation holds (test with two different Telegram accounts where relevant).
- [ ] No secrets entered code or git.
- [ ] The matching rows in `qa-checklist.md` are checked off with real results.
- [ ] `README.md` is updated if setup/usage changed.

Do not mark a feature complete on the basis of generated code alone.

---

## 9. Reference documents (read before acting)

- `requirements.md` — the full course rubric as an acceptance spec + the ≥5
  scenario template.
- `architecture.md` — data model, SQL schema, module map, API reference, command flows,
  error-handling map.
- `scenarios.md` — the seven documented user scenarios with their error paths.
- `qa-checklist.md` — the manual test checklist; automated rows carry their evidence.
- `README.md` — launch instructions.

---

## How each IDE picks up these rules

- **Cursor:** reads `AGENTS.md` at the repo root automatically. (Optional: also add
  `.cursor/rules/main.mdc` with `alwaysApply: true` and paste sections 1–8.)
- **Claude Code:** reads `CLAUDE.md`. Create it as a pointer:
  `echo "See @AGENTS.md" > CLAUDE.md` (or `ln -s AGENTS.md CLAUDE.md`).
- **Codex CLI / Windsurf / others:** `AGENTS.md` is the shared convention — keep this
  file as the single source of truth and mirror only if a tool needs its own path.
