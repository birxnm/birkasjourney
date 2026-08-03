/*
 * QuotesCard.jsx — The three quotes picked for the user today.
 */

import { useEffect, useState } from "react";

import { API } from "../api.js";

export default function QuotesCard() {
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    API.dailyQuotes()
      .then((data) => {
        if (!cancelled) setQuotes(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    // Yellow, so the sidebar carries a colour block of its own.
    <section className="card card-yellow">
      <div className="card-title">
        <h2>💫 Daily motivation</h2>
      </div>

      {error && <p className="empty">{error}</p>}
      {!error && quotes === null && <p className="empty">Loading quotes…</p>}
      {!error && quotes?.length === 0 && <p className="empty">No quotes today.</p>}

      {quotes?.map((quote) => (
        <figure className="quote" key={`${quote.author}-${quote.text}`}>
          <p>“{quote.text}”</p>
          <cite>— {quote.author}</cite>
        </figure>
      ))}
    </section>
  );
}
