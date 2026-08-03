/*
 * MyHabits.jsx — The habits this user created, with delete.
 *
 * Built-in habits never appear here: they have no owner, and the API refuses
 * to delete them. Before an empty list, the card shows the empty state that
 * invites the first habit.
 */

import { useState } from "react";

import { API } from "../api.js";
import { textOn } from "../habits.js";
import EmptyState from "./EmptyState.jsx";
import { useToast } from "./Toast.jsx";

function HabitChip({ habit, onChanged }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function remove() {
    setBusy(true);
    try {
      await API.deleteHabit(habit.id);
      toast(`${habit.display_name} deleted`);
      await onChanged();
    } catch (error) {
      toast(error.message, true);
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    // The habit's own colour fills the whole block; the label follows it.
    <div
      className="my-habit"
      style={
        habit.color ? { background: habit.color, color: textOn(habit.color) } : undefined
      }
    >
      <span className="my-habit-icon" aria-hidden="true">
        {habit.icon || "•"}
      </span>
      <div className="my-habit-body">
        <div className="my-habit-name">{habit.display_name}</div>
        <div className="my-habit-meta">
          {habit.target_days}× a week
          {habit.category ? ` · ${habit.category}` : ""}
        </div>
        {habit.notes && <p className="my-habit-notes">{habit.notes}</p>}
      </div>

      {confirming ? (
        <div className="habit-actions">
          <button className="btn btn-sm btn-danger" type="button" disabled={busy} onClick={remove}>
            {busy ? "…" : "Delete"}
          </button>
          <button
            className="btn btn-sm"
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Keep
          </button>
        </div>
      ) : (
        <button
          className="btn btn-sm"
          type="button"
          title="Delete this habit"
          aria-label={`Delete ${habit.display_name}`}
          onClick={() => setConfirming(true)}
        >
          🗑
        </button>
      )}
    </div>
  );
}

export default function MyHabits({ habits, onAdd, onChanged }) {
  if (!habits.length) return <EmptyState onAdd={onAdd} />;

  return (
    <div className="my-habits">
      {habits.map((habit) => (
        <HabitChip key={habit.id} habit={habit} onChanged={onChanged} />
      ))}
    </div>
  );
}
