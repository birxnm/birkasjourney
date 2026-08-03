/*
 * vite.config.js — build and dev-server setup.
 *
 * Build output goes to frontend/dist, which is what FastAPI serves in
 * production. In development `npm run dev` proxies /api to uvicorn so the
 * browser talks to one origin and no CORS is involved.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
    },
  },
});
