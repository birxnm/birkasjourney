/*
 * Awards.jsx — Honours as a compact list.
 */

import { awards } from "../data/profile.js";
import Reveal from "./Reveal.jsx";
import Section from "./Section.jsx";

export default function Awards() {
  return (
    <Section id="awards" eyebrow="recognition" title="awards">
      <Reveal as="ul" className="awards">
        {awards.map((award) => (
          <li key={award.title}>
            <div>
              <strong>{award.title}</strong>
              <span>{award.detail}</span>
            </div>
            <span className="award-year">{award.year}</span>
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
