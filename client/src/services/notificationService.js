import api from "@utils/api";
import notificationWS from "./notificationWebSocket";

/**
 * Notification Service
 * Handles notification creation, management, and real-time delivery
 */
class NotificationService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    if (this.initialized) return;

    // Request browser notification permission
    await this.requestPermissions();

    // Connect to WebSocket for real-time notifications
    notificationWS.connect();

    this.initialized = true;
  }

  /**
   * Request browser notification permissions
   */
  async requestPermissions() {
    try {
      const granted =
        await notificationWS.constructor.requestNotificationPermission();
      if (granted) {
        console.log("✅ Browser notification permission granted");
      } else {
        console.log("❌ Browser notification permission denied");
      }
      return granted;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }

  /**
   * Send notification to user (backend integration)
   */
  async sendNotification(notificationData) {
    try {
      const response = await api.post(
        "/external/notifications",
        notificationData
      );
      return response.data.notification;
    } catch (error) {
      console.error("Failed to send notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for current user's actions
   */
  async notifyUser(type, data) {
    const notificationMap = {
      // Security notifications
      api_key_created: {
        title: "🔑 API Key Created",
        message: `Your ${data.keyName || "new API key"} is ready to use`,
        type: "security.api_key_created",
        priority: "normal",
        action: {
          label: "View API Keys",
          url: "/dashboard/profile?tab=security",
        },
      },

      api_key_regenerated: {
        title: "🔄 API Key Regenerated",
        message: `Your ${data.keyName || "API key"} has been regenerated`,
        type: "security.api_key_regenerated",
        priority: "high",
        action: {
          label: "View API Keys",
          url: "/dashboard/profile?tab=security",
        },
      },

      password_changed: {
        title: "🔒 Password Changed",
        message: "Your account password has been successfully updated",
        type: "security.password_changed",
        priority: "high",
      },

      "2fa_enabled": {
        title: "🛡️ Two-Factor Authentication Enabled",
        message: "Your account security has been enhanced with 2FA",
        type: "security.2fa_enabled",
        priority: "normal",
      },

      login_new_device: {
        title: "🔐 New Device Login",
        message: `Login from ${data.device || "new device"} detected`,
        type: "security.login_new_device",
        priority: "high",
        action: {
          label: "Review Sessions",
          url: "/dashboard/profile?tab=security",
        },
      },

      // Deployment notifications
      deployment_success: {
        title: "🚀 Deployment Successful",
        message: `${data.projectName || "Project"} deployed successfully`,
        type: "deployment.success",
        priority: "normal",
        action: {
          label: "View Deployment",
          url: `/dashboard/deployments/${data.deploymentId}`,
        },
      },

      deployment_failed: {
        title: "❌ Deployment Failed",
        message: `${data.projectName || "Project"} deployment failed`,
        type: "deployment.failed",
        priority: "high",
        action: {
          label: "View Logs",
          url: `/dashboard/deployments/${data.deploymentId}`,
        },
      },

      // System notifications
      maintenance_scheduled: {
        title: "🔧 Maintenance Scheduled",
        message: `System maintenance on ${data.date || "upcoming date"}`,
        type: "system.maintenance",
        priority: "normal",
      },

      feature_announcement: {
        title: "✨ New Feature Available",
        message: data.message || "Check out our latest features",
        type: "system.feature",
        priority: "low",
      },
    };

    const notification = notificationMap[type];
    if (!notification) {
      console.warn(`Unknown notification type: ${type}`);
      return;
    }

    // Merge with provided data
    const finalNotification = {
      ...notification,
      ...data,
      createdAt: new Date().toISOString(),
    };

    try {
      await this.sendNotification(finalNotification);
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
    }
  }

  /**
   * Show immediate in-app notification (for actions that don't need persistence)
   */
  showInAppNotification(title, message, type = "info", duration = 5000) {
    // This creates a temporary notification that doesn't persist
    // Useful for immediate feedback without cluttering notification center

    const notification = {
      id: `temp_${Date.now()}`,
      title,
      message,
      type: `in_app.${type}`,
      priority: "low",
      createdAt: new Date().toISOString(),
      temporary: true,
    };

    // Could integrate with a toast system or temporary notification display
    console.log("In-app notification:", notification);

    // For now, we'll use browser notification as fallback
    if ("Notification" in window && Notification.permission === "granted") {
      const browserNotif = new Notification(title, {
        body: message,
        icon: "/favicon.png",
        tag: notification.id,
      });

      setTimeout(() => {
        browserNotif.close();
      }, duration);
    }

    return notification;
  }

  /**
   * Disconnect from real-time notifications
   */
  disconnect() {
    notificationWS.disconnect();
    this.initialized = false;
  }

  /**
   * Get connection status
   */
  isConnected() {
    return notificationWS.isConnected();
  }

  /**
   * Convenience methods for common notifications
   */

  // Security events
  async apiKeyCreated(keyName) {
    return this.notifyUser("api_key_created", { keyName });
  }

  async apiKeyRegenerated(keyName) {
    return this.notifyUser("api_key_regenerated", { keyName });
  }

  async passwordChanged() {
    return this.notifyUser("password_changed");
  }

  async twoFactorEnabled() {
    return this.notifyUser("2fa_enabled");
  }

  async newDeviceLogin(device) {
    return this.notifyUser("login_new_device", { device });
  }

  // Deployment events
  async deploymentSuccess(projectName, deploymentId) {
    return this.notifyUser("deployment_success", { projectName, deploymentId });
  }

  async deploymentFailed(projectName, deploymentId) {
    return this.notifyUser("deployment_failed", { projectName, deploymentId });
  }

  // System events
  async maintenanceScheduled(date) {
    return this.notifyUser("maintenance_scheduled", { date });
  }

  async featureAnnouncement(message) {
    return this.notifyUser("feature_announcement", { message });
  }
}

// Export singleton instance
const notificationService = new NotificationService();

export default notificationService;
