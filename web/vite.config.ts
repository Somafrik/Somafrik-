import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy /api to the Express backend so the BackOffice behaves
// exactly like in production (same-origin /api calls, JWT in Authorization).
export default defineConfig({
  plugins: [react()],
  base: "/web/",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET ?? "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
