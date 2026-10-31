/*
 * Contact.jsx — Closing call to action on solid indigo, plus the footer line.
 */

import { person } from "../data/profile.js";
import Reveal from "./Reveal.jsx";

export default function Contact() {
  const year = new Date().getFullYear();

  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div className="container">
        <Reveal className="contact-inner">
          <p className="eyebrow">Contact</p>
          <h2 id="contact-title">Let's build something together.</h2>
          <p className="contact-lead">
            Open to internships, research, and AI product work. The fastest way to reach me is email.
          </p>
          <a className="btn btn-lime" href={`mailto:${person.email}`}>{person.email}</a>
          <ul className="contact-links">
            {person.links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="footer">© {year} {person.name} · {person.location}</p>
      </div>
    </section>
  );
}
