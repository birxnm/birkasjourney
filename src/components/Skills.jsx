/*
 * Skills.jsx — Skill groups as chip clouds, with brand marks where known.
 */

import { skills } from "../data/profile.js";
import Logo from "./Logo.jsx";
import Reveal from "./Reveal.jsx";
import Section from "./Section.jsx";

export default function Skills() {
  return (
    <Section id="skills" eyebrow="what I work with" title="skills">
      <div className="skills">
        {skills.map((group) => (
          <Reveal key={group.group} className="skill-group">
            <h3>{group.group}</h3>
            <ul className="chips">
              {group.items.map((item) => (
                <li key={item}>
                  <Logo name={item} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
