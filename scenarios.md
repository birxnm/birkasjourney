# User scenarios

Eight scenarios in the rubric §5 shape: *name → participant → preconditions → main flow
→ error cases → expected result*. The rubric requires at least five; the extras cover
the cross-platform linking, the reminder push, and creating a habit of your own — the
parts a reviewer is most likely to probe.

---

## 1. Log a habit from Telegram

**Participant:** a Telegram user.

**Preconditions:** the app is running with a valid `BOT_TOKEN`. The user has sent
`/start` at least once, so a `users` row exists for their `telegram_id`.

**Main flow**

1. The user sends `/log water 1.5`.
2. `bot_services.parse_log_command` resolves the alias `water` and parses `1.5`.
3. `services.log_habit_for_user` looks up the habit, checks the value is inside the
   0–20 L range, and compares it to the 2 L target.
4. `database.log_habit` upserts one row into `habit_logs` for `(user, water, today)`.
5. The bot replies with the value, the target, a progress bar, and 75%.

**Error cases**

| Input | Result |
|-------|--------|
| `/log` with no arguments | The inline habit picker opens instead of an error |
| `/log water` | *"I need both a habit and a value"* plus the usage examples |
| `/log pizza 1` | *"Unknown habit: 'pizza'. You track: …"* — an unrecognised name is treated as one of the user's own habits and checked against the database, because only that tells us whether *this* user has it |
| `/log water abc` | *"'abc' is not a number"* with a corrected example |
| `/log water 999` | *"Value for water must be between 0 and 20"* |
| Database unavailable | Logged internally; the user sees *"Nothing was saved. Please try again."* |

**Expected result:** exactly one `habit_logs` row for that user, habit, and date, with
`is_completed = 0` and `value = 1.5`. Logging water again the same day updates that same
row rather than adding another.

---

## 2. Review today's progress

**Participant:** a Telegram user, or a logged-in web user.

**Preconditions:** the user exists. Some habits may be logged, some may not.

**Main flow**

1. The user sends `/today`, taps **📊 Today**, or opens the dashboard.
2. `services.get_today_summary` runs one owner-scoped `LEFT JOIN` so every habit the
   user tracks — the built-in six plus their own — comes back whether or not it was
   logged.
3. Each logged habit gets a completion flag and a progress percentage.
4. Telegram renders a text progress bar; the dashboard renders bars and stat tiles.

**Error cases**

- Nothing logged yet → every habit reads *"Not logged yet"*; this is a normal state,
  not an error.
- Expired JWT on the web → 401, the dashboard redirects to the login page with
  *"Your session expired."*
- Backend down → the dashboard shows *"Cannot reach the server."* instead of failing
  silently.

**Expected result:** six rows, in `sort_order`, showing only this user's values.

---

## 3. Correct a mistaken entry

**Participant:** a logged-in web user.

**Preconditions:** the user has already logged water today.

**Main flow**

1. The user presses **✕** on the water row.
2. The dashboard calls `DELETE /api/habits/log/water`.
3. `database.delete_habit_log` runs `DELETE … WHERE user_id = ? AND habit_id = ? AND log_date = ?`.
4. The dashboard refreshes: water returns to *"Not logged yet"*, and the stat tiles drop.

**Error cases**

| Situation | Result |
|-----------|--------|
| No entry for that habit today | 404 *"No entry for Water Intake on 2026-08-02"* |
| Unknown habit in the URL | 404 *"Unknown habit"* |
| Malformed `log_date` query parameter | 400 *"Date must be in YYYY-MM-DD format"* |
| Another user's entry | 404 — the `user_id` in the `DELETE` means there is nothing to match |

**Expected result:** the row is gone for this user; nobody else's data changes. The
user can now re-log the correct value.

---

## 4. Register on the web and link Telegram

**Participant:** a new user who wants both front ends.

**Preconditions:** the app is running. The email is not already registered.

**Main flow**

1. The user registers with an email and a password (≥ 6 characters).
2. The password is hashed with PBKDF2-SHA256 and a JWT is returned; the dashboard opens.
3. The user presses **🔗 Link Telegram** and gets a 6-character code.
4. Within 5 minutes they send `/link ABC123` to the bot.
5. `validate_link_code` consumes the code and `link_telegram_to_user` writes
   `telegram_id` onto the existing web user row.
6. Both front ends now read and write the same data.

**Error cases**

| Situation | Result |
|-----------|--------|
| Email already registered | 409 *"An account with this email already exists."* |
| Malformed email | 422 *"Invalid email format"* |
| Password under 6 characters | 422, rejected before any hashing |
| Wrong password at login | 401 *"Incorrect email or password"* — the same message whether or not the email exists |
| Expired or reused code | *"That code is invalid or has expired."* |
| Telegram account already linked elsewhere | *"This Telegram account is already linked to another web account."* — the `UNIQUE` constraint is caught, not crashed on |

**Expected result:** one `users` row carrying both `email` and `telegram_id`. Entries
made in Telegram appear on the dashboard and vice versa.

---

## 5. Set a reminder and receive it

**Participant:** a user whose account is linked to Telegram.

**Preconditions:** the app is running and `TIMEZONE` is set correctly.

