/*
 * Projects.jsx — Project cards on a horizontal track.
 *
 * Desktop: the section pins to the viewport and vertical scrolling slides
 * the track sideways. The section is made exactly as tall as the track is
 * wide (minus one screen), so one pixel scrolled down moves the track one
 * pixel left. Phones and reduced motion get a plain swipeable row with scroll
 * snapping instead — pinning fights touch scrolling.
 *
 * Either way, a counter and a progress bar follow where you are.
 */

import { useEffect, useRef, useState } from "react";

import { person, projects } from "../data/profile.js";
import TiltCard from "./TiltCard.jsx";

const PIN_QUERY = "(min-width: 761px) and (prefers-reduced-motion: no-preference)";

function usePinnedTrack(sectionRef, viewportRef, trackRef) {
  const [pinned, setPinned] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const media = window.matchMedia(PIN_QUERY);
    const update = () => setPinned(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return undefined;

    let frame = 0;
    let distance = 0;

    const measure = () => {
      distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
      section.style.height = pinned ? `${distance + window.innerHeight}px` : "";
      if (!pinned) track.style.transform = "";
    };

    const paint = () => {
      frame = 0;
      let value;
      if (pinned) {
        const top = section.getBoundingClientRect().top;
        value = distance ? Math.min(1, Math.max(0, -top / distance)) : 0;
        track.style.transform = `translate3d(${-value * distance}px, 0, 0)`;
      } else {
        value = distance ? viewport.scrollLeft / distance : 0;
      }
      setProgress(value);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onResize = () => {
      measure();
      schedule();
    };

    measure();
    paint();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", schedule, { passive: true });
    viewport.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", schedule);
      viewport.removeEventListener("scroll", schedule);
      section.style.height = "";
      track.style.transform = "";
    };
  }, [pinned, sectionRef, viewportRef, trackRef]);

  return { pinned, progress };
}

export default function Projects() {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const { pinned, progress } = usePinnedTrack(sectionRef, viewportRef, trackRef);

  const total = projects.length;
  const current = Math.min(total, Math.round(progress * (total - 1)) + 1);

  /*
   * Tabbing onto a card the track hasn't slid to yet: scroll the page so it
   * comes into view, since the browser can't scroll a transformed element.
   */
  const revealCard = (event) => {
    if (!pinned) return;
    const section = sectionRef.current;
    const card = event.currentTarget;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: sectionTop + card.offsetLeft - 32 });
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      className={`projects-section ${pinned ? "is-pinned" : ""}`}
      aria-labelledby="projects-title"
    >
      <div className="projects-sticky">
        <div className="container projects-head">
          <div>
            <p className="eyebrow">Projects</p>
            <h2 id="projects-title">Things I've built.</h2>
          </div>
          <div className="projects-meter" aria-hidden="true">
            <span className="projects-count">
              {String(current).padStart(2, "0")}
              <small> / {String(total).padStart(2, "0")}</small>
            </span>
            <span className="projects-bar">
              <span style={{ transform: `scaleX(${progress})` }} />
            </span>
          </div>
        </div>

        <div ref={viewportRef} className="projects-viewport">
          <ol ref={trackRef} className="projects-track">
            {projects.map((project, index) => (
              <li key={project.name} className="projects-slide" onFocusCapture={revealCard}>
                <TiltCard project={project} index={index + 1} />
              </li>
            ))}
            <li className="projects-slide projects-end" onFocusCapture={revealCard}>
              <a href={person.links.find((link) => link.label === "GitHub")?.href} target="_blank" rel="noreferrer">
                <span className="end-kicker">That's not all</span>
                <span className="end-title">More on GitHub</span>
                <span className="end-arrow" aria-hidden="true">→</span>
              </a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
