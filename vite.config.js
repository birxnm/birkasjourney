/*
 * vite.config.js — build setup. Output goes to dist/, which is what Vercel
 * (or any static host) serves as-is.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
