import { motion } from "framer-motion";

export const NotificationSkeleton = () => {
  return (
    <div className="p-3 animate-pulse">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-4 h-4 bg-neutral-700 rounded mt-0.5"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 bg-neutral-700 rounded-full"></div>
              <div className="h-3 bg-neutral-700 rounded w-12"></div>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="h-3 bg-neutral-700 rounded w-full"></div>
            <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationListSkeleton = ({ count = 3 }) => {
  return (
    <div className="divide-y divide-neutral-800/30">
      {Array.from({ length: count }).map((_, index) => (
        <NotificationSkeleton key={index} />
      ))}
    </div>
  );
};
