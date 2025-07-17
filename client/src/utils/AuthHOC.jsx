import { useSelector } from "react-redux";
import { useCTAAuthModal } from "@/utils/AuthModal";

/**
 * Higher-order component that wraps buttons/CTAs to show auth modal for unauthenticated users
 */
export const withAuthCTA = (Component, ctaContext = "default") => {
  return function AuthenticatedCTA({ onClick, ...props }) {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { showCTAAuthModal } = useCTAAuthModal();

    const handleClick = (e) => {
      if (!isAuthenticated) {
        e.preventDefault();
        showCTAAuthModal(ctaContext);
        return;
      }

      if (onClick) {
        onClick(e);
      }
    };

    return <Component {...props} onClick={handleClick} />;
  };
};

/**
 * Hook for protecting actions that require authentication
 */
export const useAuthAction = (ctaContext = "default") => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { showCTAAuthModal } = useCTAAuthModal();

  const protectAction = (action) => {
    return (...args) => {
      if (!isAuthenticated) {
        showCTAAuthModal(ctaContext);
        return;
      }

      return action(...args);
    };
  };

  return { protectAction, isAuthenticated };
};
