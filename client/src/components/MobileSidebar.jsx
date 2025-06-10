import { memo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaSpinner,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaTimes,
} from "react-icons/fa";

const MobileSidebar = memo(
  ({
    isOpen,
    onClose,
    navigationItems,
    openDropdown,
    toggleDropdown,
    scrollToSection,
    isAuthenticated,
    onLogout,
    isLoggingOut,
    user,
  }) => {
    const getInitials = (user) => {
      if (user?.firstName && user?.lastName) {
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
      }
      return user?.username ? user.username.slice(0, 2).toUpperCase() : "U";
    };

    const getDisplayName = (user) => {
      if (user?.firstName && user?.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      return user?.username || "User";
    }; // Touch swipe handling for closing sidebar
    const handleTouchStart = useCallback(
      (e) => {
        const touch = e.touches[0];
        const startX = touch.clientX;
        const startY = touch.clientY;

        // Only allow swipe from left portion of the screen (first 20% of width)
        if (startX > window.innerWidth * 0.2) return;

        const handleTouchMove = (moveEvent) => {
          const moveTouch = moveEvent.touches[0];
          const deltaX = moveTouch.clientX - startX;
          const deltaY = moveTouch.clientY - startY;

          // Only trigger if:
          // 1. Horizontal swipe is more dominant than vertical
          // 2. Swipe is to the right (positive deltaX)
          // 3. Swipe distance is at least 80px
          if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 80) {
            onClose();
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
          }
        };

        const handleTouchEnd = () => {
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
        };

        document.addEventListener("touchmove", handleTouchMove, {
          passive: true,
        });
        document.addEventListener("touchend", handleTouchEnd, {
          passive: true,
        });
      },
      [onClose]
    );

    const avatarUrl =
      user?.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        getInitials(user)
      )}&background=4F46E5&color=ffffff&size=60`;

    // Close sidebar when screen size changes to large
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 768 && isOpen) {
          onClose();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [isOpen, onClose]);

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />{" "}
            {/* Sidebar - Full screen slide in from left */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-full bg-neutral-900/95 backdrop-blur-md border-r border-neutral-800/50 z-50 md:hidden flex flex-col"
              onTouchStart={handleTouchStart}
            >
              {" "}
              {/* Header - Consistent with desktop navbar */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                    <img
                      src="/favicon.png"
                      alt="Deployio Logo"
                      className="w-6 h-6"
                    />
                  </div>
                  <span className="text-2xl font-bold text-white heading">
                    Deployio
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800/50 transition-all duration-200"
                >
                  <FaTimes className="w-5 h-5" />
                </motion.button>
              </div>{" "}
              {/* Content - Navigation Items */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {navigationItems.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: itemIndex * 0.1 + 0.2,
                        duration: 0.3,
                      }}
                    >
                      {/* Main navigation button */}
                      <button
                        onClick={() => toggleDropdown(`mobile-${item.id}`)}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-sm body rounded-lg border border-transparent hover:border-neutral-700"
                      >
                        <span>{item.label}</span>
                        <motion.div
                          animate={{
                            rotate:
                              openDropdown === `mobile-${item.id}` ? 180 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <FaChevronDown className="w-3 h-3 ml-1" />
                        </motion.div>
                      </button>

                      {/* Dropdown Content - Exact same styling as desktop */}
                      <AnimatePresence>
                        {openDropdown === `mobile-${item.id}` && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="mt-2 ml-4 bg-neutral-800/95 backdrop-blur-md border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden"
                          >
                            <div className="p-2">
                              {item.items.map((subItem, subIndex) => {
                                const Icon = subItem.icon;
                                return (
                                  <motion.div
                                    key={subItem.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      delay: subIndex * 0.03,
                                      duration: 0.15,
                                    }}
                                  >
                                    {subItem.href.startsWith("http") ? (
                                      <a
                                        href={subItem.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={onClose}
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
                                        onClick={onClose}
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
                    </motion.div>
                  ))}{" "}
                  {/* Pricing Button - Consistent with desktop */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    onClick={() => {
                      scrollToSection("#pricing");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 font-medium text-sm body rounded-lg border border-transparent hover:border-neutral-700"
                  >
                    <span>Pricing</span>
                  </motion.button>
                </div>
              </div>
              {/* Footer - Profile Section for Authenticated Users */}
              {isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 border-t border-neutral-800/50 bg-neutral-900/50"
                >
                  <div className="flex items-center gap-3">
                    {/* Profile Avatar and Info */}{" "}
                    <Link
                      to="/dashboard/profile"
                      onClick={onClose}
                      className="flex items-center gap-3 flex-1 p-2 rounded-lg hover:bg-neutral-800/50 transition-all duration-200 group"
                    >
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-xl border-2 border-neutral-600 shadow-lg group-hover:border-blue-500 transition-colors"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate group-hover:text-blue-400 transition-colors">
                          {getDisplayName(user)}
                        </h3>
                        <p className="text-gray-400 text-xs truncate group-hover:text-gray-300 transition-colors">
                          {user?.email || "user@example.com"}
                        </p>
                      </div>
                    </Link>
                    {/* Logout Icon Button */}
                    <button
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      disabled={isLoggingOut}
                      className={`p-3 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all duration-200 ${
                        isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      title="Logout"
                    >
                      {isLoggingOut ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaSignOutAlt className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Footer - Auth Buttons for Non-Authenticated Users */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 border-t border-neutral-800/50 bg-neutral-900/50"
                >
                  <div className="space-y-3">
                    <Link
                      to="/auth/login"
                      onClick={onClose}
                      className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 transition-all duration-200 font-medium text-sm body w-full"
                    >
                      <FaSignInAlt className="w-4 h-4" />
                      <span>Sign In</span>
                    </Link>

                    <Link
                      to="/auth/register"
                      onClick={onClose}
                      className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 font-medium text-sm body transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 w-full"
                    >
                      <FaUserPlus className="w-4 h-4" />
                      <span>Get Started</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

MobileSidebar.displayName = "MobileSidebar";

export default MobileSidebar;
