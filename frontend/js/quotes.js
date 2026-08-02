/*
 * quotes.js — The three quotes assigned to this user today.
 */

async function loadQuotes() {
  const container = document.getElementById("quotes-list");

  let quotes;
  try {
    quotes = await API.dailyQuotes();
  } catch (error) {
    container.innerHTML = `<p class="empty">${error.message}</p>`;
    return;
  }

  if (!quotes || !quotes.length) {
    container.innerHTML = '<p class="empty">No quotes available right now.</p>';
    return;
  }

  container.innerHTML = quotes
    .map(
      (quote) => `
        <blockquote class="quote">
          <p>"${escapeHtml(quote.text)}"</p>
          <cite>— ${escapeHtml(quote.author)}</cite>
        </blockquote>`
    )
    .join("");
}

/** Quotes come from a curated list, but never inject raw text into the DOM. */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
