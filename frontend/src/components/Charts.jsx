/*
 * Charts.jsx — The two Chart.js views over the last seven days.
 *
 * Line: one measured habit's daily values against its target.
 * Bar: days-on-target per habit.
 */

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";

import { decimalToTime } from "../habits.js";
import { useTheme } from "../hooks/useTheme.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Legend,
  Tooltip
);

ChartJS.defaults.font.family =
  '"Archivo Variable", "Archivo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ChartJS.defaults.font.weight = 600;

/*
 * Chart.js paints to a canvas, so it can't use CSS variables — the values have
 * to be resolved and handed over. Reading them off the document means the
 * charts follow whatever the theme currently is, with no second palette to
 * keep in step. Both chart components list the theme in their useMemo deps,
 * which is what makes them repaint on a toggle.
 */
function chartColors() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

  return {
    text: token("--ink-muted", "#5f5f6e"),
    grid: token("--line", "#e2e2ec"),
    accent: token("--indigo", "#4e55e0"), // the plotted series
    target: token("--ink-faint", "#8a8a9a"), // quieter than the data
    onBrand: token("--on-brand", "#16161d"), // the edge on a brand-coloured bar
    paper: token("--paper", "#ffffff"),
  };
}

function axesFor(colors) {
  return {
    x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
    y: { grid: { color: colors.grid }, ticks: { color: colors.text }, beginAtZero: true },
  };
}

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
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

export function HabitLineChart({ logs, habit }) {
  const theme = useTheme();

  const { data, options } = useMemo(() => {
    const days = lastDays(7);
    const byDate = new Map(
      logs.filter((row) => row.name === habit.name).map((row) => [row.log_date, row.value])
    );
    const isTime = habit.unit === "time";
    const colors = chartColors();

    return {
      data: {
        labels: days.map(shortLabel),
        datasets: [
          {
            label: habit.display_name,
            data: days.map((day) => (byDate.has(day) ? byDate.get(day) : null)),
            borderColor: colors.accent,
            backgroundColor: "rgba(78,85,224,0.12)",
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: colors.accent,
            // Rings each point against the card it sits on, whatever that is.
            pointBorderColor: colors.paper,
            pointBorderWidth: 2,
            spanGaps: true,
          },
          {
            label: "Target",
            data: days.map(() => habit.target_value),
            borderColor: colors.target,
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
        scales: axesFor(colors),
        plugins: {
          legend: { labels: { boxWidth: 12, color: colors.text } },
          tooltip: {
            callbacks: {
              label(context) {
                const value = context.parsed.y;
                if (value === null) return `${context.dataset.label}: not logged`;
                const shown = isTime ? decimalToTime(value) : value;
                const unit = isTime ? "" : ` ${habit.unit || ""}`;
                return `${context.dataset.label}: ${shown}${unit}`;
              },
            },
          },
        },
      },
    };
    // theme is a dependency because chartColors() reads from the document.
  }, [logs, habit, theme]);

  return <Line data={data} options={options} />;
}

export function CompletionBarChart({ logs, habits }) {
  const theme = useTheme();

  const { data, options } = useMemo(() => {
    const completed = new Map(habits.map((h) => [h.name, 0]));
    logs.forEach((row) => {
      if (row.is_completed) completed.set(row.name, (completed.get(row.name) || 0) + 1);
    });
    const colors = chartColors();

    return {
      data: {
        labels: habits.map((h) => `${h.icon || ""} ${h.display_name}`),
        datasets: [
          {
            label: "Days on target",
            data: habits.map((h) => completed.get(h.name) || 0),
            // Solid blocks in each habit's own colour, edged in the ink that
            // pairs with a brand fill so a pale bar reads in either theme.
            backgroundColor: habits.map((h) => h.color || colors.accent),
            borderColor: colors.onBrand,
            borderWidth: 1.5,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: (() => {
          const axes = axesFor(colors);
          return {
            ...axes,
            y: { ...axes.y, max: 7, ticks: { ...axes.y.ticks, stepSize: 1 } },
          };
        })(),
        plugins: { legend: { display: false } },
      },
    };
    // theme is a dependency because chartColors() reads from the document.
  }, [logs, habits, theme]);

  return <Bar data={data} options={options} />;
}
