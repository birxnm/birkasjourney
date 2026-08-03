"""
test_habits.py — Custom habits: create, edit, delete, log, and isolate.

Covers the habit-management endpoints added for the dashboard's Add Habit form,
including the rules that keep one user's habits invisible to another and the
built-in six undeletable. Runs offline against a throwaway database.

    python backend/tests/test_habits.py
"""
import os, pathlib, sys

BACKEND = pathlib.Path(__file__).resolve().parent.parent
os.environ["BOT_TOKEN"] = ""
os.environ["DB_PATH"] = "habitstest.db"
os.environ["JWT_SECRET"] = "smoke-secret"
sys.path.insert(0, str(BACKEND))
dbfile = BACKEND / "habitstest.db"
for p in [dbfile, dbfile.with_suffix(".db-wal"), dbfile.with_suffix(".db-shm")]:
    p.unlink(missing_ok=True)

from fastapi.testclient import TestClient
import main
import services

ok = fail = 0
def check(label, cond, extra=""):
    global ok, fail
    if cond: ok += 1; print(f"  PASS  {label}")
    else: fail += 1; print(f"  FAIL  {label} {extra}")


print("\n[name slugs]")
check("spaces become underscores", services.slugify_habit_name("Morning Run") == "morning_run")
check("punctuation dropped", services.slugify_habit_name("Read 30 min!") == "read_30_min")
check("case folded", services.slugify_habit_name("GYM") == "gym")
# A non-Latin name has no readable slug, so it falls back to a stable digest.
cyrillic = services.slugify_habit_name("Пить воду")
check("non-latin name still gets a slug", cyrillic.startswith("habit_"), cyrillic)
check("same name gives the same slug", services.slugify_habit_name("пить воду") == cyrillic)


