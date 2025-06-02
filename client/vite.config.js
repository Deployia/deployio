import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Allow access from network (Docker)
    port: 5173, // Vite default dev port
    proxy: {
      "/api": {
        target: "http://server:5000",
        changeOrigin: true,
        // No rewrite: /api/v1/health will be forwarded as http://server:5000/api/v1/health
      },
      "/service": {
        target: "http://service:8000",
        changeOrigin: true,
        // No rewrite: /service/v1/health will be forwarded as http://service:8000/service/v1/health
      },
    },
  },
});
