/*
 * Mascot.jsx — The little characters on the entry pages and the empty state.
 *
 * Three shapes, each with dot eyes and a smile: a rounded square, a half-disc,
 * and a hexagon. Inline SVG rather than image files, so they inherit the brand
 * colours and stay crisp at any size.
 */

/* Where each shape's face sits, since the drawable area differs per shape. */
const SHAPES = {
  square: {
    body: <rect x="10" y="16" width="80" height="74" rx="24" />,
    face: { eyes: 46, smile: 62 },
  },
  halfDisc: {
    // Flat along the bottom, curved over the top.
    body: <path d="M12 86a38 38 0 0 1 76 0Z" />,
    face: { eyes: 62, smile: 74 },
  },
  hexagon: {
    body: <path d="M50 10 88 31v42L50 94 12 73V31Z" />,
    face: { eyes: 46, smile: 62 },
  },
};

/**
 * @param shape  square | halfDisc | hexagon
 * @param color  any CSS colour for the body
 * @param arms   draw the stick arms and legs from the reference
 */
export default function Mascot({ shape = "square", color = "var(--lime)", arms = false }) {
  const { body, face } = SHAPES[shape] ?? SHAPES.square;

  return (
    <svg
      className="mascot"
      viewBox="0 0 100 110"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {/* Limbs sit behind the body so they read as attached to it. */}
      {arms && (
        <g
          fill="none"
          stroke="var(--on-brand)"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M14 58C2 62 2 74 10 78" />
          <path d="M86 58c12 4 12 16 4 20" />
          <circle cx="9" cy="79" r="3.5" fill="var(--on-brand)" stroke="none" />
          <circle cx="91" cy="79" r="3.5" fill="var(--on-brand)" stroke="none" />
          <path d="M36 88v14M64 88v14" />
          <path d="M30 103h8M62 103h8" />
        </g>
      )}

      <g fill={color}>{body}</g>

      <g fill="var(--on-brand)">
        <circle cx="39" cy={face.eyes} r="4.2" />
        <circle cx="61" cy={face.eyes} r="4.2" />
      </g>
      <path
        d={`M39 ${face.smile}q11 10 22 0`}
        fill="none"
        stroke="var(--on-brand)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