with TestClient(main.app) as c:
    def register(email, name):
        r = c.post("/api/auth/register",
                   json={"email": email, "password": "secret123", "username": name})
        assert r.status_code == 201, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    ha = register("alice@example.com", "Alice")
    hb = register("bob@example.com", "Bob")

    print("\n[create]")
    r = c.post("/api/habits", headers=ha, json={
        "display_name": "Morning Run", "icon": "🏃", "color": "#a78bfa",
        "category": "Health & Fitness", "target_days": 5,
        "notes": "Before breakfast", "reminder_time": "07:30"})
    check("create -> 201", r.status_code == 201, r.text)
    habit = r.json()
    hid = habit["id"]
    check("slug derived from the name", habit["name"] == "morning_run", habit)
    check("kind is binary", habit["kind"] == "binary")
    check("marked as the user's own", habit["is_custom"] is True)
    check("reminder time echoed back", habit["reminder_time"] == "07:30")

    r = c.get("/api/reminders", headers=ha)
    check("reminder was actually stored",
          any(x["remind_at"] == "07:30" for x in r.json()), r.text)

    print("\n[validation]")
    check("blank name -> 422",
          c.post("/api/habits", headers=ha, json={"display_name": "   "}).status_code == 422)
    check("duplicate name -> 400",
          c.post("/api/habits", headers=ha, json={"display_name": "morning run"}).status_code == 400)
    check("target_days 0 -> 422",
          c.post("/api/habits", headers=ha, json={"display_name": "A", "target_days": 0}).status_code == 422)
    check("target_days 8 -> 422",
          c.post("/api/habits", headers=ha, json={"display_name": "A", "target_days": 8}).status_code == 422)
    check("unknown category -> 422",
          c.post("/api/habits", headers=ha, json={"display_name": "A", "category": "Nope"}).status_code == 422)
    check("colour must be a hex code -> 422",
          c.post("/api/habits", headers=ha, json={"display_name": "A", "color": "red"}).status_code == 422)
    check("impossible reminder time -> 422",
          c.post("/api/habits", headers=ha, json={"display_name": "A", "reminder_time": "99:99"}).status_code == 422)
    check("no token -> 401", c.post("/api/habits", json={"display_name": "A"}).status_code == 401)

    print("\n[user isolation]")
    names_a = [h["name"] for h in c.get("/api/habits", headers=ha).json()]
    names_b = [h["name"] for h in c.get("/api/habits", headers=hb).json()]
    check("owner sees their habit", "morning_run" in names_a)
    check("the other user does not", "morning_run" not in names_b, names_b)
    check("both still see the built-ins", "water" in names_a and "water" in names_b)
    check("Bob cannot edit Alice's habit -> 404",
          c.patch(f"/api/habits/{hid}", headers=hb, json={"display_name": "Hijacked"}).status_code == 404)
    check("Bob cannot delete Alice's habit -> 404",
          c.delete(f"/api/habits/{hid}", headers=hb).status_code == 404)
    check("Bob cannot log Alice's habit -> 400",
          c.post("/api/habits/log", headers=hb,
                 json={"habit_name": "morning_run", "value": 1}).status_code == 400)
    # Same name, different owner: allowed, and they stay separate rows.
    r = c.post("/api/habits", headers=hb, json={"display_name": "Morning Run"})
    check("Bob may use the same name -> 201", r.status_code == 201, r.text)
    check("and gets his own row", r.json()["id"] != hid)

    print("\n[built-ins are protected]")
    builtin = next(h for h in c.get("/api/habits", headers=ha).json() if h["name"] == "water")
    check("built-in not deletable -> 404",
          c.delete(f"/api/habits/{builtin['id']}", headers=ha).status_code == 404)
    check("built-in not editable -> 404",
          c.patch(f"/api/habits/{builtin['id']}", headers=ha,
                  json={"display_name": "Nope"}).status_code == 404)

    print("\n[logging a yes/no habit]")
    r = c.post("/api/habits/log", headers=ha, json={"habit_name": "morning_run", "value": 1})
    check("logs -> 201", r.status_code == 201, r.text)
    check("counts as completed", r.json()["is_completed"] is True, r.json())
    check("a value above 1 -> 400",
          c.post("/api/habits/log", headers=ha,
                 json={"habit_name": "morning_run", "value": 2}).status_code == 400)

    today = {h["name"]: h for h in c.get("/api/habits/today", headers=ha).json()}
    check("appears in today", "morning_run" in today)
    check("week counter starts at 1", today["morning_run"]["days_done"] == 1, today.get("morning_run"))
    check("weekly target preserved", today["morning_run"]["target_days"] == 5)
    check("progress is all-or-nothing", today["morning_run"]["progress"] == 100.0)
    check("built-in habits unaffected", today["water"]["kind"] == "measured")

    print("\n[edit]")
    r = c.patch(f"/api/habits/{hid}", headers=ha,
                json={"display_name": "Evening Run", "target_days": 3})
    check("owner can edit -> 200", r.status_code == 200, r.text)
    check("name updated", r.json()["display_name"] == "Evening Run")
    check("target updated", r.json()["target_days"] == 3)
    check("empty patch -> 400", c.patch(f"/api/habits/{hid}", headers=ha, json={}).status_code == 400)
    check("missing habit -> 404",
          c.patch("/api/habits/99999", headers=ha, json={"display_name": "x"}).status_code == 404)

    print("\n[delete]")
    check("owner can delete -> 200", c.delete(f"/api/habits/{hid}", headers=ha).status_code == 200)
    check("gone from the list",
          "morning_run" not in [h["name"] for h in c.get("/api/habits", headers=ha).json()])
    check("its logs went with it",
          "morning_run" not in [h["name"] for h in c.get("/api/habits/today", headers=ha).json()])
    check("deleting twice -> 404", c.delete(f"/api/habits/{hid}", headers=ha).status_code == 404)

print(f"\n=== {ok} passed, {fail} failed ===")
sys.exit(1 if fail else 0)
