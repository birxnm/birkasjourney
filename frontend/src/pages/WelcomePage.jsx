/*
 * WelcomePage.jsx — Where a fresh sign-in lands.
 *
 * Greets the user by name, shows where they stand in three numbers, and points
 * at the next useful thing. The layout is fluid rather than breakpoint-driven,
 * so it reads the same on a phone, a tablet, and a desktop.
 */

import { useEffect, useState } from "react";

import { API, Auth } from "../api.js";
import { useUser } from "../hooks/useUser.js";
import { ROUTES, navigate } from "../router.js";
import Mascot from "../components/Mascot.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

/** Morning / afternoon / evening, from the device clock. */
function greetingFor(hour) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const NEXT_STEPS = [
  {
    icon: "✅",
    title: "Log today",
    text: "Tick off your habits and watch the streak build.",
  },
  {
    icon: "✨",
    title: "Add your own habit",
    text: "Pick an icon, a colour, and how many days a week you want it.",
  },
  {
    icon: "🔗",
    title: "Link Telegram",
    text: "Log on the move and get your reminders as messages.",
  },
];

export default function WelcomePage() {
  const { user, name, loading } = useUser();
  const [stats, setStats] = useState(null);
  const [doneToday, setDoneToday] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([API.stats(7), API.today()])
      .then(([statsData, today]) => {
        if (cancelled) return;
        setStats(statsData);
        setDoneToday(`${today.filter((h) => h.is_completed).length}/${today.length}`);
      })
      .catch((error) => {
        // The greeting is the point of this page; numbers are a bonus.
        console.error("Could not load the welcome summary:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = greetingFor(new Date().getHours());

  return (
    <main className="entry">
      <div className="entry-toggle">
        <ThemeToggle />
      </div>

      <div className="welcome-inner">
        <header className="welcome-head">
          <p className="welcome-eyebrow">{greeting}</p>
          <h1 className="welcome-title">
            Welcome, <span className="welcome-name">{loading ? "…" : name}</span>!
          </h1>
          <p className="welcome-sub">
            {user?.telegram_id
              ? "Your Telegram account is linked — log from anywhere."
              : "Everything you track lives in one place, on every device you use."}
          </p>

          <div className="welcome-mascots">
            <Mascot shape="halfDisc" color="var(--pink)" />
            <Mascot shape="square" color="var(--lime)" arms />
            <Mascot shape="hexagon" color="var(--yellow)" />
          </div>
        </header>

        <section className="welcome-stats" aria-label="Your progress so far">
          <div className="welcome-stat">
            <span className="value">{stats ? `${stats.streak} 🔥` : "—"}</span>
            <span className="label">Day streak</span>
          </div>
          <div className="welcome-stat">
            <span className="value">{doneToday ?? "—"}</span>
            <span className="label">Done today</span>
          </div>
          <div className="welcome-stat">
            <span className="value">{stats ? `${stats.completion_rate}%` : "—"}</span>
            <span className="label">Last 7 days</span>
          </div>
        </section>

        <section className="welcome-steps" aria-label="What you can do next">
          {NEXT_STEPS.map((step) => (
            <article className="welcome-step" key={step.title}>
              <span className="welcome-step-icon" aria-hidden="true">
                {step.icon}
              </span>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </article>
          ))}
        </section>

        <div className="welcome-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => navigate(ROUTES.dashboard)}
          >
            Open my dashboard →
          </button>
          <button className="btn" type="button" onClick={() => Auth.logout()}>
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
