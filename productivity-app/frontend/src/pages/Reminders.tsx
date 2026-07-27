import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Section } from "../components/ui";
import {
  Reminder,
  useNotificationPermission,
  requestNotificationPermission,
} from "../lib/notifications";

const categories = [
  { key: "ielts", label: "IELTS", icon: "📚" },
  { key: "habit", label: "Habit", icon: "💪" },
  { key: "water", label: "Water", icon: "💧" },
  { key: "sleep", label: "Sleep", icon: "😴" },
  { key: "content", label: "Content", icon: "🚀" },
  { key: "general", label: "General", icon: "🔔" },
];
const iconFor = (c: string) => categories.find((x) => x.key === c)?.icon || "🔔";

export default function Reminders() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ time: "09:00", purpose: "", category: "ielts" });
  const { perm } = useNotificationPermission();

  const load = () => api.reminders().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!f.purpose.trim()) return;
    await requestNotificationPermission();
    await api.addReminder(f.time, f.purpose, f.category);
    setF({ time: "09:00", purpose: "", category: "ielts" });
    setShowForm(false);
    load();
  };
  const toggle = async (id: number) => {
    await api.toggleReminder(id);
    load();
  };
  const del = async (id: number) => {
    await api.deleteReminder(id);
    load();
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🔔 Reminders</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "+ Add"}
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Pick a time and a purpose — you'll get a notification each day.
      </p>

      {perm !== "granted" && (
        <button
          onClick={() => requestNotificationPermission().then(() => load())}
          className="mb-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200"
        >
          🔔 Tap to enable notifications on this device
        </button>
      )}

      {showForm && (
        <div className="card mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                className="input"
                value={f.time}
                onChange={(e) => setF({ ...f, time: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Purpose</label>
            <input
              className="input"
              placeholder="e.g. Speaking practice, drink water…"
              value={f.purpose}
              onChange={(e) => setF({ ...f, purpose: e.target.value })}
            />
          </div>
          <button className="btn-primary w-full" onClick={submit}>
            Save reminder
          </button>
        </div>
      )}

      <Section title="Your reminders">
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="card flex items-center gap-3">
              <span className="text-2xl">{iconFor(r.category)}</span>
              <div className="flex-1">
                <div className={`text-lg font-bold ${r.enabled ? "" : "text-slate-500"}`}>
                  {r.time}
                </div>
                <div className={`text-sm ${r.enabled ? "text-slate-300" : "text-slate-500 line-through"}`}>
                  {r.purpose}
                </div>
              </div>
              <button
                onClick={() => toggle(r.id)}
                className={`h-6 w-11 rounded-full p-0.5 transition ${
                  r.enabled ? "bg-brand" : "bg-slate-600"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition ${
                    r.enabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
              <button onClick={() => del(r.id)} className="text-slate-500 hover:text-rose-400">
                ✕
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-500">No reminders yet — tap “+ Add”.</p>
          )}
        </div>
      </Section>

      <p className="mt-4 text-xs text-slate-500">
        Notifications fire while the app is open in your browser. For alerts when it's closed,
        install it to your home screen (Block tab explains how) — iOS delivers PWA notifications
        once installed.
      </p>
    </div>
  );
}
