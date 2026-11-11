/*
 * Section.jsx — A page section with its anchor id, a small hand-lettered
 * label, a brush-script title, and a crayon underline.
 */

import Reveal from "./Reveal.jsx";
import Scribble from "./Scribble.jsx";

export default function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`} className="brush">{title}</h2>
          <Scribble variant="underline" className="section-underline" />
        </Reveal>
        {children}
      </div>
    </section>
  );
}
