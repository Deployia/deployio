import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaSignInAlt,
  FaUserPlus,
  FaCode,
  FaBrain,
  FaArrowLeft,
  FaTimes,
} from "react-icons/fa";

/**
 * AuthGuard - A reusable component that shows an overlay for unauthenticated users
 * Can be used across different pages with customizable content and behavior
 */
const AuthGuard = ({
  children,
  title = "Authentication Required",
  subtitle = "Please sign in to continue",
  features = [],
  showBackButton = false,
  backPath = "/",
  allowClose = false,
  onClose = null,
  _context = "default", // for analytics/tracking
  icon: Icon = FaCode, // main icon component
}) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Don't show anything while loading auth state
  if (loading && loading.me) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated, render children normally
  if (isAuthenticated) {
    return children;
  }

  // Default features for playground
  const defaultFeatures = [
    { icon: FaCode, label: "Code Editor", color: "text-blue-400" },
    { icon: FaBrain, label: "AI Analysis", color: "text-purple-400" },
    { icon: FaCode, label: "Code Generation", color: "text-green-400" },
    { icon: FaBrain, label: "AI Copilot", color: "text-orange-400" },
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  // If not authenticated, show the auth overlay
  const handleLogin = () => {
    const currentPath = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    navigate(`/auth/login?next=${currentPath}`);
  };

  const handleRegister = () => {
    const currentPath = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    navigate(`/auth/register?next=${currentPath}`);
  };

  const handleBack = () => {
    navigate(backPath);
  };

  const handleCloseOverlay = () => {
    if (allowClose && onClose) {
      onClose();
    }
  };

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Background with blur */}
      <div className="absolute inset-0">
        {children}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      </div>

      {/* Auth overlay card */}
      <div className="relative z-50 flex items-center justify-center p-4 h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-neutral-900/90 backdrop-blur-lg border border-neutral-700 rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg"
        >
          {/* Header controls */}
          <div className="flex justify-between items-start mb-4">
            {showBackButton && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleBack}
                className="p-2 rounded-xl hover:bg-neutral-700/50 text-neutral-400 hover:text-white transition-all duration-200 flex items-center gap-2 text-sm"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </motion.button>
            )}

            {allowClose && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleCloseOverlay}
                className="p-2 rounded-xl hover:bg-neutral-700/50 text-neutral-400 hover:text-white transition-all duration-200 ml-auto"
              >
                <FaTimes className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Main content */}
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.5,
                type: "spring",
                stiffness: 200,
              }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
              style={{
                boxShadow:
                  "0 0 40px rgba(59, 130, 246, 0.3), 0 0 80px rgba(147, 51, 234, 0.2)",
              }}
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-xl sm:text-2xl font-bold text-white mb-2 heading"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-neutral-300 body leading-relaxed text-sm sm:text-base px-2"
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Features grid */}
          {displayFeatures.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="grid grid-cols-2 gap-3 sm:gap-4 mb-4"
            >
              {displayFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                    className="flex items-center gap-2 sm:gap-3 text-sm text-neutral-400 p-2 sm:p-3 rounded-xl bg-neutral-900/40 border border-neutral-700/30 hover:border-neutral-600/50 transition-all duration-200"
                  >
                    <Icon className={`w-4 h-4 ${feature.color}`} />
                    <span className="text-xs sm:text-sm">{feature.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Auth buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="space-y-2"
          >
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-md shadow-md transition duration-200"
            >
              <FaSignInAlt className="w-5 h-5" />
              <span>Sign In</span>
            </button>

            <button
              onClick={handleRegister}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800/30 border border-neutral-700 rounded-md text-neutral-300 hover:bg-neutral-800/50 transition duration-200"
            >
              <FaUserPlus className="w-5 h-5 text-purple-400" />
              <span>Create Account</span>
            </button>
          </motion.div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-center mt-4"
          >
            <p className="text-xs text-neutral-500">
              Join thousands of developers building with Deployio
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthGuard;
