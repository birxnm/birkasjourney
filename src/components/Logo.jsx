/*
 * Logo.jsx — A brand mark in a small white badge, or nothing when the name
 * has no mark in logos.js (RAG, Scrum, …), so callers can pass any label.
 *
 * The badge is always white so every mark keeps its own colour in both
 * themes; marks too pale to read on white (JavaScript yellow) get a dark
 * badge instead. Decorative: the label next to it carries the meaning.
 */

import { LOGOS } from "../data/logos.js";

function isPale(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.8;
}

export default function Logo({ name }) {
  const logo = LOGOS[name];
  if (!logo) return null;

  return (
    <span className={`logo-badge ${isPale(logo.hex) ? "is-dark" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill={logo.hex}>
        <path d={logo.path} />
      </svg>
    </span>
  );
}
