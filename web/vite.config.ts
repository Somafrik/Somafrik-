import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy /api to the Express backend so the BackOffice behaves
// exactly like in production (same-origin /api calls, JWT in Authorization).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    base: "/web/",
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_TARGET || "http://127.0.0.1:5000",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
