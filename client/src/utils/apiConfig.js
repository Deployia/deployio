// This file centralizes API base URL configuration

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_APP_ENV === "production") {
    return "/api/v1";
  }
  return import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000/api/v1";
};

const getFastApiBaseUrl = () => {
  if (import.meta.env.VITE_APP_ENV === "production") {
    return "/service/v1";
  }
  return (
    import.meta.env.VITE_APP_FASTAPI_URL || "http://localhost:8000/service/v1"
  );
};

// Log the URLs to help with debugging
console.log("API Base URLs:", {
  api: getApiBaseUrl(),
  fastapi: getFastApiBaseUrl(),
  env: import.meta.env.VITE_APP_ENV,
});

export { getApiBaseUrl, getFastApiBaseUrl };
