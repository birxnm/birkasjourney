/*
 * About.jsx — Two short paragraphs about who Birka is.
 */

import { about } from "../data/profile.js";
import Reveal from "./Reveal.jsx";
import Section from "./Section.jsx";

export default function About() {
  return (
    <Section id="about" eyebrow="engineer · founder · mentor" title="about me">
      <Reveal className="about">
        {about.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </Reveal>
    </Section>
  );
}
