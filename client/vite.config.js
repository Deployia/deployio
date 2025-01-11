import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the mode (development or production)
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:1234",
          changeOrigin: true,
          logLevel: "debug",
        },
      },
    },
    build: {
      outDir: `/var/www/${env.VITE_APP_DOMAIN}`, // Output directory
      emptyOutDir: true,
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV), // Expose the environment to the frontend
    },
  };
});
