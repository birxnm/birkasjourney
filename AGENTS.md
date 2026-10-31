# AGENTS.md — Portfolio landing page

Rules for any AI coding agent working in this repository.

This is the personal portfolio of Birkhanym Kazhymukhamet: a single scrollable
landing page, built as a static site and deployed to Vercel (later to PS Cloud
under a custom .com domain). The previous project, *Birka's Journey*, lives on
the `archive/birkas-journey` branch.

## Stack

- React 19 + Vite, plain JSX (no TypeScript)
- Plain CSS driven by the tokens in `src/styles/tokens.css` (no Tailwind, no CSS-in-JS)
- `@fontsource-variable/archivo`, self-hosted
- No backend, no router, no UI kit, no animation library. Keep it that way unless asked.
- `npm audit` must stay clean.

## Structure

| Path | Responsibility |
|---|---|
| `src/data/profile.js` | All text on the page. Content changes go here, not in components |
| `src/components/*.jsx` | One section each; presentational, driven by `profile.js` |
| `src/styles/tokens.css` | Tokens, theme, base styles |
| `src/styles/landing.css` | Layout and section styles |
| `src/theme.js` | Light/dark store, persisted in localStorage |

## Content rules

- Facts come from the owner's CV. Never invent numbers, awards, or dates.
- No phone number or other private details on the page — email and links only.

## Visual rules

- Flat and bright: four brand colours (`--indigo`, `--lime`, `--yellow`, `--pink`),
  near-black chunky type, big radii. No blur, gradients, or drop shadows.
- Text on lime/yellow/pink uses `--on-brand`; text on indigo uses `--on-indigo`.
- Indigo as text uses `--accent` (lighter in dark mode — brand indigo fails AA there).
- Every text pairing must clear WCAG AA in both themes.
- Must work from 375px wide with no horizontal scroll; respect `prefers-reduced-motion`.

## Workflow

1. Plan before non-trivial changes; wait for confirmation.
2. Keep edits narrow.
3. Verify with `npm run build` and a look at the page at phone and desktop widths, light and dark.
