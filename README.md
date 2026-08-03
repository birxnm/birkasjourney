# Birka's Journey

A daily habit tracker with two front ends over one backend: a **Telegram bot** for
logging on the move and a **web dashboard** for reviewing progress. Both write to the
same SQLite database, so an entry made in Telegram shows up on the dashboard and the
other way round.

Six habits are tracked out of the box: 💧 water · 🚶 steps · 🌙 bedtime · ⏰ wake-up ·
📚 IELTS prep · 💻 IT projects — and you can add your own from the dashboard, each with
its own icon, colour, category, weekly target, notes, and reminder.

Alongside the tracking there are three curated motivational quotes a day (107 in the
library, from Napoleon Hill, Kobe Bryant, Steve Jobs, Marcus Aurelius and others) and
daily reminders pushed to Telegram at a time you choose.

---

## Quick start

You need **Python 3.11+**, **Node.js 20+** (to build the dashboard), and a Telegram bot
token from [@BotFather](https://t.me/BotFather).

```bash
git clone https://github.com/birxnm/birkasjourney.git
cd birkasjourney

# 1. Backend
python3 -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env
# open backend/.env and fill in BOT_TOKEN and JWT_SECRET

# 2. Dashboard — build it once; the backend serves the result
cd frontend
npm install
npm run build
cd ..

# 3. Run
cd backend
uvicorn main:app --reload
```

Then open **<http://localhost:8000>** and register an account.

One command starts everything: the web API, the dashboard, the Telegram bot (polling),
and the reminder scheduler all run in the same process.

> Skipping `npm run build` isn't fatal — the API still runs and `/docs` still works, but
> every page says to build the frontend first.

### Working on the frontend

`npm run build` after each change gets tedious. For live reload:

```bash
cd frontend && npm run dev      # http://localhost:5173
```

Keep `uvicorn` running on port 8000 in another terminal — Vite proxies `/api` to it, so
the two behave as one origin. Run `npm run build` once more before you demo, so the
version `uvicorn` serves is current.

### Opening it on a phone

The dashboard is an installable web app, so it can live on a phone's home screen and open
without browser chrome.

`localhost` on the phone means the phone itself, so use the computer's address on the
network instead. Both devices must be on the same Wi-Fi (or the phone's hotspot):

```bash
# 1. Find the computer's address
ipconfig getifaddr en0            # macOS, e.g. 192.168.1.24

# 2. Serve on every interface, not just the loopback
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

Then open `http://<that-address>:8000` on the phone. In Safari, **Share → Add to Home
Screen**; in Chrome, **⋮ → Add to Home screen**.

Two things to know. The site is only reachable while the computer is awake and running
`uvicorn` on the same network — for anything more permanent it needs a real host (see
below). And iOS will not install a web app over plain HTTP from some contexts; if **Add to
Home Screen** gives you a plain bookmark instead of a fullscreen app, that's why, and
hosting it over HTTPS fixes it.

### Letting someone else use it

Everything below `localhost` is single-machine. For anyone else — a family member on their
own phone, on their own network — the app has to be reachable on the internet.

Accounts already work for more than one person: every row of user data is scoped by
`user_id`, so each person registers their own account, sees only their own habits, and
links their own Telegram. Note that **registration is open** — anyone with the URL can
create an account.

#### A temporary link (about five minutes)

Good for showing someone today, or for rehearsing the demo. The link dies when the tunnel
stops, and it gets a new address each time.

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:8000      # prints a https://….trycloudflare.com URL
```

Leave that running and keep `uvicorn` running in another terminal. The URL is HTTPS, which
is also what makes **Add to Home Screen** install as a real app rather than a bookmark.

#### A permanent deployment

The app needs a **persistent process with a writable disk**: SQLite is a file on disk, the
Telegram bot holds a long-polling connection, and `scheduler.py` runs a minute loop. All
three are started by the FastAPI lifespan in `main.py`, and all three need the process to
stay alive between requests.

That rules out serverless platforms — **Vercel, Netlify, and Lambda-style hosts cannot run
this project as it stands.** Their functions are stateless and their filesystems are
ephemeral, so the database would not survive, the bot would stop polling, and reminders
would never fire. A container host with a mounted volume — Railway, Render, Fly.io, or any
small VPS — runs it unchanged from the `Dockerfile` at the repo root.

On Railway, which needs no config file beyond that:

1. Push this repo to GitHub.
2. **New Project → Deploy from GitHub repo** and pick it. Railway finds the `Dockerfile`.
3. **Variables** — add `BOT_TOKEN`, and a `JWT_SECRET` generated fresh for production:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
4. **Settings → Volumes** — add one mounted at `/data`. Without it every deploy starts from
   an empty database. The `Dockerfile` already points `DB_PATH` at `/data/birkasjourney.db`.
5. **Settings → Networking → Generate Domain**, then set `ALLOWED_ORIGINS` to that URL.

Three things that matter whichever host you choose:

- **Set `JWT_SECRET` yourself.** `config.py` falls back to `change-me-in-production`, and
  anyone who knows that default can mint a valid token for any account. Use a different
  value from your local one, and never commit either.
- **Mount a volume for the database**, per step 4.
- **Set `ALLOWED_ORIGINS`** to the deployed origin instead of leaving it `*`.

Only one instance should run at a time: two processes polling the same bot token will
fight over updates, and both would send every reminder.

### The app icons

`frontend/public/icon.svg` is the source. The PNGs beside it (32, 180, 192, 512) are
rendered from it, so edit the SVG and re-render rather than editing the PNGs. Any tool
that rasterises SVG will do:

```bash
# with rsvg-convert (brew install librsvg)
cd frontend/public
for s in 32:favicon-32 180:apple-touch-icon 192:icon-192 512:icon-512; do
  rsvg-convert -w "${s%%:*}" -h "${s%%:*}" icon.svg -o "${s##*:}.png"
done
```

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
| `/today` | Today's progress across every habit you track |
| `/log <habit> <value>` | Log an entry — `/log water 1.5`, `/log bedtime 22:30` |
| `/quote` | Your three quotes for today |
| `/remind <HH:MM> <text>` | Daily reminder — `/remind 21:00 Drink water` |
| `/reminders` | List your reminders |
| `/summary` | Last 7 days, per habit, plus your streak |
| `/link <code>` | Connect your web account |
| `/help` | All commands |

`/log` with no arguments opens inline buttons, so a whole day can be logged by tapping.
Habit names accept aliases: `bedtime`/`bed`/`sleep`, `wakeup`/`wake`, `it`/`projects`/`code`.

For a habit you added yourself, `/log <name>` with no value marks it done for today —
`/log morning_run`. The short name is the one shown on your dashboard.

### Web dashboard

Registering at <http://localhost:8000> takes you to a welcome page with your streak,
today's progress, and where to go next. The dashboard itself has streak and completion
tiles, today's habits with progress bars, a form for logging or correcting entries, a
weekly line chart against target, a bar chart of days-on-target, the daily quotes, and
reminder management.

### Adding your own habit

Press **+ Add Habit** on the dashboard and pick a name, an icon, a colour, a category,
how many days a week you want it, and optional notes. Switch **Reminder** on and choose
a time, and it is scheduled straight away — reminders arrive in Telegram, so link your
account to receive them.

Your habits are yours: nobody else can see, log, edit, or delete them, and two people can
each have a habit with the same name. They are yes/no habits — one tap marks today done,
and the card tracks how the week is going against your target. The six built-ins are
shared and cannot be deleted.

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
  tests/             API, habit, bot, and persistence test scripts
frontend/
  index.html         Vite entry point
  vite.config.js     Build config + the /api dev proxy
  src/
    main.jsx         Mounts React, error boundary, toasts
    App.jsx          Route guard and page switch
    router.js        History-API routing
    api.js           The only module that talks to the backend
    habits.js        Time conversion and value formatting
    pages/           AuthPage, WelcomePage, DashboardPage
    components/      AddHabitModal, the pickers, habit lists, charts, cards
    styles/          global.css (tokens) + habits.css (new components)
  dist/              Built output — served by FastAPI, not committed
```

Layering rule: handlers and routers parse and validate, `services.py` applies the rules,
`database.py` runs the SQL. Handlers never contain SQL; `database.py` never imports
aiogram or FastAPI. On the frontend, only `src/api.js` calls the backend.

---

## Tests

```bash
python backend/tests/test_api.py          # 45 checks — endpoints, validation, user isolation
python backend/tests/test_habits.py       # 46 checks — custom habits: create, edit, delete, isolate
python backend/tests/test_bot.py          # 27 checks — command parsing, formatting, keyboards
python backend/tests/test_persistence.py  # data survives a restart; seeding stays idempotent
```

All four use a throwaway database and need no Telegram token, so they run offline.

Interactive API docs are at <http://localhost:8000/docs> while the app is running.

---

## Documentation

| File | What's in it |
|------|--------------|
| [requirements.md](requirements.md) | The course rubric as an acceptance spec |
| [architecture.md](architecture.md) | Data model, module map, API reference, error-handling map |
| [scenarios.md](scenarios.md) | Eight user scenarios with error paths |
| [qa-checklist.md](qa-checklist.md) | 64-row manual QA checklist with results |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents working in this repo |

---

## Troubleshooting

**`BOT_TOKEN is not set`** — a warning, not a crash. Fill in `backend/.env`; the web app
runs without it.

**"The dashboard isn't built yet"** — you skipped step 2. Run `npm install && npm run
build` in `frontend/`, then reload.

**`Address already in use`** — something else is on port 8000. Run
`uvicorn main:app --port 8001`.

**Dashboard shows an old version** — Vite writes hashed filenames, so this is almost
always a stale build. Re-run `npm run build`.

**Bot doesn't answer** — check the startup log says *"Telegram bot and reminder
scheduler started"*, confirm the token, and make sure only one instance is running.
Telegram allows one poller per token.

**Reminders don't arrive** — the account must be linked to Telegram, and `TIMEZONE` must
match the clock you set the time against.

**Start over** — stop the app and delete `backend/birkasjourney.db`. Tables and seed data
are recreated on the next start.
