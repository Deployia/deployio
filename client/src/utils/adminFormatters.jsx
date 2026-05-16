export const formatUserName = (user) => {
  if (!user) return "Unknown";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.username || user.email || "Unknown";
};

export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

export const statusBadgeClass = (status) => {
  const map = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    running: "bg-green-500/20 text-green-400 border-green-500/30",
    archived: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    hold: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    reserved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    stopped: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    building: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    deploying: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return map[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusBadgeClass(status)}`}
  >
    {status}
  </span>
);
