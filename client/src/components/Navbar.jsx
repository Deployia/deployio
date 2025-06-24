import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "@redux/index";
import { toast } from "react-hot-toast";
import { useState, memo, useCallback, useRef, useEffect, useMemo } from "react";
import { FaBars, FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ProfileAvatar from "./ProfileAvatar";
import NotificationBell from "./notifications/NotificationBell";
import MobileSidebar from "./MobileSidebar";
import { useScrollToSection as useScrollHook } from "@hooks/useScrollToSection";
import {
  homeNavigationItems,
  dashboardNavigationItems,
} from "@constants/navigation";

// Memoize the component to prevent unnecessary re-renders
const Navbar = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const dropdownRef = useRef(null); // Determine which navigation items to use based on current route
  const navigationItems = useMemo(() => {
    // If user is on dashboard routes, show dashboard navigation
    if (location.pathname.startsWith("/dashboard")) {
      // Filter out admin navigation if user is not admin
      if (user?.role !== "admin") {
        return dashboardNavigationItems.filter((item) => item.id !== "admin");
      }
      return dashboardNavigationItems;
    }
    // For admin routes, show admin navigation
    if (location.pathname.startsWith("/admin") && user?.role === "admin") {
      return dashboardNavigationItems; // Admin sees all dashboard items including admin
    }
    // Otherwise show home navigation
    return homeNavigationItems;
  }, [location.pathname, user?.role]);

  // Close dropdowns when location changes
  useEffect(() => {
    setOpenDropdown(null);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }, [location.pathname, hoverTimeout]);

  // Close dropdown when clicking outside or on mobile screen resize
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          setHoverTimeout(null);
        }
      }
    };
    const handleResize = () => {
      // Close dropdowns on screen size changes to prevent issues
      setOpenDropdown(null);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Memoize event handlers to prevent re-creation on every render
  const onLogout = useCallback(() => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        toast.success("Logged out successfully");
        navigate("/");
      })
      .catch((error) => {
        toast.error(error);
      });
  }, [dispatch, navigate]);

  const { scrollToSection: hookScrollToSection } = useScrollHook();

  // Enhanced smooth scroll to section with cross-page navigation
  const scrollToSection = useCallback(
    (sectionId) => {
      // Clear dropdown immediately
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setOpenDropdown(null);

      // Use the hook for consistent cross-page navigation
      hookScrollToSection(sectionId);
    },
    [hoverTimeout, hookScrollToSection]
  );

  // Handler for logo click - scroll to top if on home page, otherwise navigate to home
  const handleLogoClick = useCallback(
    (e) => {
      if (location.pathname === "/") {
        // If on home page, prevent navigation and scroll to top
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
      // If not on home page, let the Link handle navigation normally
    },
    [location.pathname]
  );

  const toggleDropdown = useCallback((dropdownId) => {
    setOpenDropdown((prev) => (prev === dropdownId ? null : dropdownId));
  }, []);

  const openDropdownOnHover = useCallback(
    (dropdownId) => {
      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setOpenDropdown(dropdownId);
    },
    [hoverTimeout]
  );
  const closeDropdown = useCallback(() => {
    // Add a longer delay before closing to improve UX
    const timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 700); // Increased to 700ms for better UX
    setHoverTimeout(timeout);
  }, []);

  const keepDropdownOpen = useCallback(() => {
    // Clear timeout when hovering over dropdown content
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }, [hoverTimeout]);
  // Disable logout button while logout is processing
  const isLoggingOut = loading && loading.logout;

  const openMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);
  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Determine navbar positioning based on current route
  const isHomePage = useMemo(() => {
    // Check for exact home page or top-level sections
    const path = location.pathname;
    return (
      path === "/" ||
      path.startsWith("/downloads/") ||
      path.startsWith("/products/")
    );
  }, [location.pathname]);
  const positionClass = isHomePage ? "fixed" : "sticky";

  return (
    <>
      <header
        className={`bg-neutral-900/70 backdrop-blur-lg border-b border-neutral-800/30 ${positionClass} top-0 z-50 body shadow-xl w-full`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}{" "}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              onClick={handleLogoClick}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <img src="/favicon.png" alt="Deployio Logo" />
              </div>
              <span className="text-2xl font-bold text-white heading group-hover:text-blue-400 transition-colors duration-200">
                Deployio
              </span>
            </Link>
            {/* Desktop Navigation */}
            <nav
              className="hidden md:block"
              ref={dropdownRef}
              onMouseLeave={closeDropdown}
            >
              <ul className="flex items-center gap-2">
                {/* Navigation Dropdowns */}
                {navigationItems.map((item) => (
                  <li
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => openDropdownOnHover(item.id)}
                  >
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-sm body border border-transparent hover:border-neutral-700"
                    >
                      {item.label}
                      <motion.div
                        animate={{ rotate: openDropdown === item.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FaChevronDown className="w-3 h-3 ml-1" />
                      </motion.div>
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {openDropdown === item.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          onMouseEnter={keepDropdownOpen}
                          onMouseLeave={closeDropdown}
                          className={`absolute top-full mt-2 w-80 bg-neutral-800/95 backdrop-blur-lg border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden z-50 ${
                            item.id === "resources"
                              ? "right-0"
                              : item.id === "downloads"
                              ? "left-1/2 transform -translate-x-1/2"
                              : "left-0"
                          } max-w-[calc(100vw-2rem)] lg:max-w-80`}
                        >
                          <div className="p-2">
                            {item.items.map((subItem, index) => {
                              const Icon = subItem.icon;
                              return (
                                <motion.div
                                  key={subItem.href}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    delay: index * 0.03,
                                    duration: 0.15,
                                  }}
                                >
                                  {subItem.href.startsWith("http") ? (
                                    <a
                                      href={subItem.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={closeDropdown}
                                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-700/80 transition-all duration-200 group relative overflow-hidden"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg relative z-10">
                                        <Icon className="w-4 h-4 text-white" />
                                      </div>{" "}
                                      <div className="flex-1 relative z-10">
                                        <div className="flex items-center justify-between">
                                          <div className="text-white font-medium text-sm body group-hover:text-blue-400 transition-colors">
                                            {subItem.label}
                                          </div>
                                          {subItem.comingSoon && (
                                            <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 rounded-full animate-pulse">
                                              {subItem.comingSoon}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-gray-400 text-xs body mt-1 group-hover:text-gray-300 transition-colors">
                                          {subItem.description}
                                        </div>
                                      </div>
                                    </a>
                                  ) : (
                                    <Link
                                      to={subItem.href}
                                      onClick={closeDropdown}
                                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-700/80 transition-all duration-200 group relative overflow-hidden"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg relative z-10">
                                        <Icon className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="flex-1 relative z-10">
                                        <div className="flex items-center justify-between">
                                          <div className="text-white font-medium text-sm body group-hover:text-blue-400 transition-colors">
                                            {subItem.label}
                                          </div>
                                          {subItem.comingSoon && (
                                            <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 rounded-full animate-pulse">
                                              {subItem.comingSoon}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-gray-400 text-xs body mt-1 group-hover:text-gray-300 transition-colors">
                                          {subItem.description}
                                        </div>
                                      </div>
                                    </Link>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}{" "}
                {/* Pricing Link */}
                <li>
                  <button
                    onClick={() => scrollToSection("#pricing")}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-sm body border border-transparent hover:border-neutral-700"
                  >
                    Pricing
                  </button>
                </li>{" "}
                {/* Authentication Links */}
                {isAuthenticated ? (
                  <>
                    {/* Notification Bell for authenticated users */}
                    <li>
                      <NotificationBell />
                    </li>
                    <li>
                      <ProfileAvatar
                        user={user}
                        isOpen={openDropdown === "profile"}
                        toggleDropdown={() => toggleDropdown("profile")}
                        closeDropdown={closeDropdown}
                        openDropdownOnHover={openDropdownOnHover}
                        keepDropdownOpen={keepDropdownOpen}
                        onLogout={onLogout}
                        isLoggingOut={isLoggingOut}
                      />
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/auth/login"
                        className="inline-flex items-center justify-center px-6 py-2 rounded-lg text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 transition-all duration-200 font-medium text-sm body"
                      >
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/auth/register"
                        className="inline-flex items-center justify-center px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 font-medium text-sm body transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                      >
                        Get Started
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>{" "}
            {/* Mobile Menu Button */}
            <motion.button
              onClick={openMobileSidebar}
              whileTap={{ scale: 0.95 }}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-200"
              aria-label="Toggle mobile menu"
            >
              <FaBars className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>{" "}
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        navigationItems={navigationItems}
        scrollToSection={scrollToSection}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        user={user}
      />
    </>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
