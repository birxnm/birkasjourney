/*
 * RemindersCard.jsx — Daily reminders, created here and delivered by Telegram.
 *
 * The scheduler pushes these through the bot, so they only actually arrive once
 * the account is linked.
 */

import { useCallback, useEffect, useState } from "react";

import { API } from "../api.js";
import { useToast } from "./Toast.jsx";

export default function RemindersCard({ refreshKey }) {
  const [reminders, setReminders] = useState(null);
  const [error, setError] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setReminders(await API.reminders());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Reloads on mount and whenever a habit is created with a reminder attached.
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!time) {
      toast("Pick a time first.", true);
      return;
    }
    const text = message.trim();
    if (!text) {
      toast("The reminder message cannot be empty.", true);
      return;
    }

    setBusy(true);
    try {
      await API.createReminder({ message: text, remind_at: time });
      setMessage("");
      toast(`Reminder set for ${time}`);
      await load();
    } catch (err) {
      toast(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await API.deleteReminder(id);
      toast("Reminder deleted");
      await load();
    } catch (err) {
      toast(err.message, true);
    }
  }

  return (
    <section className="card">
      <div className="card-title">
        <h2>⏰ Reminders</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: "0.75rem" }}>
        <div className="field">
          <label htmlFor="reminder-time">Time</label>
          <input
            id="reminder-time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="reminder-message">Message</label>
          <input
            id="reminder-message"
            type="text"
            maxLength={500}
            placeholder="Drink your last glass of water"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button className="btn btn-block" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add reminder"}
        </button>
      </form>

      <p className="muted" style={{ marginBottom: "0.5rem" }}>
        Reminders arrive in Telegram — link your account first.
      </p>

      {error && <p className="empty">{error}</p>}
      {!error && reminders?.length === 0 && <p className="empty">No reminders yet.</p>}

      {reminders?.map((reminder) => (
        <div className="reminder" key={reminder.id}>
          <span className="time">{reminder.remind_at}</span>
          <span className="text">{reminder.message}</span>
          <button
            className="btn btn-sm"
            type="button"
            title="Delete"
            aria-label={`Delete the ${reminder.remind_at} reminder`}
            onClick={() => remove(reminder.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </section>
  );
}
