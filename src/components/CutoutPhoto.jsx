/*
 * CutoutPhoto.jsx — A photo cut out along a traced outline, like a sticker.
 *
 * Inline SVG: the photo is clipped to the outline path from cutouts.js, and the
 * same path is drawn underneath with a thick cream stroke, which becomes the
 * paper border round the cut. The viewBox is padded so that border isn't
 * clipped at the edges.
 */

import { useId } from "react";

const BORDER = 22; // half the border stroke, in photo pixels

export default function CutoutPhoto({ cutout, alt, className = "" }) {
  const clipId = `cut-${useId().replace(/:/g, "")}`;
  const { width, height, path } = cutout;
  const href = `${import.meta.env.BASE_URL}${cutout.image}`;

  return (
    <svg
      className={`cutout ${className}`}
      viewBox={`${-BORDER} ${-BORDER} ${width + BORDER * 2} ${height + BORDER * 2}`}
      role="img"
      aria-label={alt}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <path className="cutout-border" d={path} strokeWidth={BORDER * 2} />
      <image href={href} width={width} height={height} clipPath={`url(#${clipId})`} />
    </svg>
  );
}
