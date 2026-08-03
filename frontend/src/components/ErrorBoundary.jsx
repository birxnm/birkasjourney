/*
 * ErrorBoundary.jsx — Category 4 (unexpected) on the client side.
 *
 * A render crash anywhere below shows a plain, actionable message instead of a
 * blank page. The technical detail goes to the console, never to the user.
 */

import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Unexpected UI error:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      // Same indigo canvas as the entry pages, so a crash still looks like the app.
      <main className="entry">
        <div className="auth-card">
          <div className="card" style={{ textAlign: "center" }}>
            <h2>Something went wrong on this page</h2>
            <p className="muted" style={{ margin: "0.75rem 0 1.25rem" }}>
              Your data is safe. Reloading usually clears it.
            </p>
            <button
              className="btn btn-primary btn-block"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      </main>
    );
  }
}
