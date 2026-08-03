/*
 * AuthPage.jsx — Log in and create account.
 *
 * On success the token is stored and the user lands on the welcome page.
 */

import { useState } from "react";

import { API, Auth } from "../api.js";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { ROUTES, navigate } from "../router.js";

const EXPIRED_MESSAGE = "Your session expired. Please log in again.";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [error, setError] = useState(() =>
    new URLSearchParams(window.location.search).has("expired") ? EXPIRED_MESSAGE : ""
  );
  const [busy, setBusy] = useState(false);

  const [login, setLogin] = useState({ email: "", password: "" });
  const [register, setRegister] = useState({ username: "", email: "", password: "" });

  function switchTab(next) {
    setTab(next);
    setError("");
  }

  /** Run an auth call with the button locked, then land on the welcome page. */
  async function submit(event, call) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await call();
      Auth.token = result.access_token;
      navigate(ROUTES.welcome, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="entry">
      <div className="entry-toggle">
        <ThemeToggle />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <h1>Birka's Journey</h1>
          <p>Six habits. One day at a time.</p>
        </div>

        <div className="card">
          <div className="tabs" role="tablist">
            <button
              className={`tab${tab === "login" ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={tab === "login"}
              onClick={() => switchTab("login")}
            >
              Log in
            </button>
            <button
              className={`tab${tab === "register" ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={tab === "register"}
              onClick={() => switchTab("register")}
            >
              Create account
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {tab === "login" ? (
            <form
              onSubmit={(event) =>
                submit(event, () =>
                  API.login({ email: login.email.trim(), password: login.password })
                )
              }
            >
              <div className="field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? "Please wait…" : "Log in"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                // Checked here as well as on the server so the user gets the
                // message without a round trip.
                if (register.password.trim().length < 6) {
                  event.preventDefault();
                  setError("Password must be at least 6 characters.");
                  return;
                }
                submit(event, () =>
                  API.register({
                    email: register.email.trim(),
                    password: register.password,
                    username: register.username.trim() || null,
                  })
                );
              }}
            >
              <div className="field">
                <label htmlFor="register-username">
                  Name <span className="muted">(optional)</span>
                </label>
                <input
                  id="register-username"
                  type="text"
                  autoComplete="nickname"
                  placeholder="Birka"
                  maxLength={100}
                  value={register.username}
                  onChange={(e) => setRegister({ ...register, username: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={register.email}
                  onChange={(e) => setRegister({ ...register, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="register-password">
                  Password <span className="muted">(min 6 characters)</span>
                </label>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={6}
                  required
                  value={register.password}
                  onChange={(e) => setRegister({ ...register, password: e.target.value })}
                />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? "Please wait…" : "Create account"}
              </button>
            </form>
          )}
        </div>

        <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
          Prefer Telegram? Send <strong>/start</strong> to the bot — then link the two
          accounts from your dashboard.
        </p>
      </div>
    </main>
  );
}
