/*
 * TargetDays.jsx — "how many days a week" chips, 1 through 7.
 */

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function TargetDays({ value, onChange }) {
  return (
    <div className="day-row" role="radiogroup" aria-label="Target days per week">
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          role="radio"
          aria-checked={value === day}
          aria-label={day === 1 ? "1 day a week" : `${day} days a week`}
          className={`day-option${value === day ? " selected" : ""}`}
          onClick={() => onChange(day)}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
