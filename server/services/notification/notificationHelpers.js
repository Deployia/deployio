const notificationService = require("./notificationService");
const logger = require("../../config/logger");

/**
 * Notification Helper Functions
 * These functions provide easy-to-use interfaces for creating common notifications
 */

class NotificationHelpers {
  /**
   * Send deployment started notification
   * @param {string} userId - User ID
   * @param {Object} deploymentData - Deployment information
   */
  static async deploymentStarted(userId, deploymentData) {
    try {
      const { projectName, environment, deploymentId, projectId } =
        deploymentData;

      return await notificationService.createNotification({
        userId,
        type: "deployment.started",
        title: `Deployment Started`,
        message: `Your deployment for ${projectName} has started successfully.`,
        priority: "normal",
        context: {
          project: { name: projectName, _id: projectId },
          deployment: {
            _id: deploymentId,
            environmentName: environment,
            url: deploymentData.url,
          },
        },
        action: deploymentData.url
          ? {
              label: "View Deployment",
              url: deploymentData.url,
              type: "button",
            }
          : null,
      });
    } catch (error) {
      logger.error("Failed to send deployment started notification", {
        userId,
        deploymentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send deployment success notification
   * @param {string} userId - User ID
   * @param {Object} deploymentData - Deployment information
   */
  static async deploymentSuccess(userId, deploymentData) {
    try {
      const { projectName, environment, deploymentId, projectId, duration } =
        deploymentData;

      return await notificationService.createNotification({
        userId,
        type: "deployment.success",
        title: `Deployment Successful!`,
        message: `Your deployment for ${projectName} has completed successfully.`,
        priority: "normal",
        context: {
          project: { name: projectName, _id: projectId },
          deployment: {
            _id: deploymentId,
            environmentName: environment,
            url: deploymentData.url,
            duration,
          },
        },
        action: deploymentData.url
          ? {
              label: "View Live Application",
              url: deploymentData.url,
              type: "button",
            }
          : null,
      });
    } catch (error) {
      logger.error("Failed to send deployment success notification", {
        userId,
        deploymentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send deployment failed notification
   * @param {string} userId - User ID
   * @param {Object} deploymentData - Deployment information
   */
  static async deploymentFailed(userId, deploymentData) {
    try {
      const {
        projectName,
        environment,
        deploymentId,
        projectId,
        error: deploymentError,
      } = deploymentData;

      return await notificationService.createNotification({
        userId,
        type: "deployment.failed",
        title: `Deployment Failed`,
        message: `Your deployment for ${projectName} has failed. Please check the logs for details.`,
        priority: "high",
        context: {
          project: { name: projectName, _id: projectId },
          deployment: {
            _id: deploymentId,
            environmentName: environment,
            logsUrl: deploymentData.logsUrl,
          },
          error: deploymentError,
        },
        action: deploymentData.logsUrl
          ? {
              label: "View Logs",
              url: deploymentData.logsUrl,
              type: "button",
            }
          : null,
      });
    } catch (error) {
      logger.error("Failed to send deployment failed notification", {
        userId,
        deploymentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send deployment stopped notification
   * @param {string} userId - User ID
   * @param {Object} deploymentData - Deployment information
   */
  static async deploymentStopped(userId, deploymentData) {
    try {
      const { projectName, environment, deploymentId, projectId, reason } =
        deploymentData;

      return await notificationService.createNotification({
        userId,
        type: "deployment.stopped",
        title: `Deployment Stopped`,
        message: `Your deployment for ${projectName} has been stopped.`,
        priority: "normal",
        context: {
          project: { name: projectName, _id: projectId },
          deployment: {
            _id: deploymentId,
            environmentName: environment,
          },
          reason: reason || "Manual stop",
        },
        action: {
          label: "Go to Project",
          url: `${process.env.FRONTEND_URL}/projects/${projectName}`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send deployment stopped notification", {
        userId,
        deploymentData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send project analysis complete notification
   * @param {string} userId - User ID
   * @param {Object} projectData - Project information
   */
  static async projectAnalysisComplete(userId, projectData) {
    try {
      const { projectName, projectId, analysisResults } = projectData;

      return await notificationService.createNotification({
        userId,
        type: "project.analysis_complete",
        title: `Project Analysis Complete`,
        message: `Analysis for ${projectName} has completed successfully.`,
        priority: "normal",
        context: {
          project: { name: projectName, _id: projectId },
          analysis: analysisResults,
        },
        action: {
          label: "View Results",
          url: `${process.env.FRONTEND_URL}/projects/${projectName}/analysis`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send project analysis complete notification", {
        userId,
        projectData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send project analysis failed notification
   * @param {string} userId - User ID
   * @param {Object} projectData - Project information
   */
  static async projectAnalysisFailed(userId, projectData) {
    try {
      const { projectName, projectId, error: analysisError } = projectData;

      return await notificationService.createNotification({
        userId,
        type: "project.analysis_failed",
        title: `Project Analysis Failed`,
        message: `Analysis for ${projectName} has failed. Please check the configuration and try again.`,
        priority: "normal",
        context: {
          project: { name: projectName, _id: projectId },
          error: analysisError,
        },
        action: {
          label: "Go to Project",
          url: `${process.env.FRONTEND_URL}/projects/${projectName}`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send project analysis failed notification", {
        userId,
        projectData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send collaborator added notification
   * @param {string} userId - User ID who will receive the notification
   * @param {Object} collaboratorData - Collaborator information
   */
  static async projectCollaboratorAdded(userId, collaboratorData) {
    try {
      const {
        projectName,
        projectId,
        collaboratorName,
        collaboratorEmail,
        role,
      } = collaboratorData;

      return await notificationService.createNotification({
        userId,
        type: "project.collaborator_added",
        title: `New Collaborator Added`,
        message: `${collaboratorName} has been added as a ${role} to ${projectName}.`,
        priority: "normal",
        context: {
          project: { name: projectName, _id: projectId },
          collaborator: { name: collaboratorName, email: collaboratorEmail },
          role,
        },
        action: {
          label: "View Project",
          url: `${process.env.FRONTEND_URL}/projects/${projectName}`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send collaborator added notification", {
        userId,
        collaboratorData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send new device login notification
   * @param {string} userId - User ID
   * @param {Object} loginData - Login information
   */
  static async securityNewDeviceLogin(userId, loginData) {
    try {
      const { deviceInfo, location, ipAddress, loginTime } = loginData;

      return await notificationService.createNotification({
        userId,
        type: "security.login_new_device",
        title: `New Device Login Detected`,
        message: `We detected a login from a new device. If this wasn't you, please secure your account.`,
        priority: "high",
        context: {
          device: deviceInfo,
          location,
          ipAddress,
          loginTime: loginTime || new Date(),
        },
        action: {
          label: "Review Security Settings",
          url: `${process.env.FRONTEND_URL}/settings/security`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send new device login notification", {
        userId,
        loginData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send password changed notification
   * @param {string} userId - User ID
   */
  static async securityPasswordChanged(userId) {
    try {
      return await notificationService.createNotification({
        userId,
        type: "security.password_changed",
        title: `Password Changed Successfully`,
        message: `Your password has been changed successfully. If you didn't make this change, please contact support.`,
        priority: "normal",
        context: {
          changeTime: new Date(),
        },
        action: {
          label: "Security Settings",
          url: `${process.env.FRONTEND_URL}/settings/security`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send password changed notification", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send 2FA enabled notification
   * @param {string} userId - User ID
   */
  static async security2FAEnabled(userId) {
    try {
      return await notificationService.createNotification({
        userId,
        type: "security.2fa_enabled",
        title: `Two-Factor Authentication Enabled`,
        message: `Two-factor authentication has been enabled for your account. Your account is now more secure.`,
        priority: "normal",
        context: {
          changeTime: new Date(),
        },
      });
    } catch (error) {
      logger.error("Failed to send 2FA enabled notification", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send 2FA disabled notification
   * @param {string} userId - User ID
   */
  static async security2FADisabled(userId) {
    try {
      return await notificationService.createNotification({
        userId,
        type: "security.2fa_disabled",
        title: `Two-Factor Authentication Disabled`,
        message: `Two-factor authentication has been disabled for your account. Consider re-enabling it for better security.`,
        priority: "normal",
        context: {
          changeTime: new Date(),
        },
        action: {
          label: "Security Settings",
          url: `${process.env.FRONTEND_URL}/settings/security`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send 2FA disabled notification", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send API key created notification
   * @param {string} userId - User ID
   * @param {Object} keyData - API key information
   */
  static async securityApiKeyCreated(userId, keyData) {
    try {
      const { keyName, lastFourChars } = keyData;

      return await notificationService.createNotification({
        userId,
        type: "security.api_key_created",
        title: `New API Key Created`,
        message: `A new API key "${keyName}" has been created for your account.`,
        priority: "normal",
        context: {
          keyName,
          lastFourChars,
          createdTime: new Date(),
        },
        action: {
          label: "Manage API Keys",
          url: `${process.env.FRONTEND_URL}/settings/api-keys`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send API key created notification", {
        userId,
        keyData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send quota warning notification
   * @param {string} userId - User ID
   * @param {Object} quotaData - Quota information
   */
  static async systemQuotaWarning(userId, quotaData) {
    try {
      const { quotaType, currentUsage, quotaLimit, usagePercentage } =
        quotaData;

      return await notificationService.createNotification({
        userId,
        type: "system.quota_warning",
        title: `Usage Quota Warning`,
        message: `You have used ${usagePercentage}% of your ${quotaType} quota. Consider upgrading your plan.`,
        priority: "normal",
        context: {
          quotaType,
          currentUsage,
          quotaLimit,
          usagePercentage,
        },
        action: {
          label: "Upgrade Plan",
          url: `${process.env.FRONTEND_URL}/billing`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send quota warning notification", {
        userId,
        quotaData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send quota exceeded notification
   * @param {string} userId - User ID
   * @param {Object} quotaData - Quota information
   */
  static async systemQuotaExceeded(userId, quotaData) {
    try {
      const { quotaType, currentUsage, quotaLimit } = quotaData;

      return await notificationService.createNotification({
        userId,
        type: "system.quota_exceeded",
        title: `Usage Quota Exceeded`,
        message: `You have exceeded your ${quotaType} quota. Some features may be limited until you upgrade.`,
        priority: "high",
        context: {
          quotaType,
          currentUsage,
          quotaLimit,
          usagePercentage: Math.round((currentUsage / quotaLimit) * 100),
        },
        action: {
          label: "Upgrade Now",
          url: `${process.env.FRONTEND_URL}/billing`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send quota exceeded notification", {
        userId,
        quotaData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send welcome notification to new users
   * @param {string} userId - User ID
   * @param {Object} userData - User information
   */
  static async generalWelcome(userId, userData = {}) {
    try {
      const { username } = userData;

      return await notificationService.createNotification({
        userId,
        type: "general.welcome",
        title: `Welcome to DeployIO!`,
        message: `Welcome ${
          username || ""
        }! We're excited to have you on board. Get started by creating your first project.`,
        priority: "normal",
        action: {
          label: "Getting Started",
          url: `${process.env.FRONTEND_URL}/getting-started`,
          type: "button",
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    } catch (error) {
      logger.error("Failed to send welcome notification", {
        userId,
        userData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send system maintenance notification to all users
   * @param {Object} maintenanceData - Maintenance information
   */
  static async systemMaintenance(maintenanceData) {
    try {
      const { startTime, endTime, duration, affectedServices } =
        maintenanceData;

      return await notificationService.createSystemNotification({
        type: "system.maintenance",
        title: `Scheduled Maintenance Notice`,
        message: `We have scheduled maintenance that may affect service availability.`,
        priority: "normal",
        context: {
          startTime,
          endTime,
          duration,
          services: affectedServices || [],
        },
        action: {
          label: "Status Page",
          url: `${process.env.FRONTEND_URL}/status`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send system maintenance notification", {
        maintenanceData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send system announcement to all users
   * @param {Object} announcementData - Announcement information
   */
  static async generalAnnouncement(announcementData) {
    try {
      const { title, content, ctaUrl, ctaText } = announcementData;

      return await notificationService.createSystemNotification({
        type: "general.announcement",
        title: title || "DeployIO Announcement",
        message: content || "We have an important announcement for you.",
        priority: "normal",
        context: {
          content,
          ctaUrl,
          ctaText,
          date: new Date(),
        },
        action: ctaUrl
          ? {
              label: ctaText || "Learn More",
              url: ctaUrl,
              type: "button",
            }
          : null,
      });
    } catch (error) {
      logger.error("Failed to send system announcement", {
        announcementData,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send bulk notifications efficiently
   * @param {Array} notifications - Array of notification objects
   */
  static async sendBulkNotifications(notifications) {
    try {
      const results = [];

      for (const notif of notifications) {
        try {
          const result = await notificationService.createNotification(notif);
          results.push({ success: true, notification: result });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            notification: notif,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error("Failed to send bulk notifications", {
        count: notifications.length,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = NotificationHelpers;
