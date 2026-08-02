"""
test_api.py — End-to-end API tests against a throwaway database.

Covers every endpoint plus the validation, error, and user-isolation paths that
the QA checklist claims. The Telegram bot is disabled (empty BOT_TOKEN) so this
runs offline.

    python backend/tests/test_api.py
"""
import os, pathlib, sys

BACKEND = pathlib.Path(__file__).resolve().parent.parent
os.environ["BOT_TOKEN"] = ""
os.environ["DB_PATH"] = "smoketest.db"
os.environ["JWT_SECRET"] = "smoke-secret"
sys.path.insert(0, str(BACKEND))
dbfile = BACKEND / "smoketest.db"
for p in [dbfile, dbfile.with_suffix(".db-wal"), dbfile.with_suffix(".db-shm")]:
    p.unlink(missing_ok=True)

from fastapi.testclient import TestClient
import main

ok = fail = 0
def check(label, cond, extra=""):
    global ok, fail
    if cond: ok += 1; print(f"  PASS  {label}")
    else: fail += 1; print(f"  FAIL  {label} {extra}")

with TestClient(main.app) as c:
    print("\n[health]")
    r = c.get("/api/health"); check("health 200", r.status_code == 200, r.text)

    print("\n[auth]")
    r = c.post("/api/auth/register", json={"email":"a@example.com","password":"secret123","username":"Alice"})
    check("register 201", r.status_code == 201, r.text)
    tok_a = r.json()["access_token"]
    ha = {"Authorization": f"Bearer {tok_a}"}

    r = c.post("/api/auth/register", json={"email":"a@example.com","password":"secret123"})
    check("duplicate email -> 409", r.status_code == 409, r.text)
    r = c.post("/api/auth/register", json={"email":"not-an-email","password":"secret123"})
    check("bad email -> 422", r.status_code == 422)
    r = c.post("/api/auth/register", json={"email":"b@example.com","password":"123"})
    check("short password -> 422", r.status_code == 422)

    r = c.post("/api/auth/login", json={"email":"a@example.com","password":"wrongpass"})
    check("wrong password -> 401", r.status_code == 401)
    r = c.post("/api/auth/login", json={"email":"a@example.com","password":"secret123"})
    check("login 200", r.status_code == 200, r.text)

    r = c.get("/api/habits/today")
    check("no token -> 401", r.status_code == 401)
    r = c.get("/api/habits/today", headers={"Authorization":"Bearer garbage"})
    check("bad token -> 401", r.status_code == 401)

    r = c.get("/api/auth/me", headers=ha)
    check("me 200", r.status_code == 200 and r.json()["email"] == "a@example.com", r.text)
    r = c.post("/api/auth/link-code", headers=ha)
    check("link code 6 chars", r.status_code == 200 and len(r.json()["link_code"]) == 6, r.text)

    print("\n[habits]")
    r = c.get("/api/habits", headers=ha)
    check("6 habits seeded", r.status_code == 200 and len(r.json()) == 6, r.text)
    r = c.get("/api/habits/today", headers=ha)
    check("today lists 6 unlogged", r.status_code == 200 and all(h["value"] is None for h in r.json()), r.text)

    r = c.post("/api/habits/log", json={"habit_name":"water","value":2.0}, headers=ha)
    check("log water 201", r.status_code == 201, r.text)
    check("water completed", r.json()["is_completed"] is True and r.json()["progress"] == 100.0, r.text)
    r = c.post("/api/habits/log", json={"habit_name":"steps","value":5000}, headers=ha)
    check("steps 50%", r.status_code == 201 and r.json()["progress"] == 50.0, r.text)
    r = c.post("/api/habits/log", json={"habit_name":"sleep","value":22.5}, headers=ha)
    check("bedtime on target", r.status_code == 201 and r.json()["is_completed"] is True, r.text)

    r = c.post("/api/habits/log", json={"habit_name":"water","value":1.0}, headers=ha)
    check("re-log overwrites (no dup)", r.status_code == 201 and r.json()["value"] == 1.0, r.text)

    r = c.post("/api/habits/log", json={"habit_name":"pizza","value":1}, headers=ha)
    check("unknown habit -> 422", r.status_code == 422)
    r = c.post("/api/habits/log", json={"habit_name":"water","value":-5}, headers=ha)
    check("negative value -> 422", r.status_code == 422)
    r = c.post("/api/habits/log", json={"habit_name":"water","value":999}, headers=ha)
    check("out-of-range -> 400", r.status_code == 400, r.text)
    r = c.post("/api/habits/log", json={"habit_name":"water","value":1,"log_date":"31-12-2025"}, headers=ha)
    check("bad date -> 422", r.status_code == 422)

    r = c.get("/api/habits/today", headers=ha)
    logged = [h for h in r.json() if h["value"] is not None]
    check("3 habits logged today", len(logged) == 3, r.text)

    r = c.get("/api/habits/stats", headers=ha)
    check("stats total_logs=3", r.status_code == 200 and r.json()["total_logs"] == 3, r.text)
    r = c.get("/api/habits/history?days=7", headers=ha)
    check("history 3 rows", r.status_code == 200 and len(r.json()["logs"]) == 3, r.text)
    r = c.get("/api/habits/history?days=0", headers=ha)
    check("days=0 -> 422", r.status_code == 422)

    print("\n[user isolation]")
    r = c.post("/api/auth/register", json={"email":"bob@example.com","password":"secret123"})
    hb = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = c.get("/api/habits/today", headers=hb)
    check("Bob sees no Alice data", all(h["value"] is None for h in r.json()), r.text)
    r = c.get("/api/habits/stats", headers=hb)
    check("Bob total_logs=0", r.json()["total_logs"] == 0, r.text)

    print("\n[quotes]")
    r = c.get("/api/quotes/daily", headers=ha)
    check("3 daily quotes", r.status_code == 200 and len(r.json()) == 3, r.text)
    first = r.json()
    r2 = c.get("/api/quotes/daily", headers=ha)
    check("same quotes on repeat call", r2.json() == first)
    rb = c.get("/api/quotes/daily", headers=hb)
    check("Bob gets his own 3", len(rb.json()) == 3)

    print("\n[reminders]")
    r = c.post("/api/reminders", json={"message":"Drink water","remind_at":"21:00","habit_name":"water"}, headers=ha)
    check("create reminder 201", r.status_code == 201, r.text)
    rid = r.json()["id"]
    r = c.post("/api/reminders", json={"message":"x","remind_at":"25:99"}, headers=ha)
    check("bad time -> 422", r.status_code == 422)
    r = c.post("/api/reminders", json={"message":"","remind_at":"21:00"}, headers=ha)
    check("empty message -> 422", r.status_code == 422)
    r = c.post("/api/reminders", json={"message":"x","remind_at":"21:00","habit_name":"pizza"}, headers=ha)
    check("unknown habit -> 400", r.status_code == 400, r.text)
    r = c.get("/api/reminders", headers=ha)
    check("Alice has 1 reminder", len(r.json()) == 1, r.text)
    r = c.get("/api/reminders", headers=hb)
    check("Bob has 0 reminders", len(r.json()) == 0, r.text)
    r = c.delete(f"/api/reminders/{rid}", headers=hb)
    check("Bob cannot delete Alice's -> 404", r.status_code == 404, r.text)
    r = c.delete(f"/api/reminders/{rid}", headers=ha)
    check("Alice deletes her own", r.status_code == 200, r.text)
    r = c.delete(f"/api/reminders/{rid}", headers=ha)
    check("delete twice -> 404", r.status_code == 404)

    print("\n[delete habit log]")
    r = c.delete("/api/habits/log/water", headers=hb)
    check("Bob deleting Alice's log -> 404", r.status_code == 404)
    r = c.delete("/api/habits/log/water", headers=ha)
    check("Alice deletes her log", r.status_code == 200, r.text)
    r = c.delete("/api/habits/log/pizza", headers=ha)
    check("unknown habit -> 404", r.status_code == 404)

print(f"\n=== {ok} passed, {fail} failed ===")
sys.exit(1 if fail else 0)
