/*
 * TimeField.jsx — Picking a time, built for a thumb.
 *
 * A bare <input type="time"> stretches to the full width of its container for a
 * five-character value, and the only way to set it is the native wheel. The
 * quick-pick row below covers the times people actually choose for a reminder,
 * so the common case is one tap; the input stays a real time input, so the
 * native picker and the HH:MM value the API expects both still work.
 *
 * Used by the Reminders card and by the Add Habit dialog.
 */

import { formatClock } from "../habits.js";

const PRESETS = [
  { icon: "🌅", label: "Morning", time: "08:00" },
  { icon: "☀️", label: "Midday", time: "12:00" },
  { icon: "🌆", label: "Evening", time: "18:00" },
  { icon: "🌙", label: "Night", time: "21:00" },
];

/*
 * The input renders its value in the browser's own format — "21:00" on a
 * 24-hour locale, "9:00 PM" on a 12-hour one — so the quick-picks are labelled
 * through the same formatter, or the row reads as two different clocks. The
 * value handed back to the API stays 24-hour "HH:MM" either way.
 */

/**
 * @param value     "HH:MM", or "" when nothing is chosen yet
 * @param onChange  called with the new "HH:MM"
 */
export default function TimeField({ id, value, onChange, required = false, label = "Time" }) {
  return (
    <div className="time-field">
      <input
        id={id}
        className="time-input"
        type="time"
        aria-label={label}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="time-presets" role="group" aria-label="Common times">
        {PRESETS.map((preset) => (
          <button
            key={preset.time}
            className={`time-preset${value === preset.time ? " selected" : ""}`}
            type="button"
            // aria-pressed rather than a radio group: the input can hold any
            // time, so these are shortcuts, not the full set of choices.
            aria-pressed={value === preset.time}
            aria-label={`${preset.label}, ${formatClock(preset.time)}`}
            onClick={() => onChange(preset.time)}
          >
            <span aria-hidden="true">{preset.icon}</span>
            <span className="time-preset-value">{formatClock(preset.time)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
