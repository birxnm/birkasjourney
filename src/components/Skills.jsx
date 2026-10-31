/*
 * Skills.jsx — Skill groups as chip clouds.
 */

import { skills } from "../data/profile.js";
import Reveal from "./Reveal.jsx";
import Section from "./Section.jsx";

export default function Skills() {
  return (
    <Section id="skills" eyebrow="Skills" title="What I work with.">
      <div className="skills">
        {skills.map((group) => (
          <Reveal key={group.group} className="skill-group">
            <h3>{group.group}</h3>
            <ul className="chips">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
