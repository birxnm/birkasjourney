"""
test_bot.py — Bot layer unit tests: command parsing, formatting, keyboards.

No Telegram network calls are made; only the pure functions are exercised.

    python backend/tests/test_bot.py
"""
import os, pathlib, sys

BACKEND = pathlib.Path(__file__).resolve().parent.parent
os.environ.setdefault("BOT_TOKEN", "0:test")
sys.path.insert(0, str(BACKEND))

import bot.runner, bot.handlers, bot.keyboards, scheduler          # noqa: F401
from bot import bot_services as bs

print("imports ok — handlers:", len(bot.handlers.router.observers["message"].handlers),
      "message,", len(bot.handlers.router.observers["callback_query"].handlers), "callback")

ok = fail = 0
def check(label, cond, extra=""):
    global ok, fail
    if cond: ok += 1; print(f"  PASS  {label}")
    else: fail += 1; print(f"  FAIL  {label} {extra}")

def raises(fn, *a):
    try: fn(*a); return None
    except ValueError as e: return str(e)

print("\n[/log parsing]")
check("water 1.5", bs.parse_log_command("water 1.5") == ("water", 1.5))
check("comma decimal", bs.parse_log_command("water 1,5") == ("water", 1.5))
check("alias bedtime->sleep", bs.parse_log_command("bedtime 22:30") == ("sleep", 22.5))
check("alias it->it_projects", bs.parse_log_command("it 2") == ("it_projects", 2.0))
check("steps int", bs.parse_log_command("steps 8000") == ("steps", 8000.0))
check("missing value errors", raises(bs.parse_log_command, "water") is not None)
# An unrecognised name is passed through as a custom-habit slug — only the
# database knows whether this user has one, so services decides, not the parser.
check("custom habit slug passes through", bs.parse_log_command("morning_run 1") == ("morning_run", 1.0))
check("custom habit without a value means done", bs.parse_log_command("morning_run") == ("morning_run", 1.0))
check("unreadable habit name errors",
      "isn't a habit name" in (raises(bs.parse_log_command, "piz-za! 1") or ""))
check("non-numeric errors", "not a number" in (raises(bs.parse_log_command, "water abc") or ""))
check("time habit needs HH:MM", "needs a time" in (raises(bs.parse_log_command, "bedtime 22") or ""))
check("empty args errors", raises(bs.parse_log_command, "") is not None)

print("\n[/remind parsing]")
check("valid", bs.parse_remind_command("21:00 Drink water") == ("21:00", "Drink water"))
check("pads hour", bs.parse_remind_command("9:05 Sleep") == ("09:05", "Sleep"))
check("multiword message", bs.parse_remind_command("07:30 Wake up and stretch")[1] == "Wake up and stretch")
check("no message errors", raises(bs.parse_remind_command, "21:00") is not None)
check("bad time errors", "not a time" in (raises(bs.parse_remind_command, "abc Hi") or ""))
check("hour out of range", "between 00:00" in (raises(bs.parse_remind_command, "99:00 Hi") or ""))
check("too long errors", raises(bs.parse_remind_command, "21:00 " + "x"*501) is not None)

print("\n[formatting]")
conf = bs.format_log_confirmation({
    "icon":"💧","display_name":"Water Intake","value":2.0,"target":2.0,
    "unit":"litres","is_completed":True,"progress":100.0})
check("confirmation shows target reached", "Target reached" in conf and "2 / 2" in conf, conf)
timeconf = bs.format_log_confirmation({
    "icon":"🌙","display_name":"Bedtime","value":22.5,"target":22.5,
    "unit":"time","is_completed":True,"progress":100.0})
check("time habit renders HH:MM", "22:30 / 22:30" in timeconf, timeconf)
check("empty summary is friendly", "No entries yet" in bs.format_week_summary([]))
summary = bs.format_week_summary([
    {"name":"water","display_name":"Water Intake","icon":"💧","value":2.0,"is_completed":1,"log_date":"2026-08-01"},
    {"name":"water","display_name":"Water Intake","icon":"💧","value":1.0,"is_completed":0,"log_date":"2026-08-02"},
])
check("summary counts days on target", "1/2 days on target" in summary, summary)
check("summary counts active days", "2 active day(s)" in summary, summary)

print("\n[keyboards]")
kb = bot.keyboards.habit_picker()
check("habit picker has all 6 + back", sum(len(r) for r in kb.inline_keyboard) == 7)
vk = bot.keyboards.value_picker("water")
cbs = [b.callback_data for row in vk.inline_keyboard for b in row]
check("water presets encode values", "log:water:2" in cbs, cbs)
check("every callback under 64 bytes", all(len(c.encode()) <= 64 for c in cbs))

print(f"\n=== {ok} passed, {fail} failed ===")
sys.exit(1 if fail else 0)
