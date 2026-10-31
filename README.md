# Birkhanym Kazhymukhamet — portfolio

A one-page, scrollable portfolio: hero, about, projects, experience, awards,
skills, and contact. Static site built with React 19 + Vite — no backend.

## Run locally

Needs Node 20+.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve dist/ locally
```

## Edit the content

Every word on the page lives in [`src/data/profile.js`](src/data/profile.js).
Add a project, a role, or an award there; the components lay it out.

| Path | What it is |
|---|---|
| `src/data/profile.js` | All page content |
| `src/components/*.jsx` | One component per section, plus `Reveal` (scroll fade-in) |
| `src/styles/tokens.css` | Colours, fonts, light/dark theme |
| `src/styles/landing.css` | Layout and section styles |
| `src/theme.js` | Light/dark toggle, remembered per browser |

## Deploy

`dist/` is plain HTML/CSS/JS and runs on any static host.

- **Vercel:** import the repo, preset **Vite**, build `npm run build`, output `dist`.
- **Shared hosting / VPS (e.g. PS Cloud):** run `npm run build` and upload the
  contents of `dist/` to the web root (`public_html` or `/var/www/...`).

## Previous project

This repository used to hold *Birka's Journey*, a habit tracker with a Telegram
bot and a web dashboard. That code is kept on the `archive/birkas-journey` branch.
