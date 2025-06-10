import { FaDesktop, FaMobile, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { deleteSession } from "@redux/slices/authSlice";
import activityLogger from "@/utils/activityLogger";

const SessionsTab = ({ sessions = [], loading = false, onRefresh }) => {
  const dispatch = useDispatch();
  const { currentSessionId } = useSelector((state) => state.auth);

  // Remove the data fetching useEffect since data comes from props
  const terminateSession = async (sessionId) => {
    try {
      await dispatch(deleteSession(sessionId)).unwrap();
      toast.success("Session terminated successfully");

      // Log activity and wait for completion
      await activityLogger.sessionTerminated(sessionId);

      // Refresh data through parent component
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error(error || "Failed to terminate session");
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (userAgent?.toLowerCase().includes("mobile")) {
      return <FaMobile className="text-gray-400" />;
    }
    return <FaDesktop className="text-gray-400" />;
  };

  const formatDeviceName = (userAgent) => {
    if (!userAgent) return "Unknown Device";

    if (userAgent.includes("Chrome")) return "Chrome Browser";
    if (userAgent.includes("Firefox")) return "Firefox Browser";
    if (userAgent.includes("Safari")) return "Safari Browser";
    if (userAgent.includes("Edge")) return "Edge Browser";
    if (userAgent.includes("Mobile")) return "Mobile App";

    return "Unknown Browser";
  };

  const formatLastActive = (createdAt) => {
    const now = new Date();
    const sessionDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - sessionDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Active now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-blue-400 text-2xl mr-3" />
          <span className="text-gray-400">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8">
      <h3 className="text-xl font-semibold text-white mb-6">Active Sessions</h3>
      <p className="text-gray-400 mb-6">
        Manage your active sessions across different devices and locations.
      </p>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <FaDesktop className="text-gray-500 text-4xl mx-auto mb-4" />
          <p className="text-gray-400">No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isCurrentSession = session._id === currentSessionId;

            return (
              <div
                key={session._id}
                className="flex items-center justify-between p-4 border border-neutral-700/50 rounded-lg bg-neutral-800/50 hover:border-neutral-600/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-700/50 rounded-lg">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">
                        {formatDeviceName(session.userAgent)}
                      </h4>
                      {isCurrentSession && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {session.ip || "Unknown location"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatLastActive(session.createdAt)}
                    </p>
                  </div>
                </div>
                {!isCurrentSession && (
                  <button
                    onClick={() => terminateSession(session._id)}
                    className="px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Terminate
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionsTab;
