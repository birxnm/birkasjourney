/*
 * habits.js — Today's habit list and the manual logging form.
 *
 * Bedtime and wake-up are stored as decimal hours (22:30 → 22.5); the two
 * converters below keep that detail out of the rest of the UI.
 */

const TIME_HABITS = new Set(["sleep", "wake"]);

const HINTS = {
  water: "Litres of water, e.g. 2",
  steps: "Number of steps, e.g. 8000",
  sleep: "The time you went to bed, e.g. 22:30",
  wake: "The time you woke up, e.g. 06:00",
  ielts: "Minutes studied, e.g. 60",
  it_projects: "Tasks or commits finished, e.g. 2",
};

function timeToDecimal(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Use HH:MM, for example 22:30.");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("Time must be between 00:00 and 23:59.");
  return hours + minutes / 60;
}

function decimalToTime(decimal) {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Format a stored value for display, respecting time-based habits. */
function formatValue(habit, value) {
  if (value === null || value === undefined) return "—";
  return habit.unit === "time" ? decimalToTime(value) : String(Number(value.toFixed(2)));
}

// ─── Rendering ──────────────────────────────────────────────────────────────

function renderHabits(habits) {
  const container = document.getElementById("habits-list");

  container.innerHTML = habits
    .map((habit) => {
      const logged = habit.value !== null && habit.value !== undefined;
      const shown = formatValue(habit, habit.value);
      const target = formatValue(habit, habit.target_value);
      const unit = habit.unit === "time" ? "" : ` ${habit.unit}`;
      const progress = logged ? habit.progress : 0;
      const status = habit.is_completed ? "✅" : logged ? "⏳" : "";

      return `
        <div class="habit">
          <div class="habit-icon">${habit.icon || "•"}</div>
          <div>
            <div class="habit-name">${habit.display_name} ${status}</div>
            <div class="habit-meta">
              ${logged ? `${shown} / ${target}${unit} · ${progress.toFixed(0)}%` : "Not logged yet"}
            </div>
            <div class="bar ${habit.is_completed ? "done" : ""}">
              <span style="width:${Math.min(progress, 100)}%"></span>
            </div>
          </div>
          <div class="habit-actions">
            ${logged
              ? `<button class="btn btn-sm" data-clear="${habit.name}" title="Clear today's entry">✕</button>`
              : ""}
          </div>
        </div>`;
    })
    .join("");

  container.querySelectorAll("[data-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await API.deleteLog(button.dataset.clear);
        toast("Entry cleared");
        await refreshDashboard();
      } catch (error) {
        toast(error.message, true);
        button.disabled = false;
      }
    });
  });
}

/** Fill the habit dropdowns once, from the habit definitions. */
function populateHabitSelects(habits) {
  const options = habits
    .map((h) => `<option value="${h.name}">${h.icon || ""} ${h.display_name}</option>`)
    .join("");

  const logSelect = document.getElementById("log-habit");
  const chartSelect = document.getElementById("chart-habit");
  logSelect.innerHTML = options;
  chartSelect.innerHTML = options;

  updateLogHint();
}

function updateLogHint() {
  const name = document.getElementById("log-habit").value;
  const input = document.getElementById("log-value");
  document.getElementById("log-hint").textContent = HINTS[name] || "";
  document.getElementById("log-value-label").textContent = TIME_HABITS.has(name)
    ? "Time (HH:MM)"
    : "Value";
  input.placeholder = TIME_HABITS.has(name) ? "22:30" : "2";
  input.value = "";
}

// ─── Log form ───────────────────────────────────────────────────────────────

function initLogForm() {
  document.getElementById("log-habit").addEventListener("change", updateLogHint);

  document.getElementById("log-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("log-habit").value;
    const raw = document.getElementById("log-value").value.trim();
    const button = event.target.querySelector("button[type=submit]");

    if (!raw) {
      toast("Enter a value first.", true);
      return;
    }

    let value;
    try {
      if (TIME_HABITS.has(name)) {
        value = timeToDecimal(raw);
      } else {
        value = Number(raw.replace(",", "."));
        if (!Number.isFinite(value)) throw new Error(`"${raw}" is not a number.`);
        if (value < 0) throw new Error("Value cannot be negative.");
      }
    } catch (error) {
      toast(error.message, true);
      return;
    }

    button.disabled = true;
    try {
      const result = await API.log({ habit_name: name, value });
      toast(
        result.is_completed
          ? `${result.display_name} — target reached! 🎉`
          : `${result.display_name} saved (${result.progress.toFixed(0)}%)`
      );
      document.getElementById("log-value").value = "";
      await refreshDashboard();
    } catch (error) {
      toast(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}
