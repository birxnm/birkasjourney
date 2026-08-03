/*
 * LogForm.jsx — Manual entry for the measured habits.
 *
 * Yes/no habits are not listed here: they are logged with their toggle in
 * today's list, which is one tap instead of a form.
 */

import { useMemo, useState } from "react";

import { API } from "../api.js";
import { HINTS, TIME_HABITS, timeToDecimal } from "../habits.js";
import { useToast } from "./Toast.jsx";

export default function LogForm({ habits, onLogged }) {
  const measured = useMemo(() => habits.filter((h) => h.kind !== "binary"), [habits]);
  const [name, setName] = useState(measured[0]?.name ?? "");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  // The habit list arrives after the first render, so adopt the first option
  // once it does.
  const selected = measured.some((h) => h.name === name) ? name : measured[0]?.name ?? "";
  const isTime = TIME_HABITS.has(selected);

  if (!measured.length) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    const text = raw.trim();
    if (!text) {
      toast("Enter a value first.", true);
      return;
    }

    let value;
    try {
      if (isTime) {
        value = timeToDecimal(text);
      } else {
        value = Number(text.replace(",", "."));
        if (!Number.isFinite(value)) throw new Error(`"${text}" is not a number.`);
        if (value < 0) throw new Error("Value cannot be negative.");
      }
    } catch (error) {
      toast(error.message, true);
      return;
    }

    setBusy(true);
    try {
      const result = await API.log({ habit_name: selected, value });
      toast(
        result.is_completed
          ? `${result.display_name} — target reached! 🎉`
          : `${result.display_name} saved (${result.progress.toFixed(0)}%)`
      );
      setRaw("");
      await onLogged();
    } catch (error) {
      toast(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="field">
          <label htmlFor="log-habit">Habit</label>
          <select
            id="log-habit"
            value={selected}
            onChange={(e) => {
              setName(e.target.value);
              setRaw("");
            }}
          >
            {measured.map((habit) => (
              <option key={habit.name} value={habit.name}>
                {habit.icon || ""} {habit.display_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="log-value">{isTime ? "Time (HH:MM)" : "Value"}</label>
          <input
            id="log-value"
            type="text"
            placeholder={isTime ? "22:30" : "2"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        {HINTS[selected] || ""}
      </p>
    </form>
  );
}
