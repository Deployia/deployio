import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Authentication redirect utilities
 * Provides reusable functions for handling auth redirects with next parameters
 */

/**
 * Check if user is authenticated and redirect to login if not
 * @param {Object} authState - Current auth state from Redux
 * @param {Function} navigate - React Router navigate function
 * @param {string} currentPath - Current path to return to after login
 * @returns {boolean} - Returns true if user is authenticated, false if redirected
 */
export const requireAuth = (authState, navigate, currentPath = null) => {
  const { isAuthenticated, loading } = authState;

  // Don't redirect if still loading auth state
  if (loading.me) {
    return false;
  }

  // If not authenticated, redirect to login with next parameter
  if (!isAuthenticated) {
    const nextPath =
      currentPath || window.location.pathname + window.location.search;
    const encodedNext = encodeURIComponent(nextPath);
    navigate(`/auth/login?next=${encodedNext}`);
    return false;
  }

  return true;
};

/**
 * Get the redirect path from URL params (for use after login)
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {string} - The path to redirect to, or default path
 */
export const getRedirectPath = (searchParams, defaultPath = "/dashboard") => {
  const next = searchParams.get("next");

  // Validate that the redirect path is safe (relative path, no external URLs)
  if (next) {
    try {
      // Decode the path
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
 * Create a protected component wrapper that automatically handles auth redirects
 * @param {React.Component} Component - The component to protect
 * @param {Object} options - Configuration options
 * @returns {React.Component} - Protected component
 */
export const withAuthRedirect = (Component, options = {}) => {
  const { redirectPath = null, loadingComponent = null } = options;

  return function ProtectedComponent(props) {
    const { authState, navigate, ...restProps } = props;

    // Show loading component while checking auth
    if (authState.loading.me && loadingComponent) {
      return loadingComponent;
    }

    // Check auth and redirect if needed
    const isAuthed = requireAuth(authState, navigate, redirectPath);

    // Only render component if authenticated
    if (!isAuthed) {
      return null;
    }

    return <Component {...restProps} />;
  };
};

/**
 * Hook for handling auth redirects in components
 * @param {string} customPath - Custom path to redirect to after login
 * @returns {Object} - Auth utilities
 */
export const useAuthRedirect = (customPath = null) => {
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);

  const checkAuth = () => {
    return requireAuth(authState, navigate, customPath);
  };

  const redirectToLogin = (nextPath = null) => {
    const pathToUse =
      nextPath ||
      customPath ||
      window.location.pathname + window.location.search;
    const encodedNext = encodeURIComponent(pathToUse);
    navigate(`/auth/login?next=${encodedNext}`);
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.loading.me,
    checkAuth,
    redirectToLogin,
  };
};
