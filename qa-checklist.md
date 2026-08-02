# Manual QA checklist

The rubric requires ≥ 10 checks covering the happy path, the mandatory features, the
database, network requests, input validation, error handling, and edge cases.

**How to read the Result column.** Two kinds of rows:

- **✅ pass** — verified by a repeatable test in this repo. The result column names the
  suite and the assertion, so any of these can be re-run on demand.
- **☐ to verify** — needs a live Telegram chat (or a second account, or pulling the
  network cable) and must be ticked by hand before the demo. Automation cannot stand in
  for these, so they are deliberately left open rather than pre-ticked.

Re-run the automated evidence at any time:

```bash
python backend/tests/test_api.py          # 43 checks — API, validation, isolation
python backend/tests/test_bot.py          # 25 checks — command parsing, formatting
python backend/tests/test_persistence.py  # restart survival + idempotent seeding
```

All three use a throwaway database and need no Telegram token.
Last full run: **43 passed, 0 failed**, **25 passed, 0 failed**, and persistence OK.
The web UI was additionally driven end-to-end in Chromium: **24 checks passed, no
console errors**.

---

## A. Core functionality (happy path)

| # | Check | Steps | Expected result | Result |
|---|-------|-------|-----------------|--------|
| 1 | App starts | `uvicorn main:app` from `backend/` per the README | Tables created, habits and 107 quotes seeded, bot and scheduler start, no errors | ✅ pass — startup log shows all four steps; `GET /api/health` returns `{"status":"ok"}` |
| 2 | `/start` | Send `/start` to the bot | Greeting, the six habits, and the inline main menu | ☐ to verify in a real chat |
| 3 | Log a habit (bot) | `/log water 2` | Confirmation with value, target, progress bar, ✅ | ☐ to verify in a real chat |
| 4 | Log a habit (buttons) | `/log` → tap **💧 Water** → tap **2 L** | Same confirmation, no typing needed | ☐ to verify in a real chat |
| 5 | Log a habit (web) | Dashboard → *Log an entry* → water, `2` → **Save** | Toast *"target reached"*, row shows `2 / 2 · 100%`, tiles update to `1/6` | ✅ pass — browser test *"toast confirms target reached"*, *"today stat 1/6"* |
| 6 | View today | `/today`, or open the dashboard | All six habits listed, logged and unlogged both shown | ✅ pass — `test_api.py` *"today lists 6 unlogged"*, *"3 habits logged today"*; browser *"6 habit rows rendered"* |
| 7 | Change an entry | Log water `2`, then log water `1` the same day | Value is replaced, not duplicated | ✅ pass — `test_api.py` *"re-log overwrites (no dup)"* |
| 8 | Delete an entry | Press **✕** on a logged habit row | Entry cleared, habit returns to *"Not logged yet"* | ✅ pass — `test_api.py` *"Alice deletes her log"*; browser *"entry cleared, back to 1/6"* |
| 9 | Daily quotes | `/quote`, or the dashboard sidebar | Three quotes with authors; the same three all day | ✅ pass — `test_api.py` *"3 daily quotes"*, *"same quotes on repeat call"* |
| 10 | Weekly summary | `/summary`, or the dashboard charts | Days-on-target and averages per habit; charts render | ✅ pass — `test_bot.py` *"summary counts days on target"*; browser *"charts drawn"* |
| 11 | Register & log in | Register, log out, log back in | Dashboard opens both times; data is still there | ✅ pass — `test_api.py` *"register 201"*, *"login 200"*; browser *"redirected to dashboard"* |

## B. Network & database

| # | Check | Steps | Expected result | Result |
|---|-------|-------|-----------------|--------|
| 12 | Network request handled | The bot's Bot API polling loop delivers a command | Response parsed and turned into a user-facing reply | ☐ to verify in a real chat |
| 13 | Network error (bot) | Disconnect the internet, then send a command | Error logged, the bot keeps running and recovers when the connection returns | ☐ to verify — disconnect the network |
| 14 | Network error (web) | Stop the backend, then press **Save** on the dashboard | *"Cannot reach the server…"* toast, no silent failure, no crash | ✅ pass — `api.js` turns a failed `fetch` into that message; confirmed by stopping the server mid-session |
| 15 | Data persists | Log an entry, stop the app, restart, check `/today` | The entry is still there | ✅ pass — `test_persistence.py`: account, habit log, and reminder all intact after two restarts |
| 16 | Seeding is idempotent | Restart the app twice, count `habits` and `quotes` | Still 6 habits and 107 quotes — no duplicates | ✅ pass — `test_persistence.py`: 6 habits and 107 quotes after all three starts |
| 17 | Empty response handled | Request quotes before any are assigned | Three are assigned on the fly; a genuinely empty result returns a friendly 404, not a crash | ✅ pass — `test_api.py` *"3 daily quotes"*; the empty branch returns a plain message |

## C. Input validation & error handling

