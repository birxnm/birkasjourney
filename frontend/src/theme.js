/*
 * theme.js — Light/dark theme, stored per browser.
 *
 * The resolved theme lives on <html data-theme>, which is what the CSS in
 * global.css keys off. A tiny script in index.html sets the same attribute
 * before first paint, so the page never flashes the wrong theme on load.
 *
 * A module-level store rather than a context: the toggle button and the charts
 * both need the current theme, and they sit in different parts of the tree.
 */

const STORAGE_KEY = "bj_theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set();

/** The user's explicit choice, or null when they've never picked one. */
function storedChoice() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Private-browsing modes can throw on localStorage access.
    return null;
  }
}

function systemTheme() {
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

let current = storedChoice() ?? systemTheme();

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  // Keeps the mobile browser chrome in step with the page.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0e0e13" : "#ffffff");
}

apply(current);

export function getTheme() {
  return current;
}

export function setTheme(next) {
  if (next !== "light" && next !== "dark") return;
  current = next;
  apply(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not persisting is survivable — the theme still applies for this session.
  }
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(current === "dark" ? "light" : "dark");
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/*
 * Follow the system while the user hasn't chosen for themselves. Once they use
 * the toggle, their choice wins and this stops having an effect.
 */
window.matchMedia?.(DARK_QUERY).addEventListener?.("change", (event) => {
  if (storedChoice()) return;
  current = event.matches ? "dark" : "light";
  apply(current);
  listeners.forEach((listener) => listener());
});
