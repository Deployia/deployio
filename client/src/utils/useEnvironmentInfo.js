/**
 * Hook that provides environment information for debugging and display purposes
 * @returns {Object} Environment information including API URLs and build mode
 */
export default function useEnvironmentInfo() {
  const envInfo = {
    // Basic environment info
    environment: import.meta.env.VITE_APP_ENV || "Not set",
    backendUrl: import.meta.env.VITE_APP_BACKEND_URL || "Not set",
    fastapiUrl: import.meta.env.VITE_APP_FASTAPI_URL || "Not set",

    // Vite specific info
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,

    // Runtime info
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    buildTime: import.meta.env.VITE_APP_BUILD_TIME || "Not available",

    // Container/deployment detection
    inDocker:
      typeof window !== "undefined" && window.location.hostname !== "localhost",
    hostname:
      typeof window !== "undefined" ? window.location.hostname : "unknown",
    port: typeof window !== "undefined" ? window.location.port : "unknown",
    protocol:
      typeof window !== "undefined" ? window.location.protocol : "unknown",

    // Additional debugging info
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "unknown",
    platform: typeof window !== "undefined" ? navigator.platform : "unknown",
    language: typeof window !== "undefined" ? navigator.language : "unknown",
  };

  return envInfo;
}
