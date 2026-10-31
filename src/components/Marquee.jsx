/*
 * Marquee.jsx — Two crossed, endlessly scrolling strips under the hero.
 *
 * Each track holds its items twice and slides by half its width, so the loop
 * is seamless. The copy is aria-hidden; screen readers hear each list once.
 */

import { marquee } from "../data/profile.js";

function Strip({ items, className }) {
  return (
    <div className={`strip ${className}`}>
      <div className="strip-track">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
            {items.map((item) => (
              <li key={item}>
                {item}
                <span className="strip-sep" aria-hidden="true">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="marquee">
      <Strip items={marquee.bottom} className="strip-yellow" />
      <Strip items={marquee.top} className="strip-indigo" />
    </div>
  );
}
