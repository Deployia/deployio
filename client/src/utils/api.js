import axios from "axios";

// Simple in-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Cache interceptor for GET requests
api.interceptors.request.use((config) => {
  // Only cache GET requests that don't contain sensitive data
  if (
    config.method === "get" &&
    !config.url.includes("/me") &&
    !config.url.includes("/sessions")
  ) {
    const cacheKey = `${config.method}:${config.url}:${JSON.stringify(
      config.params
    )}`;
    const cachedResponse = cache.get(cacheKey);

    if (
      cachedResponse &&
      Date.now() - cachedResponse.timestamp < CACHE_DURATION
    ) {
      // Return cached response
      config.adapter = () =>
        Promise.resolve({
          data: cachedResponse.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        });
    }
  }

  return config;
});

// Automatically attempt token refresh on 401 responses
api.interceptors.response.use(
  (response) => {
    // Cache GET responses (excluding sensitive endpoints)
    if (
      response.config.method === "get" &&
      !response.config.url.includes("/me") &&
      !response.config.url.includes("/sessions") &&
      response.status === 200
    ) {
      const cacheKey = `${response.config.method}:${
        response.config.url
      }:${JSON.stringify(response.config.params)}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      // Clean up old cache entries periodically
      if (cache.size > 50) {
        const now = Date.now();
        for (const [key, value] of cache.entries()) {
          if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
          }
        }
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/refresh-token", {});
        return api(originalRequest);
      } catch (refreshError) {
        // Clear cache on auth failure
        cache.clear();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Export cache clear function for manual cache management
export const clearApiCache = () => cache.clear();

export default api;
