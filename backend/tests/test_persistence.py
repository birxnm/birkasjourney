"""
test_persistence.py — Data survives a restart, and seeding stays idempotent.

Starts the app three times against the same database file and checks that the
account, habit log, and reminder are all still there, while the seeded habits
and quotes are not duplicated.

    python backend/tests/test_persistence.py
"""

import os, pathlib, sys

BACKEND = pathlib.Path(__file__).resolve().parent.parent
os.environ["BOT_TOKEN"] = ""; os.environ["DB_PATH"] = "smoketest.db"
os.environ["JWT_SECRET"] = "persistence-check-secret-key-long-enough"
sys.path.insert(0, str(BACKEND))
for p in BACKEND.glob("smoketest.db*"): p.unlink()
from fastapi.testclient import TestClient
import main, database as db, asyncio

def counts():
    async def go():
        c = await db.get_db()
        try:
            out = {}
            for t in ("habits","quotes","habit_logs","reminders","users"):
                out[t] = (await (await c.execute(f"SELECT COUNT(*) FROM {t}")).fetchone())[0]
            return out
        finally: await c.close()
    return asyncio.run(go())

# Run 1: create data
with TestClient(main.app) as c:
    h = {"Authorization": "Bearer " + c.post("/api/auth/register",
        json={"email":"p@example.com","password":"secret123"}).json()["access_token"]}
    c.post("/api/habits/log", json={"habit_name":"water","value":2.0}, headers=h)
    c.post("/api/reminders", json={"message":"Persist me","remind_at":"21:00"}, headers=h)
    c.get("/api/quotes/daily", headers=h)
    before = c.get("/api/habits/today", headers=h).json()
print("after run 1:", counts())

# Run 2 and 3: restart twice against the same file
for run in (2, 3):
    with TestClient(main.app) as c:
        tok = c.post("/api/auth/login", json={"email":"p@example.com","password":"secret123"})
        assert tok.status_code == 200, tok.text
        h = {"Authorization": "Bearer " + tok.json()["access_token"]}
        after = c.get("/api/habits/today", headers=h).json()
        rem = c.get("/api/reminders", headers=h).json()
    print(f"after run {run}:", counts())

water = [x for x in after if x["name"] == "water"][0]
assert water["value"] == 2.0, water
assert len(rem) == 1 and rem[0]["message"] == "Persist me", rem
final = counts()
assert final["habits"] == 6, final
assert final["quotes"] == 107, final
assert final["habit_logs"] == 1, final
print("\nOK: habit log, reminder, and account survived two restarts;"
      f" seeds not duplicated ({final['habits']} habits, {final['quotes']} quotes)")

for p in BACKEND.glob("smoketest.db*"): p.unlink()
