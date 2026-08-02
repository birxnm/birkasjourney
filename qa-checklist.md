# Manual QA checklist

Fill this in with **real results** from a test Telegram bot before the demo. The rubric
requires ≥ 10 checks covering the happy path, all mandatory features, the database,
network requests, input validation, error handling, and edge cases. Mark each row and
add real results at the end.

Run scenarios in order in a real chat. Only tick a box after you actually observe the
result.

## A. Core functionality (happy path)

| # | Check              | Steps                          | Expected result                         | Result |
|---|--------------------|--------------------------------|-----------------------------------------|--------|
| 1 | App starts         | Run per README instructions    | Bot starts with no errors               | ☐ pass / ☐ fail |
| 2 | `/start`           | Send `/start`                  | Greeting + command list                 | ☐ pass / ☐ fail |
| 3 | Add a task         | `/add Купить продукты`         | Success confirmation                    | ☐ pass / ☐ fail |
| 4 | List tasks         | `/list`                        | The added task appears in the list      | ☐ pass / ☐ fail |
| 5 | Complete a task    | `/done 1`                      | Task status changes to done             | ☐ pass / ☐ fail |
| 6 | Delete a task      | `/delete 1`                    | Task disappears from the list           | ☐ pass / ☐ fail |

## B. Network & database

| # | Check              | Steps                          | Expected result                         | Result |
|---|--------------------|--------------------------------|-----------------------------------------|--------|
| 7 | Network request    | Trigger the feature that calls the API (Bot API polling counts) | Response handled and shown to the user | ☐ pass / ☐ fail |
| 8 | Network error      | Disconnect internet, repeat the network scenario | Clear message; bot does not crash | ☐ pass / ☐ fail |
| 9 | Data persists      | Add a task, stop and restart the bot, `/list` | The task is still there                | ☐ pass / ☐ fail |

## C. Input validation & error handling

| #  | Check             | Steps                          | Expected result                          | Result |
|----|-------------------|--------------------------------|------------------------------------------|--------|
| 10 | Empty required field | `/add` with no text         | Bot explains the correct command format  | ☐ pass / ☐ fail |
| 11 | Non-existent record  | `/done 100`                 | "Task with that number was not found"    | ☐ pass / ☐ fail |
| 12 | Wrong format         | `/delete abc`               | "Enter a valid number"                   | ☐ pass / ☐ fail |
| 13 | Repeated action      | `/done` twice on same task  | No unexplained error, no wrong change    | ☐ pass / ☐ fail |
| 14 | Duplicate handling   | Recreate the same unique record (if uniqueness applies) | Duplicate not created; clear explanation | ☐ pass / ☐ fail |

## D. Isolation & persistence (can't be replaced by one UI check)

| #  | Check             | Steps                          | Expected result                          | Result |
|----|-------------------|--------------------------------|------------------------------------------|--------|
| 15 | Personal lists    | Two different Telegram accounts each `/list` | Each sees only their own tasks | ☐ pass / ☐ fail |
| 16 | Restart survives  | Stop and restart the app       | Previously added tasks are preserved     | ☐ pass / ☐ fail |

---

## Final MVP sign-off (mirror of the rubric readiness gate)

- [ ] `/start` works
- [ ] `/add` adds a task
- [ ] `/list` shows the personal list
- [ ] `/done` changes status
- [ ] `/delete` removes a task
- [ ] Invalid input is handled
- [ ] Data is stored in SQLite
- [ ] Users are isolated
- [ ] `BOT_TOKEN` is not in code
- [ ] Code is split into modules

## Actual test run

Record real outcomes here before the demo:

- Date tested:
- Bot version / commit:
- Passed: __ / 16
- Failed checks + notes:
