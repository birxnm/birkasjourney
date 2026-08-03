/*
 * api.js — Single place where the frontend talks to the backend.
 *
 * Every call goes through request(), so token handling, network-error
 * reporting, and 401 redirects behave the same everywhere.
 */

const TOKEN_KEY = "bj_token";

export const Auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set token(value) {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  },
  get isLoggedIn() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/";
  },
};

/** Thrown for any non-2xx response, carrying the server's message. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Pull a readable message out of FastAPI's error shapes. */
function extractDetail(payload, fallback) {
  const detail = payload && payload.detail;
  if (typeof detail === "string") return detail;
  // Pydantic validation errors arrive as a list of {loc, msg}
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : "";
    const msg = (first.msg || "").replace(/^Value error,\s*/, "");
    return field ? `${field}: ${msg}` : msg;
  }
  return fallback;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (Auth.token) headers.Authorization = `Bearer ${Auth.token}`;

  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    // Network error: server down, offline, DNS failure
    throw new ApiError(
      "Cannot reach the server. Check that the backend is running, then try again.",
      0
    );
  }

  if (response.status === 401 && Auth.isLoggedIn) {
    // Expired or invalid token — send the user back to log in
    Auth.token = null;
    window.location.href = "/?expired=1";
    throw new ApiError("Your session expired. Please log in again.", 401);
  }

  if (response.status === 204) return null;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Empty or malformed body — handled, not crashed
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(
      extractDetail(payload, `Request failed (${response.status}).`),
      response.status
    );
  }

  return payload;
}

export const API = {
  // Auth
  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/api/auth/me"),
  linkCode: () => request("/api/auth/link-code", { method: "POST" }),

  // Habits
  habits: () => request("/api/habits"),
  createHabit: (body) => request("/api/habits", { method: "POST", body: JSON.stringify(body) }),
  updateHabit: (id, body) =>
    request(`/api/habits/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteHabit: (id) => request(`/api/habits/${id}`, { method: "DELETE" }),
  today: () => request("/api/habits/today"),
  log: (body) => request("/api/habits/log", { method: "POST", body: JSON.stringify(body) }),
  deleteLog: (habitName) => request(`/api/habits/log/${habitName}`, { method: "DELETE" }),
  history: (days = 7) => request(`/api/habits/history?days=${days}`),
  stats: (days = 7) => request(`/api/habits/stats?days=${days}`),

  // Quotes
  dailyQuotes: () => request("/api/quotes/daily"),

  // Reminders
  reminders: () => request("/api/reminders"),
  createReminder: (body) => request("/api/reminders", { method: "POST", body: JSON.stringify(body) }),
  deleteReminder: (id) => request(`/api/reminders/${id}`, { method: "DELETE" }),
};
