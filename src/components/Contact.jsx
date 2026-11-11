/*
 * Contact.jsx — The closing card, laid out like the reference slide: a giant
 * "let's contact", a small-caps line, then a small photo beside the contact
 * list. The footer line sits underneath.
 */

import { person } from "../data/profile.js";
import Reveal from "./Reveal.jsx";
import Scribble from "./Scribble.jsx";

export default function Contact() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div className="container">
        <Reveal className="contact-card">
          <Scribble variant="zigzag" className="contact-scribble-a" />
          <Scribble variant="loops" className="contact-scribble-b" />

          <h2 id="contact-title" className="brush contact-title">let's contact</h2>
          <p className="caps contact-lead">
            Open to internships, research, and AI product work. Write to me about a project,
            a hackathon team, or a talk.
          </p>

          <div className="contact-row">
            <img src={person.photoSmall} alt="" width="420" height="420" className="contact-photo" />
            <ul className="contact-list">
              {person.contacts.map((contact) => (
                <li key={contact.href}>
                  <a
                    href={contact.href}
                    target={contact.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                  >
                    {contact.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <p className="footer hand">
          {person.name} · {person.location} · {person.year}
        </p>
      </div>
    </section>
  );
}
