/*
 * DashboardPage.jsx — The main screen.
 *
 * Owns the data every card reads (today, stats, history, habit definitions) and
 * the single refresh() that reloads them together, so the page never shows a
 * mix of old and new numbers.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { API, Auth } from "../api.js";
import AddHabitModal from "../components/AddHabitModal.jsx";
import { CompletionBarChart, HabitLineChart } from "../components/Charts.jsx";
import LogForm from "../components/LogForm.jsx";
import MyHabits from "../components/MyHabits.jsx";
import QuotesCard from "../components/QuotesCard.jsx";
import RemindersCard from "../components/RemindersCard.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import TodayHabits from "../components/TodayHabits.jsx";
import { useToast } from "../components/Toast.jsx";
import { useUser } from "../hooks/useUser.js";
import { ROUTES, navigate } from "../router.js";

const LINK_CODE_MS = 300000; // the code expires server-side after five minutes

export default function DashboardPage() {
  const { user, name } = useUser();
  const toast = useToast();

  const [today, setToday] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chartHabit, setChartHabit] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [reminderKey, setReminderKey] = useState(0);

  /** Reload habits, stats, and charts together. */
  const refresh = useCallback(async () => {
    try {
      const [todayData, statsData, historyData, definitionData] = await Promise.all([
        API.today(),
        API.stats(7),
        API.history(7),
        API.habits(),
      ]);
      setToday(todayData);
      setStats(statsData);
      setHistory(historyData.logs);
      setDefinitions(definitionData);
    } catch (error) {
      toast(error.message, true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const measured = useMemo(() => today.filter((h) => h.kind !== "binary"), [today]);
  const customHabits = useMemo(() => definitions.filter((h) => h.is_custom), [definitions]);

  const selectedChartHabit =
    measured.find((h) => h.name === chartHabit) ?? measured[0] ?? null;

  const doneToday = today.filter((h) => h.is_completed).length;
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function requestLinkCode() {
    try {
      const { link_code: code } = await API.linkCode();
      setLinkCode(code);
      setTimeout(() => setLinkCode(""), LINK_CODE_MS);
    } catch (error) {
      toast(error.message, true);
    }
  }

  /** Called after the modal saves: reload everything and the reminder list. */
  async function handleCreated() {
    setReminderKey((key) => key + 1);
    await refresh();
  }

  return (
    <div className="container">
      <header className="topbar">
        <div>
          <h1>Birka's Journey</h1>
          <p className="sub">
            <button className="linklike" type="button" onClick={() => navigate(ROUTES.welcome)}>
              Welcome back, {name}
            </button>
            {user?.telegram_id ? " · Telegram linked ✅" : ""}
          </p>
        </div>
        <div className="habit-actions">
          <button className="btn btn-sm btn-add" type="button" onClick={() => setModalOpen(true)}>
            + Add Habit
          </button>
          <button className="btn btn-sm" type="button" onClick={requestLinkCode}>
            🔗 Link Telegram
          </button>
          <ThemeToggle />
          <button className="btn btn-sm" type="button" onClick={() => Auth.logout()}>
            Log out
          </button>
        </div>
      </header>

      {linkCode && (
        <div className="alert alert-success">
          Send this to the bot within 5 minutes:
          <div style={{ marginTop: "0.5rem" }}>
            <code className="code-pill">/link {linkCode}</code>
          </div>
        </div>
      )}

      <section className="grid grid-stats" style={{ marginBottom: "1rem" }}>
        <div className="card stat">
          <div className="label">Current streak</div>
          <div className="value">{stats ? `${stats.streak} 🔥` : "—"}</div>
        </div>
        <div className="card stat">
          <div className="label">7-day completion</div>
          <div className="value">{stats ? `${stats.completion_rate}%` : "—"}</div>
        </div>
        <div className="card stat">
          <div className="label">Today done</div>
          <div className="value">{loading ? "—" : `${doneToday}/${today.length}`}</div>
        </div>
        <div className="card stat">
          <div className="label">Total entries</div>
          <div className="value">{stats ? stats.total_logs : "—"}</div>
        </div>
      </section>

      <div className="grid grid-main">
        <div>
          <section className="card">
            <div className="card-title">
              <h2>Today's habits</h2>
              <span className="muted">{todayLabel}</span>
            </div>
            {loading ? <p className="empty">Loading habits…</p> : (
              <TodayHabits habits={today} onChanged={refresh} />
            )}
          </section>

          <section className="card">
            <div className="card-title">
              <h2>Your own habits</h2>
              {customHabits.length > 0 && (
                <button className="btn btn-sm btn-add" type="button" onClick={() => setModalOpen(true)}>
                  + Add Habit
                </button>
              )}
            </div>
            {loading ? (
              <p className="empty">Loading…</p>
            ) : (
              <MyHabits
                habits={customHabits}
                onAdd={() => setModalOpen(true)}
                onChanged={refresh}
              />
            )}
          </section>

          <section className="card">
            <div className="card-title">
              <h2>Log an entry</h2>
            </div>
            <LogForm habits={today} onLogged={refresh} />
          </section>

          <section className="card">
            <div className="card-title">
              <h2>Weekly progress</h2>
              <select
                style={{ width: "auto" }}
                aria-label="Habit to chart"
                value={selectedChartHabit?.name ?? ""}
                onChange={(e) => setChartHabit(e.target.value)}
              >
                {measured.map((habit) => (
                  <option key={habit.name} value={habit.name}>
                    {habit.icon || ""} {habit.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="chart-box">
              {selectedChartHabit && (
                <HabitLineChart logs={history} habit={selectedChartHabit} />
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-title">
              <h2>Completion by habit — last 7 days</h2>
            </div>
            <div className="chart-box">
              {today.length > 0 && <CompletionBarChart logs={history} habits={today} />}
            </div>
          </section>
        </div>

        <aside>
          <QuotesCard />
          <RemindersCard refreshKey={reminderKey} />
        </aside>
      </div>

      <AddHabitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
