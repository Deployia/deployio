const { sendEmail } = require("../../external/emailService");
const logger = require("../../../config/logger");

class EmailChannel {
  constructor() {
    this.channelName = "email";
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

      // Get email template and content
      const emailContent = await this.prepareEmailContent(notification);

      // Send email using existing emailService
      const result = await sendEmail({
        to: notification.user.email,
        subject: emailContent.subject,
        template: emailContent.template,
        variables: emailContent.variables,
        html: emailContent.html,
        text: emailContent.text,
      });

      logger.info("Email notification sent successfully", {
        notificationId: notification._id,
        userId: notification.user._id,
        email: notification.user.email,
        type: notification.type,
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
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Prepare email content based on notification type
   * @param {Object} notification - Notification document
   * @returns {Promise<Object>} Email content
   */
  async prepareEmailContent(notification) {
    const { type, title, message, context, user, action } = notification;

    // Base email content
    const baseContent = {
      subject: this.getEmailSubject(type, title, context),
      variables: {
        userName: user.username || user.email.split("@")[0],
        userEmail: user.email,
        notificationTitle: title,
        notificationMessage: message,
        notificationType: type,
        context: context || {},
        action: action || null,
        timestamp: notification.createdAt,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`,
        appUrl: process.env.FRONTEND_URL || "https://deployio.com",
        supportEmail: process.env.SUPPORT_EMAIL || "support@deployio.com",
      },
    };

    // Get type-specific content
    switch (type) {
      case "deployment.started":
        return this.getDeploymentStartedContent(baseContent, context);

      case "deployment.success":
        return this.getDeploymentSuccessContent(baseContent, context);

      case "deployment.failed":
        return this.getDeploymentFailedContent(baseContent, context);

      case "deployment.stopped":
        return this.getDeploymentStoppedContent(baseContent, context);

      case "project.analysis_complete":
        return this.getProjectAnalysisCompleteContent(baseContent, context);

      case "project.analysis_failed":
        return this.getProjectAnalysisFailedContent(baseContent, context);

      case "project.collaborator_added":
        return this.getProjectCollaboratorContent(baseContent, context);

      case "security.login_new_device":
        return this.getSecurityLoginContent(baseContent, context);

      case "security.password_changed":
        return this.getPasswordChangedContent(baseContent, context);

      case "security.2fa_enabled":
      case "security.2fa_disabled":
        return this.getTwoFactorContent(baseContent, context, type);

      case "security.api_key_created":
        return this.getApiKeyCreatedContent(baseContent, context);

      case "system.maintenance":
        return this.getMaintenanceContent(baseContent, context);

      case "system.update":
        return this.getSystemUpdateContent(baseContent, context);

      case "system.quota_warning":
      case "system.quota_exceeded":
        return this.getQuotaContent(baseContent, context, type);

      case "general.welcome":
        return this.getWelcomeContent(baseContent, context);

      case "general.announcement":
        return this.getAnnouncementContent(baseContent, context);

      default:
        return this.getGenericContent(baseContent);
    }
  }

  /**
   * Get email subject based on notification type
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {Object} context - Notification context
   * @returns {string} Email subject
   */
  getEmailSubject(type, title, context) {
    const subjectMap = {
      "deployment.started": `Deployment Started - ${
        context.project?.name || "Project"
      }`,
      "deployment.success": `✅ Deployment Successful - ${
        context.project?.name || "Project"
      }`,
      "deployment.failed": `❌ Deployment Failed - ${
        context.project?.name || "Project"
      }`,
      "deployment.stopped": `⏹️ Deployment Stopped - ${
        context.project?.name || "Project"
      }`,
      "project.analysis_complete": `✅ Project Analysis Complete - ${
        context.project?.name || "Project"
      }`,
      "project.analysis_failed": `❌ Project Analysis Failed - ${
        context.project?.name || "Project"
      }`,
      "project.collaborator_added": `👥 New Collaborator Added - ${
        context.project?.name || "Project"
      }`,
      "security.login_new_device": "🔐 New Device Login Detected",
      "security.password_changed": "🔑 Password Changed Successfully",
      "security.2fa_enabled": "🔐 Two-Factor Authentication Enabled",
      "security.2fa_disabled": "⚠️ Two-Factor Authentication Disabled",
      "security.api_key_created": "🔑 New API Key Created",
      "system.maintenance": "🔧 Scheduled Maintenance Notice",
      "system.update": "🚀 System Update Available",
      "system.quota_warning": "⚠️ Usage Quota Warning",
      "system.quota_exceeded": "🚨 Usage Quota Exceeded",
      "general.welcome": "🎉 Welcome to DeployIO!",
      "general.announcement": "📢 DeployIO Announcement",
    };

    return subjectMap[type] || title;
  }

  // Type-specific content methods
  getDeploymentStartedContent(baseContent, context) {
    return {
      ...baseContent,
      template: "deployment-started",
      variables: {
        ...baseContent.variables,
        projectName: context.project?.name || "Unknown Project",
        environment: context.deployment?.environmentName || "Unknown",
        deploymentUrl: context.deployment?.url || null,
      },
    };
  }

  getDeploymentSuccessContent(baseContent, context) {
    return {
      ...baseContent,
      template: "deployment-success",
      variables: {
        ...baseContent.variables,
        projectName: context.project?.name || "Unknown Project",
        environment: context.deployment?.environmentName || "Unknown",
        deploymentUrl: context.deployment?.url || null,
        duration: context.deployment?.duration || null,
      },
    };
  }

  getDeploymentFailedContent(baseContent, context) {
    return {
      ...baseContent,
      template: "deployment-failed",
      variables: {
        ...baseContent.variables,
        projectName: context.project?.name || "Unknown Project",
        environment: context.deployment?.environmentName || "Unknown",
        errorMessage: context.error || "Unknown error occurred",
        logsUrl: context.deployment?.logsUrl || null,
      },
    };
  }

  getDeploymentStoppedContent(baseContent, context) {
    return {
      ...baseContent,
      template: "deployment-stopped",
      variables: {
        ...baseContent.variables,
        projectName: context.project?.name || "Unknown Project",
        environment: context.deployment?.environmentName || "Unknown",
        reason: context.reason || "Manual stop",
      },
    };
  }

  getProjectAnalysisCompleteContent(baseContent, context) {
    return {
      ...baseContent,
      template: "project-analysis-complete",
      variables: {
        ...baseContent.variables,
        projectName: context.project?.name || "Unknown Project",
        analysisResults: context.analysis || {},
        projectUrl: context.project?.url || null,
      },
    };
  }

  getProjectAnalysisFailedContent(baseContent, context) {
    return {
      ...baseContent,
      template: "project-analysis-failed",
      variables: {
        ...baseContent.variables,
        projectName: context.project?.name || "Unknown Project",
        errorMessage: context.error || "Analysis failed",
        projectUrl: context.project?.url || null,
      },
    };
  }

  getProjectCollaboratorContent(baseContent, context) {
    return {
      ...baseContent,
      template: "project-collaborator-added",
      variables: {
        ...baseContent.variables,
        projectName: context.project?.name || "Unknown Project",
        collaboratorName: context.collaborator?.name || "Unknown User",
        collaboratorEmail: context.collaborator?.email || null,
        role: context.role || "collaborator",
        projectUrl: context.project?.url || null,
      },
    };
  }

  getSecurityLoginContent(baseContent, context) {
    return {
      ...baseContent,
      template: "security-new-device-login",
      variables: {
        ...baseContent.variables,
        loginTime: context.loginTime || new Date(),
        deviceInfo: context.device || "Unknown device",
        location: context.location || "Unknown location",
        ipAddress: context.ipAddress || "Unknown IP",
        securityUrl: `${process.env.FRONTEND_URL}/settings/security`,
      },
    };
  }

  getPasswordChangedContent(baseContent, context) {
    return {
      ...baseContent,
      template: "security-password-changed",
      variables: {
        ...baseContent.variables,
        changeTime: context.changeTime || new Date(),
        securityUrl: `${process.env.FRONTEND_URL}/settings/security`,
      },
    };
  }

  getTwoFactorContent(baseContent, context, type) {
    const isEnabled = type === "security.2fa_enabled";
    return {
      ...baseContent,
      template: isEnabled ? "security-2fa-enabled" : "security-2fa-disabled",
      variables: {
        ...baseContent.variables,
        changeTime: context.changeTime || new Date(),
        securityUrl: `${process.env.FRONTEND_URL}/settings/security`,
        isEnabled,
      },
    };
  }

  getApiKeyCreatedContent(baseContent, context) {
    return {
      ...baseContent,
      template: "security-api-key-created",
      variables: {
        ...baseContent.variables,
        keyName: context.keyName || "API Key",
        createdTime: context.createdTime || new Date(),
        lastFourChars: context.lastFourChars || "****",
        apiKeysUrl: `${process.env.FRONTEND_URL}/settings/api-keys`,
      },
    };
  }

  getMaintenanceContent(baseContent, context) {
    return {
      ...baseContent,
      template: "system-maintenance",
      variables: {
        ...baseContent.variables,
        maintenanceStart: context.startTime || new Date(),
        maintenanceEnd: context.endTime || null,
        duration: context.duration || "Unknown duration",
        affectedServices: context.services || [],
        statusUrl: `${process.env.FRONTEND_URL}/status`,
      },
    };
  }

  getSystemUpdateContent(baseContent, context) {
    return {
      ...baseContent,
      template: "system-update",
      variables: {
        ...baseContent.variables,
        updateVersion: context.version || "Latest",
        features: context.features || [],
        releaseNotesUrl: context.releaseNotesUrl || null,
        updateTime: context.updateTime || null,
      },
    };
  }

  getQuotaContent(baseContent, context, type) {
    const isExceeded = type === "system.quota_exceeded";
    return {
      ...baseContent,
      template: isExceeded ? "system-quota-exceeded" : "system-quota-warning",
      variables: {
        ...baseContent.variables,
        quotaType: context.quotaType || "Usage",
        currentUsage: context.currentUsage || 0,
        quotaLimit: context.quotaLimit || 100,
        usagePercentage: context.usagePercentage || 0,
        billingUrl: `${process.env.FRONTEND_URL}/billing`,
        isExceeded,
      },
    };
  }

  getWelcomeContent(baseContent, context) {
    return {
      ...baseContent,
      template: "general-welcome",
      variables: {
        ...baseContent.variables,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        gettingStartedUrl: `${process.env.FRONTEND_URL}/getting-started`,
        docsUrl: `${process.env.FRONTEND_URL}/docs`,
      },
    };
  }

  getAnnouncementContent(baseContent, context) {
    return {
      ...baseContent,
      template: "general-announcement",
      variables: {
        ...baseContent.variables,
        announcementContent: context.content || "",
        ctaUrl: context.ctaUrl || null,
        ctaText: context.ctaText || null,
        announcementDate: context.date || new Date(),
      },
    };
  }

  getGenericContent(baseContent) {
    return {
      ...baseContent,
      template: "generic-notification",
      html: this.generateGenericHTML(baseContent.variables),
      text: this.generateGenericText(baseContent.variables),
    };
  }

  /**
   * Generate generic HTML email content
   * @param {Object} variables - Template variables
   * @returns {string} HTML content
   */
  generateGenericHTML(variables) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${variables.notificationTitle}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>DeployIO</h1>
            </div>
            <div class="content">
                <h2>${variables.notificationTitle}</h2>
                <p>Hi ${variables.userName},</p>
                <p>${variables.notificationMessage}</p>
                ${
                  variables.action
                    ? `<p><a href="${variables.action.url}" class="button">${variables.action.label}</a></p>`
                    : ""
                }
                <p>Best regards,<br>The DeployIO Team</p>
            </div>
            <div class="footer">
                <p>You received this email because you have notifications enabled.</p>
                <p><a href="${
                  variables.unsubscribeUrl
                }">Manage notification preferences</a></p>
                <p>© 2024 DeployIO. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate generic text email content
   * @param {Object} variables - Template variables
   * @returns {string} Text content
   */
  generateGenericText(variables) {
    return `
DeployIO Notification

${variables.notificationTitle}

Hi ${variables.userName},

${variables.notificationMessage}

${variables.action ? `${variables.action.label}: ${variables.action.url}` : ""}

Best regards,
The DeployIO Team

---
You received this email because you have notifications enabled.
Manage notification preferences: ${variables.unsubscribeUrl}
© 2024 DeployIO. All rights reserved.
    `.trim();
  }
}

module.exports = EmailChannel;
