/*
 * useTheme.js — Subscribe a component to the current theme.
 */

import { useSyncExternalStore } from "react";

import { getTheme, subscribe } from "../theme.js";

/** "light" | "dark" — re-renders the caller whenever the theme changes. */
export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, getTheme);
}
