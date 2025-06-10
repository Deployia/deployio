import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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

    // Path aliases for cleaner imports
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@auth": path.resolve(__dirname, "./src/pages/auth"),
        "@dashboard": path.resolve(__dirname, "./src/pages/dashboard"),
        "@marketing": path.resolve(__dirname, "./src/pages/marketing"),
        "@legal": path.resolve(__dirname, "./src/pages/legal"),
        "@support": path.resolve(__dirname, "./src/pages/support"),
        "@products": path.resolve(__dirname, "./src/pages/products"),
        "@downloads": path.resolve(__dirname, "./src/pages/downloads"),
        "@redux": path.resolve(__dirname, "./src/redux"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@constants": path.resolve(__dirname, "./src/constants"),
        "@context": path.resolve(__dirname, "./src/context"),
        "@assets": path.resolve(__dirname, "./src/assets"),
      },
    },

    // Performance optimizations
    build: {
      // Enable code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks
            "react-vendor": ["react", "react-dom"],
            "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
            "router-vendor": ["react-router-dom"],
            "ui-vendor": ["framer-motion", "react-hot-toast", "react-icons"],
            "auth-vendor": ["qrcode.react", "zxcvbn"],
          },
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Enable minification
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production",
        },
      },
      // Source maps only in development
      sourcemap: mode === "development",
    },

    // Development server optimizations
    server: {
      // Enable hot reload optimization
      hmr: {
        overlay: false,
      },
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@reduxjs/toolkit",
        "react-redux",
        "framer-motion",
        "axios",
      ],
      exclude: ["@vite/client", "@vite/env"],
    },

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
