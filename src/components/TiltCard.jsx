/*
 * TiltCard.jsx — A project card that leans towards the pointer in 3D.
 *
 * The pointer position is written to --rx / --ry and CSS does the rotating,
 * so React doesn't re-render on every move. Only fine pointers (a mouse) tilt;
 * touch and reduced motion get a flat card.
 */

import { useRef } from "react";

const MAX_TILT = 8; // degrees

function canTilt() {
  return window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
}

export default function TiltCard({ project, index }) {
  const ref = useRef(null);

  const onMove = (event) => {
    const card = ref.current;
    if (!card || !canTilt()) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    card.style.setProperty("--ry", `${(x * MAX_TILT * 2).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${(-y * MAX_TILT * 2).toFixed(2)}deg`);
    card.classList.add("is-tilting");
  };

  const onLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.classList.remove("is-tilting");
  };

  return (
    <article
      ref={ref}
      className={`project tone-${project.color}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="project-meta">
        <span className="project-index">{String(index).padStart(2, "0")}</span>
        <span>{project.period}</span>
      </div>
      <h3>{project.name}</h3>
      <p className="project-role">{project.role}</p>
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
    </article>
  );
}
