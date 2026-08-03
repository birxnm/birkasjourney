/*
 * habits.js — Shared habit helpers.
 *
 * Bedtime and wake-up are stored as decimal hours (22:30 → 22.5); the two
 * converters below keep that detail out of the components.
 */

export const TIME_HABITS = new Set(["sleep", "wake"]);

export const HINTS = {
  water: "Litres of water, e.g. 2",
  steps: "Number of steps, e.g. 8000",
  sleep: "The time you went to bed, e.g. 22:30",
  wake: "The time you woke up, e.g. 06:00",
  ielts: "Minutes studied, e.g. 60",
  it_projects: "Tasks or commits finished, e.g. 2",
};

export function timeToDecimal(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Use HH:MM, for example 22:30.");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("Time must be between 00:00 and 23:59.");
  return hours + minutes / 60;
}

export function decimalToTime(decimal) {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * A stored "HH:MM" shown the way this device writes times.
 *
 * Reminders are stored and sent as 24-hour "HH:MM", but an <input type="time">
 * renders in the browser's own format — "21:00" here, "9:00 PM" there. Anything
 * that displays a reminder time goes through this, so one screen never mixes
 * the two conventions.
 */
export function formatClock(hhmm) {
  const [hour, minute] = String(hhmm).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return String(hhmm);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Format a stored value for display, respecting time-based habits. */
export function formatValue(habit, value) {
  if (value === null || value === undefined) return "—";
  return habit.unit === "time" ? decimalToTime(value) : String(Number(value.toFixed(2)));
}

// ─── Colour contrast ─────────────────────────────────────────────────────────

const INK = "#16161d"; // must match --ink in global.css

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Dark or white text for a habit's own colour, whichever is more readable.
 *
 * A habit's colour becomes the background of its card, and the palette runs
 * from pale lime to solid indigo — so the label can't assume either one.
 */
export function textOn(hex) {
  if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) return INK;
  const background = luminance(hex);
  return contrast(background, luminance(INK)) >= contrast(background, 1) ? INK : "#ffffff";
}
