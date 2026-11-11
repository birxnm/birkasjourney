# AGENTS.md — Portfolio landing page

Rules for any AI coding agent working in this repository.

This is the personal portfolio of Birkhanym Kazhymukhamet: a single scrollable
landing page, built as a static site and deployed to Vercel (later to PS Cloud
under a custom .com domain). The previous project, *Birka's Journey*, lives on
the `archive/birkas-journey` branch.

## Stack

- React 19 + Vite, plain JSX (no TypeScript)
- Plain CSS driven by the tokens in `src/styles/tokens.css` (no Tailwind, no CSS-in-JS)
- Fonts, self-hosted via fontsource: Caveat Brush (big titles), Patrick Hand
  (labels, buttons), Josefin Sans (reading text, small caps)
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
- Contact details on the page are the ones the owner chose: phone, email,
  LinkedIn, two Instagram accounts, GitHub. Add nothing else private.

## Visual rules

- A warm hand-made title card, adapted from the owner's reference slide: cream
  paper (`--bg`, `--paper`), dusty-pink brush lettering, pink crayon scribbles
  (`Scribble.jsx`), small spaced capitals (`.caps`). No gradients or drop shadows.
- Pink roles: `--pink` for scribbles and fills only; `--pink-display` for brush
  titles (3:1 on cream); `--pink-ink` for pink text at body size (AA). Text on a
  pink fill uses `--on-pink`.
- Light and dark themes; dark is cocoa paper with the same pink.
- Every text pairing must clear WCAG AA in both themes (3:1 for large text).
- Must work from 375px wide with no horizontal scroll; respect `prefers-reduced-motion`.

## Workflow

1. Plan before non-trivial changes; wait for confirmation.
2. Keep edits narrow.
3. Verify with `npm run build` and a look at the page at phone and desktop widths, light and dark.

## Git

- Commit as the repository owner. No AI attribution anywhere: no `Co-Authored-By`
  or session trailers in commit messages, no "Generated with …" lines in PR
  descriptions, no AI tool named as author or committer.
