/*
 * charts.js — Chart.js views over the last seven days.
 *
 * Line chart: one habit's daily values against its target.
 * Bar chart: days-on-target per habit.
 */

let lineChart = null;
let barChart = null;

const CHART_TEXT = "#94a3b8";
const CHART_GRID = "rgba(255,255,255,0.07)";
const ACCENT = "#a78bfa";
const ACCENT_2 = "#22d3ee";

Chart.defaults.color = CHART_TEXT;
Chart.defaults.font.family =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/** The last N calendar days as YYYY-MM-DD, oldest first. */
function lastDays(count) {
  const days = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const day = new Date();
    day.setDate(day.getDate() - offset);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

function shortLabel(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
  });
}

const AXIS = {
  x: { grid: { color: CHART_GRID }, ticks: { color: CHART_TEXT } },
  y: { grid: { color: CHART_GRID }, ticks: { color: CHART_TEXT }, beginAtZero: true },
};

/** Daily values for one habit, with its target drawn as a dashed line. */
function renderLineChart(logs, habits, habitName) {
  const habit = habits.find((h) => h.name === habitName);
  if (!habit) return;

  const days = lastDays(7);
  const byDate = new Map(
    logs.filter((row) => row.name === habitName).map((row) => [row.log_date, row.value])
  );
  const values = days.map((day) => (byDate.has(day) ? byDate.get(day) : null));
  const isTime = habit.unit === "time";

  const config = {
    type: "line",
    data: {
      labels: days.map(shortLabel),
      datasets: [
        {
          label: habit.display_name,
          data: values,
          borderColor: ACCENT,
          backgroundColor: "rgba(167,139,250,0.15)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: ACCENT,
          spanGaps: true,
        },
        {
          label: "Target",
          data: days.map(() => habit.target_value),
          borderColor: ACCENT_2,
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: AXIS,
      plugins: {
        legend: { labels: { boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y;
              if (value === null) return `${context.dataset.label}: not logged`;
              const shown = isTime ? decimalToTime(value) : value;
              const unit = isTime ? "" : ` ${habit.unit}`;
              return `${context.dataset.label}: ${shown}${unit}`;
            },
          },
        },
      },
    },
  };

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.getElementById("chart-line"), config);
}

/** How many of the last 7 days each habit hit its target. */
function renderBarChart(logs, habits) {
  const completed = new Map(habits.map((h) => [h.name, 0]));
  logs.forEach((row) => {
    if (row.is_completed) completed.set(row.name, (completed.get(row.name) || 0) + 1);
  });

  const config = {
    type: "bar",
    data: {
      labels: habits.map((h) => `${h.icon || ""} ${h.display_name}`),
      datasets: [
        {
          label: "Days on target",
          data: habits.map((h) => completed.get(h.name) || 0),
          backgroundColor: "rgba(34,211,238,0.55)",
          borderColor: ACCENT_2,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        ...AXIS,
        y: { ...AXIS.y, max: 7, ticks: { ...AXIS.y.ticks, stepSize: 1 } },
      },
      plugins: { legend: { display: false } },
    },
  };

  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById("chart-bar"), config);
}