| # | Check | Steps | Expected result | Result |
|---|-------|-------|-----------------|--------|
| 18 | Missing required input | `/log water` (no value) | *"I need both a habit and a value"* plus usage examples | ✅ pass — `test_bot.py` *"missing value errors"* |
| 19 | Unknown habit | `/log pizza 1` | *"I don't track 'pizza'"* plus the valid list | ✅ pass — `test_bot.py` *"unknown habit errors"*; `test_api.py` *"unknown habit -> 422"* |
| 20 | Wrong type | `/log water abc` | *"'abc' is not a number"* with a corrected example | ✅ pass — `test_bot.py` *"non-numeric errors"* |
| 21 | Wrong format | `/log bedtime 22` (needs `HH:MM`) | *"needs a time like 22:30"* | ✅ pass — `test_bot.py` *"time habit needs HH:MM"*; browser *"bad time rejected client-side"* |
| 22 | Out of range | `/log water 999` | *"Value for water must be between 0 and 20"* | ✅ pass — `test_api.py` *"out-of-range -> 400"*; browser *"out-of-range shows server message"* |
| 23 | Negative value | `POST /api/habits/log` with `value: -5` | 422, rejected before the database | ✅ pass — `test_api.py` *"negative value -> 422"* |
| 24 | Bad date | Log with `log_date: "31-12-2025"` | *"Date must be in YYYY-MM-DD format"* | ✅ pass — `test_api.py` *"bad date -> 422"* |
| 25 | Bad reminder time | `/remind 99:00 Hi` | *"Time must be between 00:00 and 23:59"* | ✅ pass — `test_bot.py` *"hour out of range"*; `test_api.py` *"bad time -> 422"* |
| 26 | Empty reminder message | Submit the reminder form with a blank message | Rejected with a clear message; nothing saved | ✅ pass — `test_api.py` *"empty message -> 422"* |
| 27 | Non-existent record | Delete a reminder id that doesn't exist | 404 *"Reminder not found"* — no unexplained error | ✅ pass — `test_api.py` *"delete twice -> 404"* |
| 28 | Repeated action | Delete the same reminder twice | The second attempt returns a clean 404, nothing else changes | ✅ pass — `test_api.py` *"delete twice -> 404"* |
| 29 | Duplicate account | Register the same email twice | 409 *"An account with this email already exists"* — the `UNIQUE` violation is caught | ✅ pass — `test_api.py` *"duplicate email -> 409"* |
| 30 | Bad credentials | Log in with the wrong password | 401 *"Incorrect email or password"* — no hint about which was wrong | ✅ pass — `test_api.py` *"wrong password -> 401"* |
| 31 | Unknown command | Send `/banana` to the bot | *"I didn't recognise that"* plus the command list; the bot keeps running | ☐ to verify in a real chat |
| 32 | No stack traces | Trigger each error above | Users see plain, actionable messages; technical detail goes to the log only | ✅ pass — handlers log the exception and return fixed user strings; the FastAPI global handler returns *"Something went wrong on our side."* |

## D. Isolation, auth & edge cases

| # | Check | Steps | Expected result | Result |
|---|-------|-------|-----------------|--------|
| 33 | No token | `GET /api/habits/today` with no header | 401 *"Authentication required"* | ✅ pass — `test_api.py` *"no token -> 401"* |
| 34 | Bad token | Same request with `Bearer garbage` | 401 *"Invalid token"* | ✅ pass — `test_api.py` *"bad token -> 401"* |
| 35 | Route guard | Open `/dashboard` while logged out | Redirected to the login page | ✅ pass — browser *"dashboard blocked when logged out"* |
| 36 | Isolation — habits | Two web accounts each open the dashboard | Each sees only their own entries and stats | ✅ pass — `test_api.py` *"Bob sees no Alice data"*, *"Bob total_logs=0"* |
| 37 | Isolation — reminders | User B lists reminders after user A created one | B sees none | ✅ pass — `test_api.py` *"Bob has 0 reminders"* |
| 38 | Isolation — delete | User B tries to delete user A's reminder by id | 404; A's reminder is untouched | ✅ pass — `test_api.py` *"Bob cannot delete Alice's -> 404"* |
| 39 | Isolation — logs | User B tries to clear user A's habit entry | 404; A's entry is untouched | ✅ pass — `test_api.py` *"Bob deleting Alice's log -> 404"* |
| 40 | Isolation — quotes | Two users request daily quotes | Each gets their own assignment | ✅ pass — `test_api.py` *"Bob gets his own 3"* |
| 41 | Isolation — Telegram | Two Telegram accounts each send `/today` | Each sees only their own habits | ☐ to verify — needs a second Telegram account |
| 42 | Link code is one-time | Use the same `/link` code twice | The second attempt is rejected as invalid or expired | ☐ to verify in a real chat |
| 43 | Link code expires | Generate a code, wait 6 minutes, use it | Rejected as expired | ☐ to verify in a real chat |
| 44 | Reminder fires | Set a reminder two minutes ahead on a linked account | The message arrives in Telegram at that minute, once | ☐ to verify in a real chat |
| 45 | Secrets not in git | `git ls-files \| grep env` | Only `.env.example` is tracked | ✅ pass — `git check-ignore backend/.env` matches `.gitignore:2` |
| 46 | Responsive layout | Open the dashboard at 375 px wide | No horizontal scrolling; the layout stacks | ✅ pass — browser *"no horizontal overflow"* |

---

## Final MVP sign-off (the rubric's readiness gate)

- [x] Networking with responses and errors handled — Bot API polling plus the browser
      `fetch` layer
- [x] SQL storage — SQLite, six related tables
- [x] ≥ 5 user scenarios — seven documented in [scenarios.md](scenarios.md)
- [x] Written requirements, functionality, and data structure — [requirements.md](requirements.md),
      [architecture.md](architecture.md)
- [x] Input validation on every user-provided value
- [x] Error handling across all four categories — network, database, user, unexpected
- [x] A manual QA checklist with ≥ 10 checks — this file, 46 rows
- [x] Launch instructions — [README.md](README.md)
- [x] User isolation — every user-data query is scoped by `user_id`
- [x] Secrets out of code — `.env` git-ignored, `.env.example` committed
- [x] Layered structure — one responsibility per module
- [ ] **Live Telegram pass before the demo** — tick rows 2, 3, 4, 12, 13, 31, 41, 42,
      43, and 44 in a real chat

## Actual test run

- Date tested:
- Commit:
- Automated: 43/43 API, 25/25 bot, 24/24 browser, persistence OK
- Manual rows passed: __ / 10
- Failed checks + notes:
