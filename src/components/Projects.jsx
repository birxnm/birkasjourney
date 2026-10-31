/*
 * Projects.jsx — One solid colour card per project.
 */

import { projects } from "../data/profile.js";
import Reveal from "./Reveal.jsx";
import Section from "./Section.jsx";

function ProjectCard({ project }) {
  return (
    <Reveal as="article" className={`project tone-${project.color}`}>
      <div className="project-meta">
        <span>{project.period}</span>
        <span>{project.role}</span>
      </div>
      <h3>{project.name}</h3>
      <p>{project.summary}</p>
      <ul className="project-highlights">
        {project.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <ul className="chips" aria-label="Stack">
        {project.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {project.href && (
        <a className="project-link" href={project.href} target="_blank" rel="noreferrer">
          Open project <span aria-hidden="true">↗</span>
        </a>
      )}
    </Reveal>
  );
}

export default function Projects() {
  return (
    <Section id="projects" eyebrow="Projects" title="Things I've built.">
      <div className="projects">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </Section>
  );
}
