const BASE = "/api";

async function req<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

const qs = (params: Record<string, any>) =>
  "?" +
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

export const api = {
  // Dashboard
  dashboard: () => req("/dashboard"),

  // Water
  water: () => req("/water"),
  addWater: (ml: number) => req(`/water/add${qs({ ml })}`, { method: "POST" }),
  resetWater: () => req(`/water/reset`, { method: "POST" }),
  waterStreak: () => req("/water/streak"),

  // Habits
  habits: () => req("/habits"),
  toggleHabit: (type: string) =>
    req(`/habits/toggle${qs({ type })}`, { method: "POST" }),

  // Sleep
  sleepList: () => req("/sleep"),
  sleepToday: () => req("/sleep/today"),
  logSleep: (bedtime: string, wake_time: string, quality: number) =>
    req(`/sleep${qs({ bedtime, wake_time, quality })}`, { method: "POST" }),

  // IELTS
  targets: () => req("/ielts/targets"),
  updateTarget: (skill: string, current_band: number) =>
    req(`/ielts/targets/${skill}${qs({ current_band })}`, { method: "PATCH" }),
  tasks: (date?: string) => req(`/ielts/tasks${date ? qs({ date }) : ""}`),
  toggleTask: (id: number) =>
    req(`/ielts/tasks/${id}/toggle`, { method: "POST" }),
  writing: () => req("/ielts/writing"),
  addWriting: (p: Record<string, any>) =>
    req(`/ielts/writing${qs(p)}`, { method: "POST" }),
  speaking: () => req("/ielts/speaking"),
  addSpeaking: (p: Record<string, any>) =>
    req(`/ielts/speaking${qs(p)}`, { method: "POST" }),
  mocks: () => req("/ielts/mocks"),
  addMock: (p: Record<string, any>) =>
    req(`/ielts/mocks${qs(p)}`, { method: "POST" }),
  deleteMock: (id: number) => req(`/ielts/mocks/${id}`, { method: "DELETE" }),
  errors: () => req("/ielts/errors"),
  addError: (category: string, note: string) =>
    req(`/ielts/errors${qs({ category, note })}`, { method: "POST" }),
  resolveError: (id: number) =>
    req(`/ielts/errors/${id}/resolve`, { method: "POST" }),

  // Content
  content: () => req("/content"),
  addContent: (p: Record<string, any>) =>
    req(`/content${qs(p)}`, { method: "POST" }),
  deleteContent: (id: number) => req(`/content/${id}`, { method: "DELETE" }),
  contentStreak: () => req("/content/streak"),
};
