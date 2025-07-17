import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Essential authentication utilities
 * Simplified and focused on actual needs
 */

/**
 * Get authentication token from cookies
 */
export function getAuthToken() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "token") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Get the redirect path from URL params (for use after login)
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {string} defaultPath - Default path if no valid redirect is found
 * @returns {string} - The path to redirect to
 */
export const getRedirectPath = (searchParams, defaultPath = "/dashboard") => {
  const next = searchParams.get("next");

  if (next) {
    try {
      const decodedNext = decodeURIComponent(next);

      // Only allow relative paths that start with /
      if (decodedNext.startsWith("/") && !decodedNext.startsWith("//")) {
        // Prevent redirect to auth pages (infinite loop)
        if (decodedNext.startsWith("/auth/")) {
          return defaultPath;
        }
        return decodedNext;
      }
    } catch {
      console.warn("Invalid redirect path:", next);
    }
  }

  return defaultPath;
};

/**
 * Hook for handling authentication actions
 * @returns {Object} - Auth utilities
 */
export const useAuthActions = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const redirectToAuth = (type = "login", customPath = null) => {
    const currentPath =
      customPath || window.location.pathname + window.location.search;
    const encodedPath = encodeURIComponent(currentPath);
    navigate(`/auth/${type}?next=${encodedPath}`);
  };

  const redirectToLogin = (customPath = null) =>
    redirectToAuth("login", customPath);
  const redirectToRegister = (customPath = null) =>
    redirectToAuth("register", customPath);

  return {
    isAuthenticated,
    redirectToLogin,
    redirectToRegister,
    redirectToAuth,
  };
};

/**
 * Store intended destination for post-auth redirect
 */
export const storeIntendedDestination = (path) => {
  if (path && path !== "/auth/login" && path !== "/auth/register") {
    localStorage.setItem("auth_redirect_after_login", path);
  }
};

/**
 * Get and clear intended destination
 */
export const getAndClearIntendedDestination = () => {
  const destination = localStorage.getItem("auth_redirect_after_login");
  localStorage.removeItem("auth_redirect_after_login");
  return destination;
};

/**
 * Clear intended destination
 */
export const clearIntendedDestination = () => {
  localStorage.removeItem("auth_redirect_after_login");
};
