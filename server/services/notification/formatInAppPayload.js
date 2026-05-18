const NO_TOAST_TYPES = new Set([
  "connection_confirmation",
]);

const NO_TOAST_SOURCES = new Set(["connection_confirmation"]);

/**
 * @param {Object} notification - Notification document or plain object
 * @returns {Object} Payload for WebSocket / SSE / client toast
 */
function formatInAppPayload(notification) {
  const id = notification._id || notification.id;
  const type = notification.type;
  const priority = notification.priority || "normal";
  const context = notification.context || {};

  const skipToast =
    NO_TOAST_TYPES.has(type) ||
    context.isWelcome === true ||
    NO_TOAST_SOURCES.has(context.source);

  return {
    _id: id,
    id,
    type,
    title: notification.title,
    message: notification.message,
    priority,
    status: notification.status,
    context,
    action: notification.action,
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt,
    ui: {
      icon: getNotificationIcon(type),
      color: getNotificationColor(type, priority),
      sound: shouldPlaySound(type, priority),
      persist: shouldPersist(type, priority),
      showToast: skipToast ? false : shouldShowToast(type, priority),
    },
  };
}

function getNotificationIcon(type) {
  const iconMap = {
    "deployment.started": "rocket",
    "deployment.success": "check-circle",
    "deployment.failed": "x-circle",
    "deployment.stopped": "stop-circle",
    "project.created": "folder-plus",
    "project.analysis_complete": "file-check",
    "project.analysis_failed": "file-x",
    "project.collaborator_added": "user-plus",
    "security.login_new_device": "shield-alert",
    "security.password_changed": "key",
    "security.2fa_enabled": "shield-check",
    "security.2fa_disabled": "shield-x",
    "security.api_key_created": "code",
    "system.maintenance": "tool",
    "system.update": "download",
    "system.quota_warning": "alert-triangle",
    "system.quota_exceeded": "alert-circle",
    "general.welcome": "heart",
    "general.announcement": "megaphone",
    "auth.welcome": "heart",
    "auth.verification_success": "check-circle",
  };
  return iconMap[type] || "bell";
}

function getNotificationColor(type, priority) {
  if (priority === "urgent") return "red";
  if (priority === "high") return "orange";
  if (priority === "low") return "gray";

  const colorMap = {
    "deployment.success": "green",
    "deployment.failed": "red",
    "deployment.started": "blue",
    "deployment.stopped": "yellow",
    "project.created": "green",
    "project.analysis_complete": "green",
    "project.analysis_failed": "red",
    "project.collaborator_added": "blue",
    "security.login_new_device": "red",
    "security.password_changed": "green",
    "security.2fa_enabled": "green",
    "security.2fa_disabled": "red",
    "security.api_key_created": "blue",
    "system.maintenance": "yellow",
    "system.update": "blue",
    "system.quota_warning": "yellow",
    "system.quota_exceeded": "red",
    "general.welcome": "green",
    "general.announcement": "blue",
    "auth.welcome": "green",
    "auth.verification_success": "green",
  };

  return colorMap[type] || "blue";
}

function shouldPlaySound(type, priority) {
  if (priority === "urgent" || priority === "high") return true;
  return [
    "deployment.failed",
    "security.login_new_device",
    "system.quota_exceeded",
  ].includes(type);
}

function shouldPersist(type, priority) {
  if (priority === "urgent") return true;
  return [
    "security.login_new_device",
    "security.password_changed",
    "system.quota_exceeded",
  ].includes(type);
}

function shouldShowToast(type, priority) {
  if (priority === "low" && type.startsWith("general.")) return false;
  return true;
}

module.exports = {
  formatInAppPayload,
  getNotificationIcon,
  getNotificationColor,
  shouldPlaySound,
  shouldPersist,
  shouldShowToast,
};
