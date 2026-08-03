/*
 * ColorPicker.jsx — The colour swatches in the Add Habit form.
 *
 * The value sent to the API is a #rrggbb string, which is what the backend
 * validates against.
 */

/*
 * The brand's four colours first, then a wider set in the same register —
 * saturated but light enough to carry dark type, since a habit's colour becomes
 * the background of its card. Indigo is the one exception, and textOn() flips
 * its label to white.
 */
export const HABIT_COLORS = [
  "#b8eb6c", "#f7cd63", "#fc8fc6", "#4e55e0", "#7fd4c1",
  "#d7f59b", "#ffe08a", "#ffb8d9", "#8f94f0", "#a5e8dd",
  "#ff9f6b", "#6bc5f7", "#c9a7f5", "#9ad4a0", "#e8e394",
  "#ffc4a3", "#a8ddf9", "#e0cbfa", "#34a0a4", "#f2857c",
];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="swatch-row" role="radiogroup" aria-label="Colour">
      {HABIT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={`Colour ${color}`}
          className={`swatch${value === color ? " selected" : ""}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
