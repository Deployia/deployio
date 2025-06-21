/**
 * Notification Service Module
 *
 * This module exports all notification-related services and utilities
 * for easy importing throughout the application.
 */

const NotificationService = require("./notificationService");
const NotificationHelpers = require("./notificationHelpers");
const NotificationQueue = require("./queue/notificationQueue");
const EmailChannel = require("./channels/emailChannel");
const InAppChannel = require("./channels/inAppChannel");
const PushChannel = require("./channels/pushChannel");
const NotificationTemplates = require("./templates/notificationTemplates");

// Export the main service instance
module.exports = NotificationService;

// Export individual components for advanced usage
module.exports.NotificationService = NotificationService;
module.exports.NotificationHelpers = NotificationHelpers;
module.exports.NotificationQueue = NotificationQueue;
module.exports.EmailChannel = EmailChannel;
module.exports.InAppChannel = InAppChannel;
module.exports.PushChannel = PushChannel;
module.exports.NotificationTemplates = NotificationTemplates;

// Export convenient helper functions
module.exports.helpers = NotificationHelpers;

// Export notification types for reference
module.exports.NOTIFICATION_TYPES = {
  // Deployment notifications
  DEPLOYMENT_STARTED: "deployment.started",
  DEPLOYMENT_SUCCESS: "deployment.success",
  DEPLOYMENT_FAILED: "deployment.failed",
  DEPLOYMENT_STOPPED: "deployment.stopped",

  // Project notifications
  PROJECT_ANALYSIS_COMPLETE: "project.analysis_complete",
  PROJECT_ANALYSIS_FAILED: "project.analysis_failed",
  PROJECT_COLLABORATOR_ADDED: "project.collaborator_added",

  // Security notifications
  SECURITY_LOGIN_NEW_DEVICE: "security.login_new_device",
  SECURITY_PASSWORD_CHANGED: "security.password_changed",
  SECURITY_2FA_ENABLED: "security.2fa_enabled",
  SECURITY_2FA_DISABLED: "security.2fa_disabled",
  SECURITY_API_KEY_CREATED: "security.api_key_created",

  // System notifications
  SYSTEM_MAINTENANCE: "system.maintenance",
  SYSTEM_UPDATE: "system.update",
  SYSTEM_QUOTA_WARNING: "system.quota_warning",
  SYSTEM_QUOTA_EXCEEDED: "system.quota_exceeded",

  // General notifications
  GENERAL_WELCOME: "general.welcome",
  GENERAL_ANNOUNCEMENT: "general.announcement",
};

// Export priority levels
module.exports.PRIORITY_LEVELS = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

// Export delivery channels
module.exports.DELIVERY_CHANNELS = {
  IN_APP: "in_app",
  EMAIL: "email",
  PUSH: "push",
};

// Export notification statuses
module.exports.NOTIFICATION_STATUS = {
  UNREAD: "unread",
  READ: "read",
  ARCHIVED: "archived",
};
