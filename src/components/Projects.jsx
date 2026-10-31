/*
 * Projects.jsx — Project cards on a horizontal track.
 *
 * Desktop: the section pins to the viewport and vertical scrolling slides
 * the track sideways. The section is made exactly as tall as the track is
 * wide (minus one screen), so one pixel scrolled down moves the track one
 * pixel left. Phones and reduced motion get a plain swipeable row with scroll
 * snapping instead — pinning fights touch scrolling.
 *
 * Either way, a counter and a progress bar follow where you are, and a click
 * on a card (or the arrow buttons) slides the next one in.
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
   * Moving between cards. A card's "position" is how far the track must
   * travel to bring it to the front. Pinned, that travel is page scroll
   * (the browser can't scroll a transformed element); otherwise it is the
   * viewport's own horizontal scroll.
   */
  const slides = () => Array.from(trackRef.current?.children ?? []);

  const positionOf = (index) => {
    const all = slides();
    const target = all[Math.max(0, Math.min(index, all.length - 1))];
    return target ? target.offsetLeft - all[0].offsetLeft : 0;
  };

  const currentPosition = () => {
    if (!pinned) return viewportRef.current?.scrollLeft ?? 0;
    return Math.max(0, -sectionRef.current.getBoundingClientRect().top);
  };

  const goTo = (index, smooth = true) => {
    const behavior = smooth ? "smooth" : "auto";
    const left = positionOf(index);
    if (pinned) {
      const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY;
      const travel = sectionRef.current.offsetHeight - window.innerHeight;
      window.scrollTo({ top: sectionTop + Math.min(left, travel), behavior });
    } else {
      viewportRef.current.scrollTo({ left, behavior });
    }
  };

  /* The card at the front: the last one whose position we've reached. */
  const frontIndex = () => {
    const at = currentPosition();
    return slides().reduce((front, _, index) => (positionOf(index) <= at + 8 ? index : front), 0);
  };

  /*
   * Clicking a card: if it's already at the front, bring in the next one;
   * otherwise bring this one to the front. Links inside keep working.
   */
  const onCardClick = (index) => (event) => {
    if (event.target.closest("a")) return;
    goTo(frontIndex() === index ? index + 1 : index);
  };

  /* Tabbing onto a card the track hasn't reached yet brings it into view. */
  const onCardFocus = (index) => () => {
    if (pinned) goTo(index, false);
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
          <div className="projects-meter">
            <div className="projects-nav">
              <button type="button" className="icon-btn" aria-label="Previous project" onClick={() => goTo(frontIndex() - 1)}>
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" className="icon-btn" aria-label="Next project" onClick={() => goTo(frontIndex() + 1)}>
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <span className="projects-count" aria-hidden="true">
              {String(current).padStart(2, "0")}
              <small> / {String(total).padStart(2, "0")}</small>
            </span>
            <span className="projects-bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${progress})` }} />
            </span>
          </div>
        </div>

        <div ref={viewportRef} className="projects-viewport">
          <ol ref={trackRef} className="projects-track">
            {projects.map((project, index) => (
              <li
                key={project.name}
                className="projects-slide"
                onClick={onCardClick(index)}
                onFocusCapture={onCardFocus(index)}
              >
                <TiltCard project={project} index={index + 1} />
              </li>
            ))}
            <li className="projects-slide projects-end" onFocusCapture={onCardFocus(projects.length)}>
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
