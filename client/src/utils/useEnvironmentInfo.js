export default function useEnvironmentInfo() {
  const envInfo = {
    env: import.meta.env.VITE_APP_ENV || "Not set",
    backendUrl: import.meta.env.VITE_APP_BACKEND_URL || "Not set",
    fastapiUrl: import.meta.env.VITE_APP_FASTAPI_URL || "Not set",
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
  };

  return envInfo;
}
