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

// Repository card loading skeleton
const RepositoryCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-3 sm:p-4"
  >
    <div className="animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Repository name and icon */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-neutral-700/50 rounded flex-shrink-0"></div>
            <div className="h-4 bg-neutral-700/50 rounded w-32 sm:w-40"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neutral-700/50 rounded"></div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <div className="h-3 bg-neutral-700/50 rounded w-full mb-1"></div>
            <div className="h-3 bg-neutral-700/50 rounded w-3/4"></div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-neutral-700/50 rounded-full"></div>
              <div className="h-3 bg-neutral-700/50 rounded w-12"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neutral-700/50 rounded"></div>
              <div className="h-3 bg-neutral-700/50 rounded w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-neutral-700/50 rounded"></div>
              <div className="h-3 bg-neutral-700/50 rounded w-8"></div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 ml-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-700/50 rounded"></div>
          <div className="w-16 sm:w-20 h-6 sm:h-8 bg-neutral-700/50 rounded"></div>
        </div>
      </div>
    </div>
  </motion.div>
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
export { LoadingCard, LoadingGrid, LoadingChart, RepositoryCardSkeleton };
