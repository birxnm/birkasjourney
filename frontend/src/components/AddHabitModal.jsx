/*
 * AddHabitModal.jsx — The Add Habit form, in a Radix dialog.
 *
 * Radix owns the focus trap, the Escape key, and the scroll lock; this file
 * owns the fields and the client-side checks. Everything here is validated
 * again on the server — this pass only saves the user a round trip.
 *
 * The reminder switch writes a real reminder: the backend stores it and
 * scheduler.py pushes it through Telegram at the chosen time.
 */

import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { useState } from "react";

import { API } from "../api.js";
import CategorySelect from "./CategorySelect.jsx";
import ColorPicker, { HABIT_COLORS } from "./ColorPicker.jsx";
import IconPicker, { HABIT_ICONS } from "./IconPicker.jsx";
import TargetDays from "./TargetDays.jsx";
import TimeField from "./TimeField.jsx";
import { useToast } from "./Toast.jsx";

const DEFAULT_REMINDER = "09:00";

const EMPTY_FORM = {
  displayName: "",
  icon: HABIT_ICONS[0],
  color: HABIT_COLORS[0],
  category: "Other",
  targetDays: 7,
  notes: "",
  reminderOn: false,
  reminderTime: DEFAULT_REMINDER,
};

export default function AddHabitModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  function handleOpenChange(next) {
    // Reopening should always start clean, never with the last attempt's text.
    if (!next) {
      setForm(EMPTY_FORM);
      setError("");
    }
    onOpenChange(next);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.displayName.trim();
    if (!name) {
      setError("Give the habit a name first.");
      return;
    }
    if (form.reminderOn && !form.reminderTime) {
      setError("Pick a time for the reminder, or switch it off.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const habit = await API.createHabit({
        display_name: name,
        icon: form.icon,
        color: form.color,
        category: form.category,
        target_days: form.targetDays,
        notes: form.notes.trim() || null,
        reminder_time: form.reminderOn ? form.reminderTime : null,
      });

      toast(
        habit.reminder_time
          ? `${habit.display_name} added · reminder at ${habit.reminder_time}`
          : `${habit.display_name} added`
      );
      setForm(EMPTY_FORM);
      onOpenChange(false);
      await onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-describedby={undefined}>
          <Dialog.Title className="dialog-title">Add Habit</Dialog.Title>

          <form className="dialog-form" onSubmit={handleSubmit}>
            <div className="dialog-body">
              <input
                className="habit-name-input"
                type="text"
                autoFocus
                maxLength={50}
                placeholder="e.g., Exercise, Read, Meditate"
                aria-label="Habit name"
                value={form.displayName}
                onChange={(e) => set({ displayName: e.target.value })}
              />

              {error && <div className="alert alert-error">{error}</div>}

              <p className="field-caption">Icon</p>
              <IconPicker value={form.icon} onChange={(icon) => set({ icon })} />

              <p className="field-caption">Colour</p>
              <ColorPicker value={form.color} onChange={(color) => set({ color })} />

              <p className="field-caption" id="category-caption">
                Category
              </p>
              <CategorySelect
                id="habit-category"
                value={form.category}
                onChange={(category) => set({ category })}
              />

              <p className="field-caption">Target (days per week)</p>
              <TargetDays
                value={form.targetDays}
                onChange={(targetDays) => set({ targetDays })}
              />

              <p className="field-caption">Notes (optional)</p>
              <textarea
                className="habit-notes"
                rows={2}
                maxLength={500}
                placeholder="Add notes about this habit"
                aria-label="Notes"
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
              />

              <div className="reminder-row">
                <div>
                  <p className="field-caption" id="reminder-caption">
                    Reminder
                  </p>
                  <p className="muted reminder-hint">Sent to you in Telegram.</p>
                </div>
                <Switch.Root
                  className="switch-root"
                  checked={form.reminderOn}
                  onCheckedChange={(reminderOn) => set({ reminderOn })}
                  aria-labelledby="reminder-caption"
                >
                  <Switch.Thumb className="switch-thumb" />
                </Switch.Root>
              </div>

              {form.reminderOn && (
                <div className="reminder-time">
                  <TimeField
                    label="Reminder time"
                    value={form.reminderTime}
                    onChange={(reminderTime) => set({ reminderTime })}
                  />
                </div>
              )}
            </div>

            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button className="btn" type="button" disabled={saving}>
                  Cancel
                </button>
              </Dialog.Close>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
