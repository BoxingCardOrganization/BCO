// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true, // 👈 allow Replit preview hosts
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/rpc": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
