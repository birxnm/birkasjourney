/*
 * Hero.jsx — The title card: arched photo with crayon scribbles, a giant
 * brush-script greeting that overlaps it, a small-caps intro, and the
 * headline numbers.
 *
 * The greeting's letters are written in one after another. Screen readers get
 * the plain sentence from aria-label; the letter spans are hidden from them.
 */

import { person, stats } from "../data/profile.js";
import Reveal from "./Reveal.jsx";
import Scribble from "./Scribble.jsx";

const GREETING = `hi, i'm ${person.short.toLowerCase()}`;

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-grid">
        <div className="hero-photo">
          <Scribble variant="zigzag" className="hero-scribble-a" />
          <Scribble variant="loops" className="hero-scribble-b" />
          <img src={person.photoHero} alt={person.name} width="640" height="800" />
        </div>

        <div className="hero-copy">
          <h1 className="brush hero-title" aria-label={GREETING}>
            {[...GREETING].map((char, index) => (
              <span key={index} aria-hidden="true" style={{ "--i": index }}>
                {char === " " ? " " : char}
              </span>
            ))}
          </h1>
          <p className="caps hero-lead">{person.tagline}</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#projects">see my projects</a>
            <a className="btn btn-ghost" href="#contact">let's contact</a>
          </div>
        </div>
      </div>

      <div className="container">
        <Reveal as="ul" className="stats">
          {stats.map((stat) => (
            <li key={stat.label} className="stat">
              <strong className="hand">{stat.value}</strong>
              <span className="caps">{stat.label}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
