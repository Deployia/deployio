import { motion } from "framer-motion";

// Modern skeleton components for profile sections
const LoadingState = ({ message = "Loading...", className = "" }) => {
  return (
    <div
      className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 ${className}`}
    >
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
        <p className="text-gray-400 text-center">{message}</p>
      </div>
    </div>
  );
};

// Profile Card Skeleton
const ProfileCardSkeleton = ({ className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 ${className}`}
  >
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-neutral-700/50 rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-neutral-700/50 rounded w-1/3"></div>
          <div className="h-4 bg-neutral-700/50 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-700/50 rounded w-full"></div>
        <div className="h-4 bg-neutral-700/50 rounded w-3/4"></div>
      </div>
    </div>
  </motion.div>
);

// Form Section Skeleton
const FormSectionSkeleton = ({ rows = 3, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 ${className}`}
  >
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 bg-neutral-700/50 rounded w-1/4"></div>
        <div className="h-4 bg-neutral-700/50 rounded w-1/2"></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-neutral-700/50 rounded w-1/3"></div>
          <div className="h-10 bg-neutral-700/50 rounded w-full"></div>
        </div>
      ))}
    </div>
  </motion.div>
);

// List Item Skeleton
const ListItemSkeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg ${className}`}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-neutral-700/50 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-neutral-700/50 rounded w-3/4"></div>
        <div className="h-3 bg-neutral-700/50 rounded w-1/2"></div>
      </div>
      <div className="w-6 h-6 bg-neutral-700/50 rounded"></div>
    </div>
  </div>
);

// Activity List Skeleton
const ActivityListSkeleton = ({ items = 5, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 ${className}`}
  >
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-neutral-700/50 rounded w-1/4 mb-6"></div>
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  </motion.div>
);

// Stats Grid Skeleton
const StatsGridSkeleton = ({ columns = 3, className = "" }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-${columns} gap-6 ${className}`}
  >
    {Array.from({ length: columns }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-700/50 rounded-lg"></div>
            <div className="h-4 bg-neutral-700/50 rounded w-1/2"></div>
          </div>
          <div className="h-8 bg-neutral-700/50 rounded w-2/3"></div>
          <div className="h-3 bg-neutral-700/50 rounded w-3/4"></div>
        </div>
      </motion.div>
    ))}
  </div>
);

// Notification Preferences Skeleton
const NotificationPreferencesSkeleton = ({
  categories = 3,
  className = "",
}) => (
  <div className={`space-y-8 ${className}`}>
    {Array.from({ length: categories }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        <div className="animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-6 bg-neutral-700/50 rounded w-1/3"></div>
            <div className="h-4 bg-neutral-700/50 rounded w-2/3"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="flex items-center justify-between p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-700/50 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-700/50 rounded w-32"></div>
                    <div className="h-3 bg-neutral-700/50 rounded w-48"></div>
                  </div>
                </div>
                <div className="w-12 h-6 bg-neutral-700/50 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

export default LoadingState;
export {
  ProfileCardSkeleton,
  FormSectionSkeleton,
  ListItemSkeleton,
  ActivityListSkeleton,
  StatsGridSkeleton,
  NotificationPreferencesSkeleton,
};
