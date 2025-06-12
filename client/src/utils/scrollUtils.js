/**
 * Smooth scrolling utilities for cross-page navigation
 */

/**
 * Scroll to a section with optional cross-page navigation
 * @param {string} sectionId - CSS selector for the target section (e.g., "#pricing")
 * @param {string} targetPage - Page path where the section exists (default: "/")
 * @param {function} navigate - React Router navigate function
 * @param {object} location - React Router location object
 */
export const scrollToSection = (
  sectionId,
  targetPage = "/",
  navigate,
  location
) => {
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
};

/**
 * Enhanced scroll with URL hash support
 * @param {string} sectionId - CSS selector for the target section
 * @param {string} targetPage - Page path where the section exists
 * @param {function} navigate - React Router navigate function
 */
export const scrollToSectionWithHash = (
  sectionId,
  targetPage = "/",
  navigate,
) => {
  const element = document.querySelector(sectionId);

  if (element) {
    // Element exists, scroll and update URL hash
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    // Update URL hash without navigation
    window.history.replaceState(null, null, sectionId);
  } else {
    // Navigate to target page with hash
    navigate(`${targetPage}${sectionId}`, {
      state: { scrollToSection: sectionId },
      replace: false,
    });
  }
};

/**
 * Get all sections with IDs on the current page
 * Useful for building navigation menus dynamically
 */
export const getPageSections = () => {
  const sections = document.querySelectorAll("[id]");
  return Array.from(sections).map((section) => ({
    id: section.id,
    element: section,
    offsetTop: section.offsetTop,
    title: section.getAttribute("data-title") || section.id,
  }));
};

/**
 * Check if a section exists on the current page
 * @param {string} sectionId - CSS selector for the section
 */
export const sectionExists = (sectionId) => {
  return document.querySelector(sectionId) !== null;
};

export default {
  scrollToSection,
  scrollToSectionWithHash,
  getPageSections,
  sectionExists,
};
