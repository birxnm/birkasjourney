# Birka's Journey

A daily habit tracker with two front ends over one backend: a **Telegram bot** for
logging on the move and a **web dashboard** for reviewing progress. Both write to the
same SQLite database, so an entry made in Telegram shows up on the dashboard and the
other way round.

Six habits are tracked: 💧 water · 🚶 steps · 🌙 bedtime · ⏰ wake-up · 📚 IELTS prep ·
💻 IT projects.

Alongside the tracking there are three curated motivational quotes a day (107 in the
library, from Napoleon Hill, Kobe Bryant, Steve Jobs, Marcus Aurelius and others) and
daily reminders pushed to Telegram at a time you choose.

---

## Quick start

You need **Python 3.11+** and a Telegram bot token from
[@BotFather](https://t.me/BotFather).

```bash
git clone https://github.com/birxnm/birkasjourney.git
cd birkasjourney

python3 -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env
# open backend/.env and fill in BOT_TOKEN and JWT_SECRET

cd backend
uvicorn main:app --reload
```

Then open **<http://localhost:8000>** and register an account.

One command starts everything: the web API, the static dashboard, the Telegram bot
(polling), and the reminder scheduler all run in the same process.

### Configuration

`backend/.env` — never commit this file; `backend/.env.example` is the template.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `BOT_TOKEN` | yes, for the bot | — | From @BotFather. Without it the web app still runs; only the bot is disabled. |
| `JWT_SECRET` | yes | `change-me-in-production` | Signing key for login tokens. Use a long random string. |
| `DB_PATH` | no | `birkasjourney.db` | SQLite file, relative to `backend/` |
| `JWT_ALGORITHM` | no | `HS256` | |
| `JWT_EXPIRATION_HOURS` | no | `24` | How long a login lasts |
| `APP_HOST` / `APP_PORT` | no | `0.0.0.0` / `8000` | |
| `TIMEZONE` | no | `Asia/Almaty` | Timezone the reminder scheduler fires in |

Generate a strong secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

The database file and its tables are created automatically on first start, along with
the six habit definitions and the quote library.

---

## Using it

### Telegram

| Command | What it does |
|---------|--------------|
| `/start` | Register and open the main menu |
| `/today` | Today's progress across all six habits |
| `/log <habit> <value>` | Log an entry — `/log water 1.5`, `/log bedtime 22:30` |
| `/quote` | Your three quotes for today |
| `/remind <HH:MM> <text>` | Daily reminder — `/remind 21:00 Drink water` |
| `/reminders` | List your reminders |
| `/summary` | Last 7 days, per habit, plus your streak |
| `/link <code>` | Connect your web account |
| `/help` | All commands |

`/log` with no arguments opens inline buttons, so a whole day can be logged by tapping.
Habit names accept aliases: `bedtime`/`bed`/`sleep`, `wakeup`/`wake`, `it`/`projects`/`code`.

### Web dashboard

Register at <http://localhost:8000>, and you get streak and completion tiles, today's
habits with progress bars, a form for logging or correcting entries, a weekly line chart
against target, a bar chart of days-on-target, the daily quotes, and reminder management.

### Linking the two

1. Log in on the dashboard and press **🔗 Link Telegram**.
2. Send the 6-character code to the bot as `/link ABC123` within 5 minutes.

Both front ends then share one account. Codes are single-use.

---

## Project layout

```
backend/
  main.py            FastAPI app; starts DB, bot, and scheduler
  config.py          Settings from .env
  database.py        SQLite access — parameterized SQL only
  services.py        Business rules: validation, progress, formatting
  models.py          Pydantic request/response schemas
  auth.py            Password hashing, JWT, link codes
  scheduler.py       Minute loop that pushes due reminders
  quotes_data.py     The seeded quote library
  routers/           REST endpoints: auth, habits, quotes, reminders
  bot/               aiogram v3 handlers, keyboards, parsing, runner
  tests/             API and bot test scripts
frontend/
  index.html         Login / register
  dashboard.html     The tracking dashboard
  css/style.css      Design system
  js/                api, auth, habits, charts, quotes, reminders, dashboard
```

Layering rule: handlers and routers parse and validate, `services.py` applies the rules,
`database.py` runs the SQL. Handlers never contain SQL; `database.py` never imports
aiogram or FastAPI.

---

## Tests

```bash
python backend/tests/test_api.py          # 43 checks — endpoints, validation, user isolation
python backend/tests/test_bot.py          # 25 checks — command parsing, formatting, keyboards
python backend/tests/test_persistence.py  # data survives a restart; seeding stays idempotent
```

All three use a throwaway database and need no Telegram token, so they run offline.

Interactive API docs are at <http://localhost:8000/docs> while the app is running.

---

## Documentation

| File | What's in it |
|------|--------------|
| [requirements.md](requirements.md) | The course rubric as an acceptance spec |
| [architecture.md](architecture.md) | Data model, module map, API reference, error-handling map |
| [scenarios.md](scenarios.md) | Seven user scenarios with error paths |
| [qa-checklist.md](qa-checklist.md) | 46-row manual QA checklist with results |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents working in this repo |

---

## Troubleshooting

**`BOT_TOKEN is not set`** — a warning, not a crash. Fill in `backend/.env`; the web app
runs without it.

**`Address already in use`** — something else is on port 8000. Run
`uvicorn main:app --port 8001`.

**Bot doesn't answer** — check the startup log says *"Telegram bot and reminder
scheduler started"*, confirm the token, and make sure only one instance is running.
Telegram allows one poller per token.

**Reminders don't arrive** — the account must be linked to Telegram, and `TIMEZONE` must
match the clock you set the time against.

**Start over** — stop the app and delete `backend/birkasjourney.db`. Tables and seed data
are recreated on the next start.
