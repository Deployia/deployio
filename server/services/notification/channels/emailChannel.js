const emailService = require("../../external/emailService");
const logger = require("../../../config/logger");
const NotificationTemplates = require("../templates/notificationTemplates");
const { projectDashboardUrl } = require("../notificationUrls");

/**
 * Flatten nested notification context (project/deployment objects) for email templates.
 * @param {Object} variables - Mutable template variables object
 * @param {Object} context - Notification context
 * @param {Object} action - Notification action
 */
function flattenNotificationContext(variables, context = {}, action = null) {
  const project = context.project;
  const deployment = context.deployment;

  if (project) {
    const projectName =
      typeof project === "string"
        ? project
        : project.name || project.projectName;
    if (projectName) variables.projectName = projectName;

    const projectId = project._id || project.id;
    if (projectId) {
      variables.projectId = String(projectId);
      variables.dashboardUrl = projectDashboardUrl(projectId);
    }
  }

  if (deployment) {
    variables.environment =
      variables.environment ||
      deployment.environmentName ||
      deployment.environment;

    variables.deploymentUrl =
      variables.deploymentUrl ||
      deployment.url ||
      deployment.fullUrl;

    variables.duration = variables.duration || deployment.duration;

    const deploymentId = deployment._id || deployment.id;
    if (deploymentId) {
      variables.deploymentId = String(deploymentId);
    }

    if (deployment.logsUrl) {
      variables.logsUrl = deployment.logsUrl;
    }
  }

  if (context.error && !variables.reason) {
    variables.reason = context.error;
  }

  if (action?.url) {
    variables.actionUrl = action.url;
    if (!variables.deploymentUrl && action.type === "button") {
      variables.deploymentUrl = action.url;
    }
  }

  if (variables.projectId && !variables.logsUrl) {
    variables.logsUrl = `${projectDashboardUrl(variables.projectId)}/deployments`;
  }

  variables.userName = variables.userName || variables.username;
}

class EmailChannel {
  constructor() {
    this.channelName = "email";
    this.templates = new NotificationTemplates();
  }

