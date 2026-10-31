/*
 * Hero.jsx — Name, one-line positioning, calls to action, sticker art, and
 * headline numbers.
 *
 * The title's words rise in one after another. Screen readers get the whole
 * sentence from aria-label; the animated word spans are hidden from them.
 */

import { Fragment } from "react";

import { person, stats } from "../data/profile.js";
import HeroArt from "./HeroArt.jsx";
import Reveal from "./Reveal.jsx";

const GREETING = `Hi, I'm ${person.short}.`;
const ACCENT = "I turn AI ideas into";
const LAST_WORD = "products.";

function Words({ text, start }) {
  // The space sits outside the masked span: inline-blocks trim trailing spaces.
  return text.split(" ").map((word, index) => (
    <Fragment key={`${word}-${index}`}>
      <span className="word">
        <span style={{ "--i": start + index }}>{word}</span>
      </span>{" "}
    </Fragment>
  ));
}

export default function Hero() {
  const accentStart = GREETING.split(" ").length;
  const lastIndex = accentStart + ACCENT.split(" ").length;

  return (
    <section id="top" className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span className="dot" aria-hidden="true" /> {person.role} · {person.location}
            </p>
            <h1 className="hero-title" aria-label={`${GREETING} ${ACCENT} ${LAST_WORD}`}>
              <span aria-hidden="true">
                <Words text={GREETING} start={0} />
                <br />
                <span className="hero-accent">
                  <Words text={ACCENT} start={accentStart} />
                  <span className="word underlined">
                    <span style={{ "--i": lastIndex }}>{LAST_WORD}</span>
                    <svg className="squiggle" viewBox="0 0 300 24" preserveAspectRatio="none">
                      <path d="M4 16 Q 40 2 76 14 T 148 14 T 220 14 T 296 10" />
                    </svg>
                  </span>
                </span>
              </span>
            </h1>
            <p className="hero-lead">{person.tagline}</p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#projects">See my projects</a>
              <a className="btn btn-ghost" href={`mailto:${person.email}`}>Get in touch</a>
            </div>
          </div>

          <HeroArt photo={person.photo} name={person.name} />
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
