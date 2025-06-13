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
  // and do not have a '_noCache' flag set in the config.
  if (
    config.method === "get" &&
    !config.url.includes("/me") && // Consider if /me should be cached or not based on volatility
    !config.url.includes("/sessions") && // Sessions are likely volatile, good to exclude
    !config._noCache // Check for the custom _noCache flag
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
          statusText: "OK (cached)",
          headers: { ...config.headers, "x-cached-response": "true" }, // Add a header to indicate cached response
          config,
        });
    }
  }
  return config;
});

// Automatically attempt token refresh on 401 responses
api.interceptors.response.use(
  (response) => {
    // Cache GET responses (excluding sensitive endpoints and _noCache requests)
    if (
      response.config.method === "get" &&
      !response.config.url.includes("/me") &&
      !response.config.url.includes("/sessions") &&
      !response.config._noCache && // Only cache if _noCache is not set
      response.status === 200 &&
      !response.headers["x-cached-response"] // Do not re-cache if it was served from cache by the request interceptor
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
        // After successful refresh, retry the original request.
        // If the original request was a GET, we might want to bypass cache for this retry
        // to ensure we get fresh data after re-authentication, though this depends on the specific needs.
        // For now, it will use the default caching behavior.
        return api(originalRequest);
      } catch (refreshError) {
        // Clear cache on auth failure to prevent serving stale data to a logged-out user
        cache.clear();
        // Potentially redirect to login or handle global logout state here
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Export cache clear function for manual cache management
export const clearApiCache = () => cache.clear();

// Function to clear a specific cache entry by URL (and optionally params)
export const invalidateCacheEntry = (url, params) => {
  const cacheKey = `get:${url}:${JSON.stringify(params)}`;
  cache.delete(cacheKey);
};

export default api;
