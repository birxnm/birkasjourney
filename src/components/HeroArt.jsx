/*
 * HeroArt.jsx — The sticker composition beside the hero text.
 *
 * Each shape drifts with the pointer and the scroll, by its own depth (--d),
 * so the layers separate like a parallax. Motion is driven by three CSS
 * variables written once per animation frame; the shapes' transforms live in
 * CSS. With prefers-reduced-motion the variables are never written, and the
 * shapes sit still.
 */

import { useEffect, useRef } from "react";

function useParallax(ref) {
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let frame = 0;
    let mx = 0;
    let my = 0;

    const paint = () => {
      frame = 0;
      node.style.setProperty("--mx", mx.toFixed(3));
      node.style.setProperty("--my", my.toFixed(3));
      node.style.setProperty("--sy", Math.min(window.scrollY, 900).toFixed(0));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onPointer = (event) => {
      mx = event.clientX / window.innerWidth - 0.5;
      my = event.clientY / window.innerHeight - 0.5;
      schedule();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", schedule);
    };
  }, [ref]);
}

export default function HeroArt({ photo, name }) {
  const ref = useRef(null);
  useParallax(ref);

  return (
    <div ref={ref} className="hero-art">
      <div className="shape shape-core" style={{ "--d": 0.4 }}>
        <div className="float" style={{ "--delay": "0s" }}>
          <div className="core">
            {photo ? <img src={photo} alt={name} /> : <span aria-hidden="true">BK</span>}
          </div>
        </div>
      </div>

      <div className="shape shape-circle" style={{ "--d": 1.2 }}>
        <div className="float" style={{ "--delay": "-1.5s" }}>
          <div className="sticker circle">AI<br />builder</div>
        </div>
      </div>

      <div className="shape shape-star" style={{ "--d": 1.8 }}>
        <div className="float" style={{ "--delay": "-3s" }}>
          <div className="sticker star">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M50 2 61 26 87 13 74 39 98 50 74 61 87 87 61 74 50 98 39 74 13 87 26 61 2 50 26 39 13 13 39 26Z" />
            </svg>
            <span>#1 of<br />6,000</span>
          </div>
        </div>
      </div>

      <div className="shape shape-pill" style={{ "--d": 1 }}>
        <div className="float" style={{ "--delay": "-4.5s" }}>
          <div className="sticker pill">Enactus World Cup · Top 4</div>
        </div>
      </div>

      <div className="shape shape-ring" style={{ "--d": 2.4 }} aria-hidden="true">
        <div className="float" style={{ "--delay": "-2s" }}>
          <div className="ring" />
        </div>
      </div>
    </div>
  );
}