  /**
   * Send notification via email
   * @param {Object} notification - Notification document
   * @returns {Promise<Object>} Send result
   */
  async send(notification) {
    try {
      if (!notification.user || !notification.user.email) {
        throw new Error("User email not available");
      }
      const templateName = this.getTemplateName(notification.type);
      const templateVariables = this.prepareTemplateVariables(notification);
      const subject = this.getEmailSubject(
        notification.type,
        notification.title,
        notification.context
      );

      const rendered = this.templates.render(templateName, templateVariables);
      
      // Send email using rendered content
      const result = await emailService.sendEmail({
        to: notification.user.email,
        subject: rendered.subject || subject,
        html: rendered.html,
        text: rendered.text,
      });

      logger.info("Email notification sent successfully", {
        notificationId: notification._id,
        userId: notification.user._id,
        email: notification.user.email,
        type: notification.type,
        template: templateName,
        messageId: result.messageId,
      });

      return {
        messageId: result.messageId,
        response: result.response,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error("Failed to send email notification", {
        notificationId: notification._id,
        userId: notification.user?._id,
        email: notification.user?.email,
        type: notification.type,
        error: error.message,
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Map notification type to template name
   * @param {string} type - Notification type
   * @returns {string} Template name
   */
  getTemplateName(type) {
    const templateMap = {
      // Auth templates
      "auth.otp_verification": "auth.otp_verification",
      "auth.password_reset": "auth.password_reset",
      "auth.welcome": "auth.welcome",
      "auth.account_security": "auth.account_security",
      "auth.login_attempt": "auth.login_attempt",

      // Deployment templates (fix: use dot notation keys)
      "deployment.started": "deployment.started",
      "deployment.success": "deployment.success",
      "deployment.failed": "deployment.failed",
      "deployment.stopped": "deployment.stopped",

      // Project templates (fix: use dot notation keys)
      "project.created": "auth.welcome",
      "project.analysis_complete": "project.analysis_complete",
      "project.analysis_failed": "project.analysis_failed",
      "project.collaborator_added": "project.collaborator_added",

      // Security templates (fix: use dot notation keys)
      "security.login_new_device": "security.login_new_device",
      "security.password_changed": "security.password_changed",
      "security.2fa_enabled": "security.2fa_enabled",
      "security.2fa_disabled": "security.2fa_disabled",
      "security.api_key_created": "security.api_key_created",

      // System templates (fix: use dot notation keys)
      "system.maintenance": "system.maintenance",
      "system.update": "system.update",
      "system.quota_warning": "system.quota_warning",
      "system.quota_exceeded": "system.quota_exceeded",
      "system.test": "generic-notification",

      // General templates (fix: use dot notation keys)
      "general.welcome": "general.welcome",
      "general.announcement": "general.announcement",
    };

    return templateMap[type] || "generic-notification";
  }

  /**
   * Prepare template variables for email rendering
   * @param {Object} notification - Notification document
   * @returns {Object} Template variables
   */
  prepareTemplateVariables(notification) {
    const { type, title, message, context, user, action } = notification;

    // Base template variables that work with our notification template system
    const baseVariables = {
      // User information
      username: user.username || user.email.split("@")[0],
      userEmail: user.email,

      // Notification content
      title: title,
      message: message,

      // Action data
      action: action || null,

      // System URLs
      appUrl: process.env.FRONTEND_URL || "https://deployio.tech",
      dashboardUrl: `${
        process.env.FRONTEND_URL || "https://deployio.tech"
      }/dashboard`,
      docsUrl: `${
        process.env.FRONTEND_URL || "https://deployio.tech"
      }/resources/docs`,
      supportEmail: process.env.SUPPORT_EMAIL || "support@deployio.tech",
      unsubscribeUrl: `${
        process.env.FRONTEND_URL || "https://deployio.tech"
      }/dashboard/profile?tab=notifications`,
      securityUrl: `${
        process.env.FRONTEND_URL || "https://deployio.tech"
      }/dashboard/profile?tab=security`,

      // Timestamps
      timestamp:
        notification.createdAt?.toISOString() || new Date().toISOString(),
    };

    // Spread context data at the root level (fix: ensure all context fields are accessible)
    if (context) {
      // If context has a data property, spread both the data and the context itself
      if (context.data && typeof context.data === "object") {
        Object.assign(baseVariables, context.data);
      }
      // Also spread the context directly to catch properties like resetLink, otp, etc.
      Object.assign(baseVariables, context);
    }

    // Flatten nested project/deployment context for deployment & project emails
    flattenNotificationContext(baseVariables, context, action);

    // Add template-specific variable mappings for backward compatibility
    this.addTemplateSpecificVariables(baseVariables, type, notification);

    return baseVariables;
  }

  /**
   * Add template-specific variables for better template compatibility
   * @param {Object} variables - Base variables object to modify
   * @param {string} type - Notification type
   * @param {Object} notification - Full notification object
   */
  addTemplateSpecificVariables(variables, type, notification) {
    const { action, context } = notification;

    // Add common action-based variables
    if (action && action.url) {
      variables.actionUrl = action.url;
      variables.actionLabel = action.label;
    }

    // Type-specific variable mappings
    switch (type) {
      case "auth.password_reset":
        // Ensure resetLink is available for password reset templates
        if (context && context.resetLink) {
          variables.resetLink = context.resetLink;
        } else if (action && action.url) {
          variables.resetLink = action.url;
        }
        if (context && context.expiresIn) {
          variables.expiresIn = context.expiresIn;
        }
        break;

      case "auth.otp_verification":
        // Ensure OTP variables are available
        if (context && context.otp) {
          variables.otp = context.otp;
        }
        if (context && context.expiresIn) {
          variables.expiresIn = context.expiresIn;
        }
        break;

      case "deployment.started":
      case "deployment.success":
      case "deployment.failed":
      case "deployment.stopped":
        flattenNotificationContext(variables, context, action);
        break;

      default:
        // For other types, ensure all context properties are available
        break;
    }
  }

  /**
   * Get email subject based on notification type and context
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {Object} context - Notification context
   * @returns {string} Email subject
   */
  getEmailSubject(type, title, context = {}) {
    const flat = {};
    flattenNotificationContext(flat, context);
    const projectLabel = flat.projectName || "Project";

    // The subject will be handled by our notification template system
    // This is a fallback in case the template doesn't provide a subject
    const subjectMap = {
      "auth.otp_verification": context.isResend
        ? "Your DeployIO OTP (Resend)"
        : "Verify your DeployIO account",
      "auth.password_reset": "Reset your DeployIO password",
      "auth.welcome": "Welcome to DeployIO!",
      "auth.account_security": `Security Alert: ${
        context.securityAction || "Account Activity"
      }`,
      "auth.login_attempt": "New login to your DeployIO account",
      "deployment.started": `Deployment Started - ${projectLabel}`,
      "deployment.success": `Deployment Successful - ${projectLabel}`,
      "deployment.failed": `Deployment Failed - ${projectLabel}`,
      "deployment.stopped": `Deployment Stopped - ${projectLabel}`,
      "system.test": "DeployIO System Test",
      "general.welcome": "Welcome to DeployIO!",
    };

    return subjectMap[type] || title || "DeployIO Notification";
  }
}

module.exports = EmailChannel;
