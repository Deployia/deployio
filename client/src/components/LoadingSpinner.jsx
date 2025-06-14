import React from "react";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

const LoadingSpinner = ({
  size = "default",
  color = "blue",
  fullPage = false,
  message = "Loading...",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorClasses = {
    blue: "text-blue-400",
    white: "text-white",
    gray: "text-gray-400",
    green: "text-green-400",
    red: "text-red-400",
  };

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <FaSpinner
            className={`${sizeClasses.xl} ${colorClasses[color]} animate-spin mx-auto mb-4`}
          />
          <p className="text-gray-400 text-lg">{message}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <FaSpinner
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin mr-2`}
      />
      {message && <span className="text-gray-300">{message}</span>}
    </div>
  );
};

// Card loading skeleton
const LoadingCard = ({ className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 ${className}`}
  >
    <div className="animate-pulse">
      <div className="h-4 bg-neutral-700/50 rounded w-3/4 mb-2"></div>
      <div className="h-8 bg-neutral-700/50 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-neutral-700/50 rounded w-2/3"></div>
    </div>
  </motion.div>
);

// Grid loading skeleton
const LoadingGrid = ({ columns = 4, rows = 1 }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}
  >
    {Array.from({ length: columns * rows }).map((_, i) => (
      <LoadingCard key={i} />
    ))}
  </div>
);

// Chart loading skeleton
const LoadingChart = ({ height = "h-64", className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 ${className}`}
  >
    <div className="animate-pulse">
      <div className="h-6 bg-neutral-700/50 rounded w-1/4 mb-4"></div>
      <div className={`${height} bg-neutral-700/50 rounded`}></div>
    </div>
  </motion.div>
);

export default LoadingSpinner;
export { LoadingCard, LoadingGrid, LoadingChart };
