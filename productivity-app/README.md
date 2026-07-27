# Focus — IELTS 8.5 Sprint + Habits PWA

A personal productivity app to drive a focused sprint to the **IELTS exam on Aug 29, 2026**
(target overall **8.5** — L/R 9.0, Writing 7.0, Speaking 8.0), while tracking healthy habits
(gym 3×/week, pilates 2×/week, 2L water/day, sleep) and protecting deep-work time.

- **Backend:** FastAPI + SQLModel + SQLite
- **Frontend:** React + TypeScript + Vite + Tailwind + Recharts, installable **PWA**

> **The Instagram block till 20:00 is handled by iOS Screen Time**, not this app — a web app
> cannot block phone apps. The in-app **Block** tab has the one-time setup guide. The app shows
> your focus status and handles everything around the block (IELTS, habits, content time).

## Run it

**Backend** (terminal 1):
```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --reload --port 8123
```
API docs at http://127.0.0.1:8123/docs. On first run it seeds IELTS targets + a study plan
through Aug 29.

**Frontend** (terminal 2):
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The dev server proxies `/api` to the backend.

## Install on your iPhone (PWA)
1. `cd frontend && npm run build && npm run preview` (or deploy the `dist/` folder).
2. Open the URL in **Safari** → Share → **Add to Home Screen**.
3. It launches full-screen like a native app.

## Modules
- **Today** — countdown to exam, focus banner (flips at 20:00), today's IELTS tasks, water, sleep, habits.
- **IELTS** — band targets, mock-test trend vs 8.5, Writing/Speaking self-band trends, error log.
- **Habits** — gym/pilates weekly targets, water rings + streak, sleep log + chart.
- **Brand** — post-20:00 content sessions + consistency streak.
- **Block** — iOS Screen Time setup guide for the strict Instagram block.

## Reset / reseed
`POST /api/seed?force=true` regenerates the study plan (deletes existing tasks/targets).
