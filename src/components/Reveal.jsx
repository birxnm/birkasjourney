/*
 * Reveal.jsx — Fades its children up the first time they scroll into view.
 *
 * Uses IntersectionObserver, no animation library. The hidden state is applied
 * only once JS has run (the .reveal-ready class), so without JS — or with
 * prefers-reduced-motion, handled in CSS — content is simply visible.
 */

import { useEffect, useRef, useState } from "react";

export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) {
      setShown(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal-ready ${shown ? "is-shown" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
