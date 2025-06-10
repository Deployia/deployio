import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaShieldAlt,
  FaUser,
  FaLock,
  FaCog,
  FaSignInAlt,
  FaFilter,
} from "react-icons/fa";
import { clearActivitiesError } from "@redux/slices/userSlice";
import toast from "react-hot-toast";

const ActivityTab = ({ activities = [], loading = false }) => {
  const dispatch = useDispatch();
  const { activitiesError } = useSelector((state) => state.user);

  const [filter, setFilter] = useState("all");

  // Remove the data fetching useEffect since data comes from props

  useEffect(() => {
    if (activitiesError) {
      toast.error(activitiesError);
      dispatch(clearActivitiesError());
    }
  }, [activitiesError, dispatch]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "auth":
        return <FaSignInAlt className="w-5 h-5" />;
      case "security":
        return <FaShieldAlt className="w-5 h-5" />;
      case "profile":
        return <FaUser className="w-5 h-5" />;
      case "system":
        return <FaCog className="w-5 h-5" />;
      default:
        return <FaLock className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "auth":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "security":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "profile":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "system":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  // Filter activities based on selected filter
  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((activity) => activity.type === filter);

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Account Activity
          </h3>
          <p className="text-gray-400">
            View your recent account activity and security events.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FaFilter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filter:</span>
        </div>
        <div className="flex gap-2">
          {[
            { value: "all", label: "All" },
            { value: "auth", label: "Authentication" },
            { value: "security", label: "Security" },
            { value: "profile", label: "Profile" },
            { value: "system", label: "System" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && filteredActivities.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      )}

      {/* Activities List */}
      {!loading && filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <FaLock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No activity found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
            <div
              key={`${activity.timestamp}-${index}`}
              className="flex items-start gap-4 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 transition-colors"
            >
              <div
                className={`p-3 rounded-full border ${getActivityColor(
                  activity.type
                )}`}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white mb-1">
                  {activity.action}
                </h4>
                {activity.details && (
                  <p className="text-sm text-gray-400 mb-2">
                    {activity.details}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                  {activity.ip && <span>IP: {activity.ip}</span>}
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs rounded-full border ${getActivityColor(
                  activity.type
                )}`}
              >
                {activity.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Activity Info */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Showing {filteredActivities.length} of {activities.length} activities
      </div>
    </div>
  );
};

export default ActivityTab;
