/*
 * Experience.jsx — Roles as a vertical timeline.
 */

import { experience } from "../data/profile.js";
import Reveal from "./Reveal.jsx";
import Section from "./Section.jsx";

export default function Experience() {
  return (
    <Section id="experience" eyebrow="Experience" title="Where I've worked.">
      <ol className="timeline">
        {experience.map((job) => (
          <Reveal as="li" key={`${job.org}-${job.role}`} className="timeline-item">
            <div className="timeline-when">{job.period}</div>
            <div className="timeline-body">
              <h3>
                {job.role} <span className="at">· {job.org}</span>
              </h3>
              <ul>
                {job.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