**Main flow**

1. The user sends `/remind 21:00 Drink your last glass of water`, or fills the reminder
   form on the dashboard.
2. The time and message are validated and a `reminders` row is saved with `is_active = 1`.
3. `scheduler.py` wakes every 30 seconds and compares the local `HH:MM` to the stored
   times; each minute is processed at most once.
4. At 21:00 the scheduler joins `reminders` to `users`, finds the `telegram_id`, and the
   bot delivers the message.

**Error cases**

| Situation | Result |
|-----------|--------|
| `/remind 21:00` with no message | *"I need a time and a message"* with an example |
| `/remind 99:00 Hi` | *"Time must be between 00:00 and 23:59"* |
| `/remind abc Hi` | *"'abc' is not a time. Use HH:MM"* |
| Message over 500 characters | Rejected with a length message |
| Account not linked to Telegram | The reminder is saved but has no delivery target; the dashboard says so up front |
| User blocked the bot | Logged per recipient; the other reminders in that minute still go out |

**Expected result:** the reminder appears in `/reminders` and on the dashboard, and
arrives in Telegram at the chosen time every day until deleted.

---

## 6. Read the weekly summary

**Participant:** any user with at least one logged day.

**Preconditions:** some `habit_logs` rows exist in the last seven days.

**Main flow**

1. The user sends `/summary`, taps **📈 Week summary**, or scrolls to the dashboard
   charts.
2. `database.get_habit_history` returns the user's rows from the last seven days.
3. The bot aggregates days-on-target and averages per habit and adds the current streak;
   the dashboard draws a line chart against target and a bar chart of days-on-target.

**Error cases**

- No entries in the window → *"No entries yet. Log something with /log and check back
  tomorrow!"* — a friendly message, not an empty screen or an error.
- Days logged for only some habits → missing points are gaps in the line, not zeros.
- `?days=0` or `?days=500` on the API → 422; the range is capped at 1–90.

**Expected result:** counts and averages computed only from this user's rows, with
bedtime and wake-up shown as `HH:MM` rather than decimals.

---

## 7. Data survives a restart

**Participant:** anyone running the project — this is the persistence check.

**Preconditions:** at least one habit entry and one reminder exist.

**Main flow**

1. Stop the app with `Ctrl+C`. The lifespan cancels the scheduler, stops polling, and
   closes the bot session.
2. Start it again with `uvicorn main:app`.
3. `init_db` runs `CREATE TABLE IF NOT EXISTS`, so nothing is dropped; `seed_habits`
   uses `INSERT OR IGNORE` and `seed_quotes` only runs when the table is empty, so
   neither duplicates anything.
4. `/today` and the dashboard show the same values as before.

**Error cases**

- Database file deleted → the schema is recreated empty; the app starts rather than
  crashing, and the user simply has no history.
- `BOT_TOKEN` missing → a warning is logged, the web API still serves, and only the bot
  is disabled.

**Expected result:** habit logs, reminders, accounts, and today's quote assignments are
all intact, and the seed data is not duplicated.

---

## 8. Add a habit of your own

**Participant:** a logged-in web user.

**Preconditions:** the app is running and the dashboard is built. The user has an
account; they may or may not have created habits before.

**Main flow**

1. With no habits of their own yet, the user sees *"Track your first habit"* and presses
   **+ Add Habit**.
2. They type *Morning Run*, pick the 🏃 icon and the lime swatch, choose the
   *Health & Fitness* category, set the target to 5 days a week, add the note
   *"Before breakfast"*, switch **Reminder** on, and set 07:30.
3. `POST /api/habits` validates the shape — name not blank, `target_days` 1–7, a known
   category, a `#rrggbb` colour, a real `HH:MM` time.
4. `services.create_habit_for_user` derives the storage name `morning_run`, checks the
   user doesn't already have it, and writes the row with `user_id` set and
   `kind = 'binary'`. The reminder is created in the same call.
5. The habit appears in today's list with a **Mark done** button and under
   *Your own habits*; the reminder shows in the sidebar.
6. Tapping **Mark done** logs value 1 for today; the card reads `1/5 days this week`.

**Error cases**

| Input | Result |
|-------|--------|
| Name left blank | *"Give the habit a name first."* — nothing is sent |
| A name they already use | 400 *"You already have a habit called 'Morning Run'."* |
| `target_days` outside 1–7, an unknown category, or a colour that isn't `#rrggbb` | 422, rejected before the database |
| A name with no Latin letters, e.g. *Пить воду* | Accepted; the storage name falls back to a stable digest, so adding it twice is still caught |
| Another user guesses the habit's id and calls `PATCH` or `DELETE` | 404 — the SQL carries `WHERE user_id = ?`, so the row can never match |
| The reminder fails to save | The habit is kept, the failure is logged, and the response reports no reminder rather than losing the habit |
| Database unavailable | Logged internally; the user sees *"Could not save that habit. Please try again."* |

**Expected result:** one `habits` row owned by that user, invisible to every other
account, loggable from both the dashboard and `/log morning_run` in Telegram. Deleting
it removes its logs and reminders with it. The six built-in habits are untouched and
cannot be deleted by anyone.
