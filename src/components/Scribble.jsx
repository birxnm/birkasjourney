/*
 * Scribble.jsx — A pink crayon scribble that draws itself once in view.
 *
 * The rough crayon edge is an SVG turbulence filter displacing a plain
 * stroke; the drawing is a dash offset animated from 1 to 0 (pathLength=1
 * makes that independent of the path's real length). Decorative only.
 */

import { useEffect, useId, useRef, useState } from "react";

const PATHS = {
  zigzag: {
    viewBox: "0 0 200 160",
    d: "M8 150 C 20 90, 30 40, 40 12 C 50 60, 58 110, 70 146 C 82 100, 92 50, 104 16 C 116 64, 124 112, 136 142 C 148 96, 160 54, 172 24 C 180 60, 186 90, 192 110",
  },
  loops: {
    viewBox: "0 0 240 120",
    d: "M6 90 C 30 20, 70 10, 60 60 C 52 100, 20 80, 44 52 C 70 22, 110 30, 100 72 C 92 104, 64 86, 88 58 C 112 30, 150 36, 142 76 C 136 104, 108 92, 130 62 C 154 32, 196 40, 186 80 C 180 104, 160 96, 176 72 C 196 44, 222 50, 234 70",
  },
  underline: {
    viewBox: "0 0 300 30",
    d: "M4 20 C 60 6, 110 26, 160 14 S 250 6, 296 16",
  },
};

export default function Scribble({ variant = "zigzag", className = "" }) {
  const ref = useRef(null);
  const filterId = useId().replace(/:/g, "");
  const [drawn, setDrawn] = useState(false);
  const shape = PATHS[variant];

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) {
      setDrawn(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setDrawn(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className={`scribble scribble-${variant} ${drawn ? "is-drawn" : ""} ${className}`}
      viewBox={shape.viewBox}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="4" />
        </filter>
      </defs>
      <path d={shape.d} pathLength="1" filter={`url(#${filterId})`} />
    </svg>
  );
}
