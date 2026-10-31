/*
 * Header.jsx — Sticky top bar: monogram, section links, theme toggle.
 *
 * On phones the links collapse behind a menu button; picking a link closes it.
 */

import { useState } from "react";

import { useTheme } from "../hooks/useTheme.js";
import { toggleTheme } from "../theme.js";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#awards", label: "Awards" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const goingDark = theme === "light";

  return (
    <header className="header">
      <div className="container header-inner">
        <a className="logo" href="#top" aria-label="Back to top">BK</a>

        <nav id="site-nav" className={`nav ${open ? "is-open" : ""}`} aria-label="Sections">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={goingDark ? "Switch to dark mode" : "Switch to light mode"}
          >
            <span aria-hidden="true">{goingDark ? "☾" : "☀"}</span>
          </button>
          <button
            className="icon-btn menu-btn"
            type="button"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
