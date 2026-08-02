"""
test_link.py — /link merges a bot-only account into a web account.

Reproduces the real failure: tapping Start in the bot before registering on the
web creates two rows, and the old link code hit UNIQUE(telegram_id) instead of
merging them.

    python backend/tests/test_link.py
"""

import asyncio, os, pathlib, sys

BACKEND = pathlib.Path(__file__).resolve().parent.parent
os.environ["BOT_TOKEN"] = ""
os.environ["DB_PATH"] = "smoketest.db"
os.environ["JWT_SECRET"] = "link-test-secret-key-long-enough-for-hs256"
sys.path.insert(0, str(BACKEND))
for p in BACKEND.glob("smoketest.db*"):
    p.unlink()

import database as db
import services
from quotes_data import QUOTES

ok = fail = 0


def check(label, cond, extra=""):
    global ok, fail
    if cond:
        ok += 1
        print(f"  PASS  {label}")
    else:
        fail += 1
        print(f"  FAIL  {label} {extra}")


async def main():
    await db.init_db()
    await db.seed_habits()
    await db.seed_quotes(QUOTES)

    TG = 555000111

    print("\n[bot-only account is merged into the web account]")
    # Bot first: /start creates a Telegram-only row, then two entries are logged.
    bot_user = await services.get_or_create_telegram_user(TG, "birxnm")
    await services.log_habit_for_user(bot_user["id"], "water", 2.0)
    await db.create_reminder(bot_user["id"], "From the bot", "21:00")

    # Then the same person registers on the web.
    web_id = await db.create_user(email="a@example.com", password_hash="x", username="Birka")

    outcome = await db.link_telegram_to_user(web_id, TG)
    check("outcome is 'merged'", outcome == "merged", outcome)

    web_user = await db.get_user_by_id(web_id)
    check("web row now holds the telegram_id", web_user["telegram_id"] == TG, web_user)
    check("bot-only row is gone", await db.get_user_by_id(bot_user["id"]) is None)
    check("email survived the merge", web_user["email"] == "a@example.com")

    logs = await db.get_today_logs(web_id, __import__("datetime").date.today().isoformat())
    water = [row for row in logs if row["name"] == "water"][0]
    check("habit log moved to the web account", water["value"] == 2.0, water)
    rem = await db.get_user_reminders(web_id)
    check("reminder moved too", len(rem) == 1 and rem[0]["message"] == "From the bot", rem)
    check("lookup by telegram_id finds the merged row",
          (await db.get_user_by_telegram_id(TG))["id"] == web_id)

    print("\n[re-linking the same pair is a no-op]")
    check("outcome is 'already'", await db.link_telegram_to_user(web_id, TG) == "already")

    print("\n[a real second account is never absorbed]")
    other_id = await db.create_user(email="b@example.com", password_hash="y")
    outcome = await db.link_telegram_to_user(other_id, TG)
    check("outcome is 'conflict'", outcome == "conflict", outcome)
    check("first account keeps the telegram_id",
          (await db.get_user_by_id(web_id))["telegram_id"] == TG)
    check("second account gets nothing",
          (await db.get_user_by_id(other_id))["telegram_id"] is None)

    print("\n[plain link when no one holds the id]")
    fresh_id = await db.create_user(email="c@example.com", password_hash="z")
    check("outcome is 'linked'", await db.link_telegram_to_user(fresh_id, 999888777) == "linked")

    print("\n[colliding entries do not break the merge]")
    TG2 = 555000222
    bot2 = await services.get_or_create_telegram_user(TG2, "dup")
    await services.log_habit_for_user(bot2["id"], "steps", 3000)
    web2 = await db.create_user(email="d@example.com", password_hash="w")
    await services.log_habit_for_user(web2, "steps", 9000)   # same habit, same day
    outcome = await db.link_telegram_to_user(web2, TG2)
    check("still merges", outcome == "merged", outcome)
    logs2 = await db.get_today_logs(web2, __import__("datetime").date.today().isoformat())
    steps = [row for row in logs2 if row["name"] == "steps"]
    check("web value wins, no duplicate row", len(steps) == 1 and steps[0]["value"] == 9000, steps)


asyncio.run(main())
for p in BACKEND.glob("smoketest.db*"):
    p.unlink()
print(f"\n=== {ok} passed, {fail} failed ===")
sys.exit(1 if fail else 0)
