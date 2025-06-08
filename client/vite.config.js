import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Make env variables available to the client code
      // This way we can access them even at runtime
      __APP_ENV__: JSON.stringify({
        VITE_APP_ENV: env.VITE_APP_ENV || "development",
        VITE_APP_BACKEND_URL: env.VITE_APP_BACKEND_URL || "/api/v1",
        VITE_APP_FASTAPI_URL: env.VITE_APP_FASTAPI_URL || "/service/v1",
      }),
    },
  };
});
