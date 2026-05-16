/**
 * Notification preference keys stored on User.notificationPreferences.
 * Keep in sync with User model and NotificationsPreferences UI.
 */
const BOOLEAN_NOTIFICATION_PREFERENCE_KEYS = [
  "email",
  "inApp",
  "push",
  "deploymentSuccess",
  "deploymentFailure",
  "deploymentStarted",
  "deploymentStopped",
  "projectCreated",
  "projectAnalysisComplete",
  "projectAnalysisFailed",
  "projectCollaboratorAdded",
  "securityAlerts",
  "accountChanges",
  "newDeviceLogin",
  "passwordChanged",
  "twoFactorEnabled",
  "twoFactorDisabled",
  "apiKeyCreated",
  "systemMaintenance",
  "systemUpdates",
  "quotaWarning",
  "quotaExceeded",
  "welcomeMessage",
  "announcements",
  "productUpdates",
  "tips",
  // Legacy keys (backward compatibility)
  "deployments",
  "security",
  "marketing",
  "updates",
];

const NESTED_NOTIFICATION_PREFERENCE_KEYS = ["quietHours", "digestSettings"];

/** Maps notification.type → User.notificationPreferences field */
const NOTIFICATION_TYPE_PREFERENCE_MAP = {
  "deployment.started": "deploymentStarted",
  "deployment.success": "deploymentSuccess",
  "deployment.failed": "deploymentFailure",
  "deployment.stopped": "deploymentStopped",
  "project.created": "projectCreated",
  "project.analysis_complete": "projectAnalysisComplete",
  "project.analysis_failed": "projectAnalysisFailed",
  "project.collaborator_added": "projectCollaboratorAdded",
  "security.login_new_device": "newDeviceLogin",
  "security.password_changed": "passwordChanged",
  "security.2fa_enabled": "twoFactorEnabled",
  "security.2fa_disabled": "twoFactorDisabled",
  "security.api_key_created": "apiKeyCreated",
  "system.maintenance": "systemMaintenance",
  "system.update": "systemUpdates",
  "system.quota_warning": "quotaWarning",
  "system.quota_exceeded": "quotaExceeded",
  "general.welcome": "welcomeMessage",
  "general.announcement": "announcements",
};

const QUIET_HOURS_BYPASS_TYPES = new Set([
  "deployment.failed",
  "security.login_new_device",
  "security.password_changed",
  "system.quota_exceeded",
]);

module.exports = {
  BOOLEAN_NOTIFICATION_PREFERENCE_KEYS,
  NESTED_NOTIFICATION_PREFERENCE_KEYS,
  NOTIFICATION_TYPE_PREFERENCE_MAP,
  QUIET_HOURS_BYPASS_TYPES,
};
