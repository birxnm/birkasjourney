/*
 * Header.jsx — The three-column top line: name, role, place and year.
 *
 * Section links live behind the menu button on every width, so the top line
 * stays as calm as a title card. Picking a link closes the menu.
 */

import { useState } from "react";

import { person } from "../data/profile.js";
import { useTheme } from "../hooks/useTheme.js";
import { toggleTheme } from "../theme.js";

const LINKS = [
  { href: "#about", label: "about me" },
  { href: "#projects", label: "projects" },
  { href: "#experience", label: "experience" },
  { href: "#awards", label: "awards" },
  { href: "#skills", label: "skills" },
  { href: "#contact", label: "let's contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const goingDark = theme === "light";

  return (
    <header className="header">
      <div className="container header-inner">
        <a className="header-name" href="#top">{person.name}</a>
        <span className="header-role">{person.role}</span>
        <div className="header-end">
          <span className="header-date">{person.location.split(",")[0]} {person.year}</span>
          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={goingDark ? "Switch to dark mode" : "Switch to light mode"}
          >
            <span aria-hidden="true">{goingDark ? "☾" : "☀"}</span>
          </button>
          <button
            className="icon-btn"
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

      <nav id="site-nav" className={`nav ${open ? "is-open" : ""}`} aria-label="Sections">
        <div className="container nav-inner">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
