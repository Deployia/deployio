import { memo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
  FaSpinner,
  FaShieldAlt,
  FaHistory,
} from "react-icons/fa";

const ProfileAvatar = memo(
  ({
    user,
    isOpen,
    toggleDropdown,
    closeDropdown,
    onLogout,
    isLoggingOut,
    className = "",
  }) => {
    const profileMenuItems = [
      {
        label: "Overview",
        href: "/dashboard/profile?tab=overview",
        icon: FaUser,
        description: "View your profile overview",
      },
      {
        label: "Profile Settings",
        href: "/dashboard/profile?tab=profile",
        icon: FaCog,
        description: "Manage your profile settings",
      },
      {
        label: "Security",
        href: "/dashboard/profile?tab=security",
        icon: FaShieldAlt,
        description: "Manage security settings and tokens",
      },
      {
        label: "Activity",
        href: "/dashboard/profile?tab=activity",
        icon: FaHistory,
        description: "View your recent activities",
      },
    ];

    // Close dropdown on window resize
    useEffect(() => {
      const handleResize = () => {
        if (isOpen) {
          closeDropdown();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [isOpen, closeDropdown]);

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
    };

    const avatarUrl =
      user?.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        getInitials(user)
      )}&background=4F46E5&color=ffffff&size=40`;

    return (
      <div className={`relative ${className}`}>
        {" "}
        <motion.button
          onClick={toggleDropdown}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-neutral-800/50 transition-all duration-200 border border-transparent hover:border-neutral-700"
        >
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-7 h-7 rounded-lg border border-neutral-600"
          />
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block"
          >
            <FaChevronDown className="w-3 h-3 text-gray-400" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full right-0 mt-2 w-80 bg-neutral-800/95 backdrop-blur-md border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {/* Profile Header */}
              <div className="p-4 border-b border-neutral-700/50">
                <Link
                  to="/dashboard/profile"
                  onClick={closeDropdown}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-12 h-12 rounded-xl border border-neutral-600"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {getDisplayName(user)}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {profileMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.03,
                        duration: 0.15,
                      }}
                    >
                      <Link
                        to={item.href}
                        onClick={closeDropdown}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-700/60 transition-all duration-150 group"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Icon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                            {item.label}
                          </div>
                          <div className="text-gray-400 text-xs mt-1 group-hover:text-gray-300 transition-colors">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Logout Section */}
              <div className="p-2 border-t border-neutral-700/50">
                <button
                  onClick={() => {
                    onLogout();
                    closeDropdown();
                  }}
                  disabled={isLoggingOut}
                  className={`w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 hover:from-red-500/20 hover:to-red-600/20 hover:border-red-500/30 text-white transition-all duration-200 group ${
                    isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoggingOut ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin text-red-400" />
                      <span className="text-sm">Logging out...</span>
                    </>
                  ) : (
                    <>
                      <FaSignOutAlt className="w-4 h-4 text-red-400" />
                      <span className="text-sm group-hover:text-red-300">
                        Logout
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

ProfileAvatar.displayName = "ProfileAvatar";

export default ProfileAvatar;
