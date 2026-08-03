/*
 * useUser.js — The signed-in account, plus the name to greet them by.
 *
 * A failed lookup is not fatal: the page still renders with a neutral name.
 */

import { useEffect, useState } from "react";

import { API } from "../api.js";

/** username → email prefix → a neutral fallback. */
export function displayName(user) {
  if (!user) return "there";
  return user.username || (user.email || "").split("@")[0] || "there";
}

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    API.me()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch((error) => {
        console.error("Could not load the current user:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, name: displayName(user), loading };
}
