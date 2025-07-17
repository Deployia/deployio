import { useNavigate } from "react-router-dom";
import { useModal } from "@context/ModalContext";
import { FaSignInAlt, FaUserPlus, FaTimes } from "react-icons/fa";

/**
 * Authentication Modal Utility
 * Provides reusable authentication prompts for unauthenticated users
 */

/**
 * Get the current path for redirect after authentication
 */
const getCurrentPath = () => {
  return window.location.pathname + window.location.search;
};

/**
 * Store the intended destination in localStorage for post-auth redirect
 */
const storeIntendedDestination = (path) => {
  if (path && path !== "/auth/login" && path !== "/auth/register") {
    localStorage.setItem("auth_redirect_after_login", path);
  }
};

/**
 * Get and clear the intended destination from localStorage
 */
export const getAndClearIntendedDestination = () => {
  const destination = localStorage.getItem("auth_redirect_after_login");
  localStorage.removeItem("auth_redirect_after_login");
  return destination;
};

/**
 * Clear the intended destination (useful for logout)
 */
export const clearIntendedDestination = () => {
  localStorage.removeItem("auth_redirect_after_login");
};

/**
 * Hook for showing authentication modal
 */
export const useAuthModal = () => {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  const showAuthModal = (options = {}) => {
    const {
      title = "Authentication Required",
      message = "Please sign in to continue",
      showRegister = true,
      customPath = null,
      onClose = null,
    } = options;

    // Store current path for redirect after login
    const redirectPath = customPath || getCurrentPath();
    storeIntendedDestination(redirectPath);

    const handleLogin = () => {
      closeModal();
      const encodedPath = encodeURIComponent(redirectPath);
      navigate(`/auth/login?next=${encodedPath}`);
    };

    const handleRegister = () => {
      closeModal();
      const encodedPath = encodeURIComponent(redirectPath);
      navigate(`/auth/register?next=${encodedPath}`);
    };

    const handleClose = () => {
      closeModal();
      if (onClose) onClose();
    };

    openModal(
      <div className="relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-0 right-0 p-2 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="text-center pt-4">
          <FaSignInAlt className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-4 heading">{title}</h3>
          <p className="text-neutral-400 mb-6 body">{message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleLogin}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <FaSignInAlt className="w-4 h-4" />
              Sign In
            </button>
            {showRegister && (
              <button
                onClick={handleRegister}
                className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
              >
                <FaUserPlus className="w-4 h-4" />
                Register
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return { showAuthModal };
};

/**
 * HOC for components that need authentication modal
 */
export const withAuthModal = (Component) => {
  return function ComponentWithAuthModal(props) {
    const { showAuthModal } = useAuthModal();
    return <Component {...props} showAuthModal={showAuthModal} />;
  };
};

/**
 * Playground-specific authentication modal
 */
export const usePlaygroundAuthModal = () => {
  const { showAuthModal } = useAuthModal();

  const showPlaygroundAuthModal = () => {
    showAuthModal({
      title: "Welcome to Deployio Playground",
      message:
        "Sign in to start coding, analyzing, and deploying your projects with AI assistance",
      showRegister: true,
      customPath: "/playground",
    });
  };

  return { showPlaygroundAuthModal };
};

/**
 * CTA-specific authentication modal
 */
export const useCTAAuthModal = () => {
  const { showAuthModal } = useAuthModal();

  const showCTAAuthModal = (ctaContext = "") => {
    const messages = {
      deploy: "Sign in to deploy your projects with AI-powered automation",
      analyze: "Sign in to analyze your code with advanced AI insights",
      dashboard: "Sign in to access your personal dashboard and projects",
      api: "Sign in to access API testing and documentation tools",
      default:
        "Sign in to unlock all features and start building with Deployio",
    };

    showAuthModal({
      title: "Get Started with Deployio",
      message: messages[ctaContext] || messages.default,
      showRegister: true,
    });
  };

  return { showCTAAuthModal };
};
