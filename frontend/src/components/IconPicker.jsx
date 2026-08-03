/*
 * IconPicker.jsx — The emoji grid in the Add Habit form.
 *
 * A radio group rather than a row of buttons, so arrow keys move between the
 * options and screen readers announce the selection.
 */

export const HABIT_ICONS = [
  "💪", "🏃", "📚", "💧", "🧘", "🍎",
  "✍️", "🎯", "📖", "🎨", "🎵", "🏋️",
  "🧠", "😴", "☀️", "🌱", "📝", "🎪",
  "🚀", "⭐", "🔥", "💡", "🌈", "🎁",
  "🏆", "💎", "🌙", "☕", "🍃", "🎬",
];

export default function IconPicker({ value, onChange }) {
  return (
    <div className="picker-grid" role="radiogroup" aria-label="Icon">
      {HABIT_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          role="radio"
          aria-checked={value === icon}
          aria-label={`Icon ${icon}`}
          className={`icon-option${value === icon ? " selected" : ""}`}
          onClick={() => onChange(icon)}
        >
          <span aria-hidden="true">{icon}</span>
        </button>
      ))}
    </div>
  );
}
