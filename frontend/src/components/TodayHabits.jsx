/*
 * TodayHabits.jsx — Today's row for every habit the user tracks.
 *
 * A measured habit (water, steps, …) shows value against target with a
 * progress bar. A yes/no habit shows a single toggle and how the week is
 * going against its target — tapping it logs "done today", tapping again
 * clears the entry.
 */

import { useState } from "react";

import { API } from "../api.js";
import { formatValue } from "../habits.js";
import { useToast } from "./Toast.jsx";

function MeasuredRow({ habit, onChanged }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const logged = habit.value !== null && habit.value !== undefined;
  const shown = formatValue(habit, habit.value);
  const target = formatValue(habit, habit.target_value);
  const unit = habit.unit === "time" ? "" : ` ${habit.unit || ""}`;
  const progress = logged ? habit.progress : 0;
  const status = habit.is_completed ? "✅" : logged ? "⏳" : "";

  async function clearEntry() {
    setBusy(true);
    try {
      await API.deleteLog(habit.name);
      toast("Entry cleared");
      await onChanged();
    } catch (error) {
      toast(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="habit">
      <div className="habit-icon" aria-hidden="true">
        {habit.icon || "•"}
      </div>
      <div>
        <div className="habit-name">
          {habit.display_name} {status}
        </div>
        <div className="habit-meta">
          {logged
            ? `${shown} / ${target}${unit} · ${progress.toFixed(0)}%`
            : "Not logged yet"}
        </div>
        <div className={`bar${habit.is_completed ? " done" : ""}`}>
          <span style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>
      <div className="habit-actions">
        {logged && (
          <button
            className="btn btn-sm"
            type="button"
            title="Clear today's entry"
            aria-label={`Clear today's entry for ${habit.display_name}`}
            disabled={busy}
            onClick={clearEntry}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function BinaryRow({ habit, onChanged }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const done = habit.value !== null && habit.value !== undefined;
  const target = habit.target_days || 7;

  async function toggle() {
    setBusy(true);
    try {
      if (done) {
        await API.deleteLog(habit.name);
        toast(`${habit.display_name} unmarked`);
      } else {
        await API.log({ habit_name: habit.name, value: 1 });
        toast(`${habit.display_name} done today 🎉`);
      }
      await onChanged();
    } catch (error) {
      toast(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  const weekProgress = Math.min((habit.days_done / target) * 100, 100);

  return (
    <div className="habit">
      {/* The icon tile carries the habit's colour, so the row is identifiable
          at a glance without a second label. */}
      <div
        className="habit-icon"
        aria-hidden="true"
        style={habit.color ? { background: habit.color } : undefined}
      >
        {habit.icon || "•"}
      </div>
      <div>
        <div className="habit-name">
          {habit.display_name} {done ? "✅" : ""}
        </div>
        <div className="habit-meta">
          {habit.days_done}/{target} days this week
          {habit.category ? ` · ${habit.category}` : ""}
        </div>
        <div className={`bar${habit.days_done >= target ? " done" : ""}`}>
          <span
            style={{
              width: `${weekProgress}%`,
              background: habit.color || undefined,
            }}
          />
        </div>
      </div>
      <div className="habit-actions">
        <button
          className={`btn btn-sm${done ? " btn-done" : ""}`}
          type="button"
          aria-pressed={done}
          disabled={busy}
          onClick={toggle}
        >
          {done ? "Done" : "Mark done"}
        </button>
      </div>
    </div>
  );
}

export default function TodayHabits({ habits, onChanged }) {
  if (!habits.length) return <p className="empty">No habits yet.</p>;

  return (
    <div>
      {habits.map((habit) =>
        habit.kind === "binary" ? (
          <BinaryRow key={habit.habit_id} habit={habit} onChanged={onChanged} />
        ) : (
          <MeasuredRow key={habit.habit_id} habit={habit} onChanged={onChanged} />
        )
      )}
    </div>
  );
}
