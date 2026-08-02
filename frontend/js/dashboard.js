/*
 * dashboard.js — Page controller.
 *
 * Guards the route, wires the header buttons, and owns refreshDashboard(),
 * which every other module calls after it changes data.
 */

let habitDefinitions = [];

if (!Auth.isLoggedIn) {
  window.location.href = "/";
}

/** Reload habits, stats, and charts together so the page never shows a mix. */
async function refreshDashboard() {
  try {
    const [today, stats, history] = await Promise.all([
      API.today(),
      API.stats(7),
      API.history(7),
    ]);

    habitDefinitions = today;
    renderHabits(today);

    const doneToday = today.filter((h) => h.is_completed).length;
    document.getElementById("stat-streak").textContent = `${stats.streak} 🔥`;
    document.getElementById("stat-rate").textContent = `${stats.completion_rate}%`;
    document.getElementById("stat-today").textContent = `${doneToday}/${today.length}`;
    document.getElementById("stat-total").textContent = stats.total_logs;

    renderBarChart(history.logs, today);
    renderLineChart(history.logs, today, document.getElementById("chart-habit").value);
  } catch (error) {
    toast(error.message, true);
  }
}

async function initDashboard() {
  document.getElementById("today-date").textContent = new Date().toLocaleDateString(
    undefined,
    { weekday: "long", month: "long", day: "numeric" }
  );

  // Greeting
  try {
    const user = await API.me();
    const name = user.username || (user.email || "").split("@")[0] || "there";
    document.getElementById("greeting").textContent = user.telegram_id
      ? `Welcome back, ${name} · Telegram linked ✅`
      : `Welcome back, ${name}`;
  } catch {
    document.getElementById("greeting").textContent = "Welcome back";
  }

  // Habit dropdowns need the definitions before the first refresh.
  try {
    populateHabitSelects(await API.habits());
  } catch (error) {
    toast(error.message, true);
  }

  document.getElementById("chart-habit").addEventListener("change", (event) => {
    renderLineChartFromCache(event.target.value);
  });

  initLogForm();
  initReminderForm();

  document.getElementById("logout").addEventListener("click", () => Auth.logout());

  document.getElementById("link-telegram").addEventListener("click", async (event) => {
    event.target.disabled = true;
    try {
      const { link_code } = await API.linkCode();
      showLinkCode(link_code);
    } catch (error) {
      toast(error.message, true);
    } finally {
      event.target.disabled = false;
    }
  });

  await Promise.all([refreshDashboard(), loadQuotes(), loadReminders()]);
}

/** Re-draw the line chart when the habit selector changes. */
async function renderLineChartFromCache(habitName) {
  try {
    const history = await API.history(7);
    renderLineChart(history.logs, habitDefinitions, habitName);
  } catch (error) {
    toast(error.message, true);
  }
}

/** Show the one-time code the user sends to the bot as /link <code>. */
function showLinkCode(code) {
  const container = document.getElementById("habits-list");
  const panel = document.createElement("div");
  panel.className = "alert alert-success";
  panel.innerHTML = `
    Send this to the bot within 5 minutes:
    <div style="margin-top:0.5rem"><code class="code-pill">/link ${code}</code></div>`;
  container.parentElement.insertBefore(panel, container);
  setTimeout(() => panel.remove(), 300000);
}

initDashboard();
