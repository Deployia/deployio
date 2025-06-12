import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Custom hook for cross-page smooth scrolling
 * Handles navigation to different pages before scrolling to target sections
 */
export const useScrollToSection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = useCallback(
    (sectionId, targetPage = "/") => {
      // Check if element exists on current page
      const element = document.querySelector(sectionId);

      if (element) {
        // Element exists on current page, scroll to it
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        // Element doesn't exist on current page, navigate to target page
        if (location.pathname !== targetPage) {
          navigate(targetPage, {
            state: { scrollToSection: sectionId },
            replace: false,
          });
        }
      }
    },
    [location.pathname, navigate]
  );

  /**
   * Scroll to a section with a delay (useful for page transitions)
   */
  const scrollToSectionDelayed = useCallback((sectionId, delay = 100) => {
    const scrollTimeout = setTimeout(() => {
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, delay);

    return () => clearTimeout(scrollTimeout);
  }, []);

  return {
    scrollToSection,
    scrollToSectionDelayed,
  };
};

export default useScrollToSection;
