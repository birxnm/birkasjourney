/*
 * router.js — Minimal History-API routing for the three pages.
 *
 * The app has exactly three routes, which does not justify a routing library.
 * navigate() pushes a history entry and notifies every useRoute() subscriber;
 * the browser's own back and forward buttons work because they emit popstate.
 * A hard refresh works because FastAPI serves index.html for any non-API path.
 */

import { useEffect, useState } from "react";

export const ROUTES = {
  auth: "/",
  welcome: "/welcome",
  dashboard: "/dashboard",
};

export function navigate(to, { replace = false } = {}) {
  if (window.location.pathname === to) return;
  if (replace) window.history.replaceState({}, "", to);
  else window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** The current pathname, re-rendering on back/forward and on navigate(). */
export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return path;
}
