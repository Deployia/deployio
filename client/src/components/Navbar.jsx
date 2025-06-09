import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { toast } from "react-hot-toast";
import { useState, memo, useCallback, useRef, useEffect } from "react";
import {
  FaBars,
  FaTimes,
  FaSpinner,
  FaChevronDown,
  FaRocket,
  FaCode,
  FaCloud,
  FaShieldAlt,
  FaBook,
  FaLifeRing,
  FaUsers,
  FaBlog,
  FaDownload,
  FaGithub,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Memoize the component to prevent unnecessary re-renders
const Navbar = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const dropdownRef = useRef(null);
  // Close dropdown when clicking outside
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Navigation structure
  const navigationItems = [
    {
      label: "Products",
      id: "products",
      items: [
        {
          label: "AI Deployment",
          href: "/products/ai-deployment",
          icon: FaRocket,
          description: "Automated deployment with AI",
        },
        {
          label: "Code Analysis",
          href: "/products/code-analysis",
          icon: FaCode,
          description: "Smart code quality analysis",
        },
        {
          label: "Cloud Integration",
          href: "/products/cloud-integration",
          icon: FaCloud,
          description: "Multi-cloud deployment",
        },
        {
          label: "Security Shield",
          href: "/products/security",
          icon: FaShieldAlt,
          description: "Enterprise-grade security",
        },
      ],
    },
    {
      label: "Resources",
      id: "resources",
      items: [
        {
          label: "Documentation",
          href: "/docs",
          icon: FaBook,
          description: "Complete guides and API docs",
        },
        {
          label: "Support Center",
          href: "/support",
          icon: FaLifeRing,
          description: "24/7 developer support",
        },
        {
          label: "Community",
          href: "/community",
          icon: FaUsers,
          description: "Join our developer community",
        },
        {
          label: "Blog",
          href: "/blog",
          icon: FaBlog,
          description: "Latest updates and tutorials",
        },
      ],
    },
    {
      label: "Downloads",
      id: "downloads",
      items: [
        {
          label: "CLI Tool",
          href: "/downloads/cli",
          icon: FaDownload,
          description: "Command line interface",
        },
        {
          label: "SDK",
          href: "/downloads/sdk",
          icon: FaCode,
          description: "Software development kit",
        },
        {
          label: "Desktop App",
          href: "/downloads/desktop",
          icon: FaRocket,
          description: "Native desktop application",
        },
        {
          label: "GitHub",
          href: "https://github.com/deployio",
          icon: FaGithub,
          description: "Open source repositories",
        },
      ],
    },
  ];

  // Memoize event handlers to prevent re-creation on every render
  const onLogout = useCallback(() => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        toast.success("Logged out successfully");
        navigate("/");
        setIsMobileMenuOpen(false);
      })
      .catch((error) => {
        toast.error(error);
      });
  }, [dispatch, navigate]);
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setOpenDropdown(null); // Close any open dropdowns when toggling mobile menu
  }, []);
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);
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
    // Add a small delay before closing to allow smooth transitions
    const timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 100);
    setHoverTimeout(timeout);
  }, []);
  // Smooth scroll to section
  const scrollToSection = useCallback(
    (sectionId) => {
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      // Clear any existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setOpenDropdown(null);
      setIsMobileMenuOpen(false);
    },
    [hoverTimeout]
  );

  // Disable logout button while logout is processing
  const isLoggingOut = loading && loading.logout;

  return (
    <header className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800/50 sticky top-0 z-50 body shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            onClick={closeMobileMenu}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
              <img src="/favicon.png" alt="Deployio Logo" className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-white heading group-hover:text-blue-400 transition-colors duration-200">
              Deployio
            </span>
          </Link>{" "}
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
                        className={`absolute top-full mt-2 w-80 bg-neutral-800/95 backdrop-blur-md border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden z-50 ${
                          item.id === "downloads" ? "right-0" : "left-0"
                        }`}
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
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-700/60 transition-all duration-150 group"
                                  >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-white font-medium text-sm body group-hover:text-blue-400 transition-colors">
                                        {subItem.label}
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
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-700/60 transition-all duration-150 group"
                                  >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-white font-medium text-sm body group-hover:text-blue-400 transition-colors">
                                        {subItem.label}
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
              </li>
              {/* Authentication Links */}
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to="/profile"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-sm body border border-transparent hover:border-neutral-700"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/health"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-sm body border border-transparent hover:border-neutral-700"
                    >
                      Health
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={onLogout}
                      disabled={isLoggingOut}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 font-medium text-sm body transform hover:scale-105 shadow-lg ${
                        isLoggingOut
                          ? "opacity-50 cursor-not-allowed scale-100"
                          : "hover:shadow-red-500/25"
                      }`}
                    >
                      {isLoggingOut ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin flex-shrink-0" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        "Logout"
                      )}
                    </button>
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
          </nav>
          {/* Mobile Menu Button */}
          <motion.button
            onClick={toggleMobileMenu}
            whileTap={{ scale: 0.95 }}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-200"
            aria-label="Toggle mobile menu"
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <div className="mt-4 pb-4 border-t border-neutral-800">
                <nav className="pt-4">
                  {" "}
                  <motion.ul
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                    className="flex flex-col gap-2"
                  >
                    {/* Navigation Items */}
                    {navigationItems.map((item, itemIndex) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: (itemIndex + 1) * 0.1,
                          duration: 0.2,
                        }}
                      >
                        <button
                          onClick={() => toggleDropdown(`mobile-${item.id}`)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-base body border border-transparent hover:border-neutral-700"
                        >
                          <span>{item.label}</span>
                          <motion.div
                            animate={{
                              rotate:
                                openDropdown === `mobile-${item.id}` ? 180 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <FaChevronDown className="w-3 h-3" />
                          </motion.div>
                        </button>

                        {/* Mobile Dropdown Content */}
                        <AnimatePresence>
                          {openDropdown === `mobile-${item.id}` && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 mt-2 space-y-1">
                                {item.items.map((subItem, subIndex) => {
                                  const Icon = subItem.icon;
                                  return (
                                    <motion.div
                                      key={subItem.href}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        delay: subIndex * 0.05,
                                        duration: 0.2,
                                      }}
                                    >
                                      {subItem.href.startsWith("http") ? (
                                        <a
                                          href={subItem.href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={closeMobileMenu}
                                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800/30 transition-all duration-200 text-sm body"
                                        >
                                          <Icon className="w-4 h-4 text-blue-400" />
                                          <span>{subItem.label}</span>
                                        </a>
                                      ) : (
                                        <Link
                                          to={subItem.href}
                                          onClick={closeMobileMenu}
                                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800/30 transition-all duration-200 text-sm body"
                                        >
                                          <Icon className="w-4 h-4 text-blue-400" />
                                          <span>{subItem.label}</span>
                                        </Link>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.li>
                    ))}{" "}
                    {/* Pricing Link */}
                    <motion.li
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.2 }}
                    >
                      <button
                        onClick={() => scrollToSection("#pricing")}
                        className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-base body border border-transparent hover:border-neutral-700"
                      >
                        Pricing
                      </button>
                    </motion.li>
                    {/* Authentication Section */}
                    <div className="border-t border-neutral-800 mt-4 pt-4">
                      {isAuthenticated ? (
                        <>
                          <motion.li
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.2 }}
                          >
                            <Link
                              to="/profile"
                              onClick={closeMobileMenu}
                              className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-base body border border-transparent hover:border-neutral-700"
                            >
                              Profile
                            </Link>
                          </motion.li>
                          <motion.li
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.2 }}
                          >
                            <Link
                              to="/health"
                              onClick={closeMobileMenu}
                              className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-base body border border-transparent hover:border-neutral-700"
                            >
                              System Health
                            </Link>
                          </motion.li>
                          <motion.li
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7, duration: 0.2 }}
                            className="pt-2"
                          >
                            <button
                              onClick={onLogout}
                              disabled={isLoggingOut}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 font-medium text-base body ${
                                isLoggingOut
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:shadow-red-500/25"
                              }`}
                            >
                              {isLoggingOut ? (
                                <>
                                  <FaSpinner className="w-4 h-4 animate-spin flex-shrink-0" />
                                  <span>Logging out...</span>
                                </>
                              ) : (
                                "Logout"
                              )}
                            </button>
                          </motion.li>
                        </>
                      ) : (
                        <>
                          <motion.li
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.2 }}
                          >
                            <Link
                              to="/auth/login"
                              onClick={closeMobileMenu}
                              className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 transition-all duration-200 font-medium text-base body"
                            >
                              Sign In
                            </Link>
                          </motion.li>
                          <motion.li
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.2 }}
                          >
                            <Link
                              to="/auth/register"
                              onClick={closeMobileMenu}
                              className="flex items-center justify-center px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 font-medium text-base body shadow-lg hover:shadow-blue-500/25"
                            >
                              Get Started
                            </Link>
                          </motion.li>
                        </>
                      )}
                    </div>
                  </motion.ul>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
