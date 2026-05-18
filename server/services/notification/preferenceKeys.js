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
  "auth.welcome": "welcomeMessage",
  "auth.verification_success": "welcomeMessage",
};

/** Blocked when notificationPreferences.securityAlerts === false */
const SECURITY_ALERT_TYPES = new Set([
  "security.login_new_device",
  "security.password_changed",
  "security.2fa_enabled",
  "security.2fa_disabled",
  "security.api_key_created",
  "security.account_locked",
  "auth.account_security",
]);

/** Blocked when notificationPreferences.accountChanges === false */
const ACCOUNT_CHANGE_TYPES = new Set(["general.announcement"]);

/** Uses productUpdates pref when type is system.update */
const PRODUCT_UPDATE_TYPES = new Set(["system.update"]);

const QUIET_HOURS_BYPASS_TYPES = new Set([
  "deployment.failed",
  "security.login_new_device",
  "security.password_changed",
  "system.quota_exceeded",
]);

/** Always sent via email; bypasses user preference toggles */
const MUST_DELIVER_EMAIL_TYPES = new Set([
  "auth.otp_verification",
  "auth.password_reset",
]);

/** Never emailed; in-app only when preferences allow */
const IN_APP_ONLY_TYPES = new Set(["auth.verification_success"]);

module.exports = {
  BOOLEAN_NOTIFICATION_PREFERENCE_KEYS,
  NESTED_NOTIFICATION_PREFERENCE_KEYS,
  NOTIFICATION_TYPE_PREFERENCE_MAP,
  QUIET_HOURS_BYPASS_TYPES,
  SECURITY_ALERT_TYPES,
  ACCOUNT_CHANGE_TYPES,
  PRODUCT_UPDATE_TYPES,
  MUST_DELIVER_EMAIL_TYPES,
  IN_APP_ONLY_TYPES,
};
