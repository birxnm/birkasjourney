/*
 * EmptyState.jsx — Shown in the "Your own habits" card before the first one.
 */

import Mascot from "./Mascot.jsx";

export default function EmptyState({ onAdd }) {
  return (
    <div className="empty-state">
      <div className="empty-mascot">
        <Mascot shape="square" color="var(--lime)" arms />
      </div>
      <h3>Track your first habit</h3>
      <p>Add a daily habit to start tracking streaks and progress.</p>
      <button className="btn btn-add" type="button" onClick={onAdd}>
        + Add Habit
      </button>
    </div>
  );
}
