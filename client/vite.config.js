import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), "");

  // Set defaults based on the environment
  const defaults = {
    development: {
      VITE_APP_ENV: "development",
      VITE_APP_BACKEND_URL: "http://localhost:3000/api/v1",
      VITE_APP_FASTAPI_URL: "http://localhost:8000/service/v1",
    },
    production: {
      VITE_APP_ENV: "production",
      VITE_APP_BACKEND_URL: "/api/v1",
      VITE_APP_FASTAPI_URL: "/service/v1",
    },
  };

  // Use environment default if value is not provided
  const currentDefaults =
    defaults[env.VITE_APP_ENV || mode] || defaults.development;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Use the provided env variables with fallback to defaults
      __APP_ENV__: JSON.stringify({
        VITE_APP_ENV: env.VITE_APP_ENV || currentDefaults.VITE_APP_ENV,
        VITE_APP_BACKEND_URL:
          env.VITE_APP_BACKEND_URL || currentDefaults.VITE_APP_BACKEND_URL,
        VITE_APP_FASTAPI_URL:
          env.VITE_APP_FASTAPI_URL || currentDefaults.VITE_APP_FASTAPI_URL,
      }),
    },
  };
});
