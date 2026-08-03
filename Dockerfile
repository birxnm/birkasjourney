# Dockerfile — one image that serves the API, the dashboard, and the bot.
#
# Built in two stages so Node is only needed to compile the dashboard and never
# ships in the final image. Works on any container host: Railway, Render,
# Fly.io, or plain `docker run`.
#
#   docker build -t birkas-journey .
#   docker run -p 8000:8000 --env-file backend/.env -v bj-data:/data birkas-journey

# ─── Stage 1: build the dashboard ────────────────────────────────────────────

FROM node:22-alpine AS frontend

WORKDIR /app/frontend

# Copied before the sources so a change to the app code doesn't reinstall
# every dependency.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─── Stage 2: the app ────────────────────────────────────────────────────────

FROM python:3.12-slim

# Unbuffered so uvicorn's logs reach the host's log viewer as they happen.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# main.py looks for the built dashboard at ../frontend/dist, relative to itself.
COPY --from=frontend /app/frontend/dist /app/frontend/dist

# Where the SQLite file lives. This must be a mounted volume on the host, or the
# database is wiped on every deploy — the container filesystem is not kept.
ENV DB_PATH=/data/birkasjourney.db
VOLUME /data

EXPOSE 8000

# Most hosts inject the port to listen on; fall back to 8000 for local runs.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
