/*
 * Hero.jsx — Name, one-line positioning, calls to action, headline numbers.
 */

import { person, stats } from "../data/profile.js";
import Reveal from "./Reveal.jsx";

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container">
        <p className="hero-kicker">
          <span className="dot" aria-hidden="true" /> {person.role} · {person.location}
        </p>
        <h1 className="hero-title">
          Hi, I'm {person.short}.
          <br />
          <span className="hero-accent">I turn AI ideas into products.</span>
        </h1>
        <p className="hero-lead">{person.tagline}</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#projects">See my projects</a>
          <a className="btn btn-ghost" href={`mailto:${person.email}`}>Get in touch</a>
        </div>

        <Reveal as="ul" className="stats">
          {stats.map((stat) => (
            <li key={stat.label} className={`stat tone-${stat.color}`}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
