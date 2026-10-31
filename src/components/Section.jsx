/*
 * Section.jsx — A page section with its anchor id, eyebrow, and heading.
 */

import Reveal from "./Reveal.jsx";

export default function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
