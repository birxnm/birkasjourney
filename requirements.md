# Requirements — course rubric as an acceptance spec

Source: *Требования к итоговому проекту, v1.0*. This is the checklist the project is
graded against. Each section below maps to a rubric section so it can be defended in the
final demo. The agent must satisfy every **must**; **bonus** items add marks but never
at the cost of a stable MVP.

---

## Goal (rubric §1)

Deliver a finished **MVP** that solves a concrete user/business task, starts from written
instructions, and can be verified against a checklist. Format is free; this project uses
a **Telegram bot**.

## Mandatory components (rubric summary)

- [ ] Networking + response handling
- [ ] SQL database storage
- [ ] ≥ 5 meaningful user scenarios
- [ ] Written requirements, functionality, and data structure
- [ ] Input validation and error handling
- [ ] A manual QA checklist
- [ ] Launch instructions (README)

---

## Networking (rubric §2.1)

At least one network request. Valid sources include an external REST API, your own
backend, the **Telegram Bot API**, a weather/maps/currency/news API, or an LLM API.

The app must: send a request, receive and handle the response, turn it into a
user-friendly result, handle network errors, and handle empty/malformed responses.

> Note: the Telegram Bot API (via aiogram polling) already satisfies this. Adding **one**
> external API (e.g. an LLM to parse natural-language tasks, or a reminder/weather feed)
> strengthens the project and fits a productivity product — but keep it optional until
> the core MVP is stable.

## SQL database (rubric §2.2)

Use an SQL database for persistent storage (SQLite is fine). ≥ 1 table; **two or more
related tables recommended**. Support add / read / update / delete-or-status-change.

Document, for the schema: tables, fields and types, primary keys, foreign keys,
required vs optional fields, uniqueness constraints, and each table's purpose. See
`architecture.md` for the concrete schema.

## Business logic (rubric §3)

Must go beyond fetch-and-display. **≥ 5 user scenarios.** Each scenario documents:
precondition, user action, app action, expected result, and error/alternative paths.

## Product description (rubric §4)

Prepare before coding: project name, the problem it solves, target audience, product
value, the MVP feature list (per feature: what the user does, inputs, what the app does,
what the user gets), and an explicit **out-of-MVP** list for future ideas.

---

## User-scenario template (rubric §5)

Use this shape for each of the ≥ 5 scenarios:

```
Scenario name → participant → preconditions → main flow → error cases → expected result
```

Suggested five for this productivity bot (adapt as needed):

1. **Add a task** — user sends `/add <text>`; app validates non-empty, links to the
   user, saves; user gets a confirmation.
2. **List tasks** — user sends `/list`; app returns only their tasks, numbered, with
   status; empty list returns a friendly message, not an error.
3. **Complete a task** — user sends `/done <n>`; app checks ownership, flips status,
   records the time.
4. **Delete a task** — user sends `/delete <n>`; app checks ownership, removes it,
   confirms.
5. **Validation / error path** — user sends `/add` with no text or `/done abc`; app
   explains the correct format instead of failing.

## Input validation (rubric §6)

Handle: empty values; too-short/too-long strings; wrong number format; wrong date
format; negatives where not allowed; duplicate records; unknown commands; edit/delete of
a non-existent record; out-of-order actions.

Every rejection tells the user **what happened, why, and how to fix it**. Never show raw
exception text or a stack trace.

## Error handling (rubric §7)

- **§7.1 Network:** no internet, timeout, server down, server error, unexpected format,
  empty external result.
- **§7.2 Database:** can't connect, can't save, record not found, uniqueness violation,
  related-data can't be deleted, corrupt data.
- **§7.3 User:** unknown command, missing required data, wrong format, disallowed
  action, repeated request.
- **§7.4 Unexpected:** catch the exception, log technical info, show a clear message,
  allow retry/return — never a full crash.

---

## Project structure (rubric §9)

Split code into logical parts: entry point, command/action handlers, business logic,
networking, database access, data models, configuration, error handling, helpers. No
single-file app. Names reflect purpose. (Concrete module map in `architecture.md`.)

## Configuration & security (rubric §10)

No secrets in source. Secrets = Telegram Bot Token, API keys, DB passwords, access
tokens. Use environment variables / `.env` / a git-excluded config file. Commit a
`.env.example` with no real values.

## Launch instructions (rubric §11)

`README.md` must contain: (1) name + short description, (2) implemented features,
(3) technologies, (4) run requirements, (5) install dependencies, (6) DB setup,
(7) token/API-key setup, (8) run command, (9) main user scenarios, (10) known
limitations. Bar: another developer can run it with no verbal explanation.

## Demonstration (rubric §12)

Show, on a working build: the problem, main features, ≥ 5 scenarios, save/read from SQL,
a network request, at least one handled error, the project structure, the QA checklist,
and future ideas.

---

## Minimum readiness — the "done" gate (rubric §13)

- [ ] App starts
- [ ] Stated core functionality works
- [ ] ≥ 5 user scenarios
- [ ] Uses an SQL database
- [ ] ≥ 1 network request
- [ ] Data persists across restarts
- [ ] Input validation implemented
- [ ] Network error handling implemented
- [ ] Database error handling implemented
- [ ] Requirements + functionality described
- [ ] User scenarios described
- [ ] QA checklist prepared and filled in
- [ ] Launch instructions present
- [ ] No secrets published in the repo

## Bonus criteria (rubric §14)

Several related tables · DB migrations · automated tests · logging · layered app ·
multiple user roles · Docker · deployment · CI/CD · clean UI · buttons/menus instead of
memorized commands · idempotent repeated actions · analytics/stats · API docs.

> Priority: extra features must not compromise MVP stability. Ship and verify the
> minimum set first, then add improvements.
