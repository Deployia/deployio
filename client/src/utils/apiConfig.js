// This file centralizes API base URL configuration

// Simply use the environment variables, which are properly set with defaults in vite.config.js
const getApiBaseUrl = () => import.meta.env.VITE_APP_BACKEND_URL;
const getFastApiBaseUrl = () => import.meta.env.VITE_APP_FASTAPI_URL;

// Log the URLs to help with debugging
console.log("API Base URLs:", {
  api: getApiBaseUrl(),
  fastapi: getFastApiBaseUrl(),
  env: import.meta.env.VITE_APP_ENV,
});

export { getApiBaseUrl, getFastApiBaseUrl };
