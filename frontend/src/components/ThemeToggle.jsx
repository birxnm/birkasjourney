/*
 * ThemeToggle.jsx — Switches between the light and dark themes.
 *
 * The icon shows the theme you'd get by pressing it, which is the convention
 * users expect from a single-button toggle.
 */

import { useTheme } from "../hooks/useTheme.js";
import { toggleTheme } from "../theme.js";

export default function ThemeToggle({ className = "btn btn-sm" }) {
  const theme = useTheme();
  const goingDark = theme === "light";

  return (
    <button
      className={className}
      type="button"
      onClick={toggleTheme}
      title={goingDark ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={goingDark ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span aria-hidden="true">{goingDark ? "🌙" : "☀️"}</span>
    </button>
  );
}
