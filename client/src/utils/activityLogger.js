import api from "@utils/api";

/**
 * Activity Logger Utility - Updated to use AuditLog system
 * Provides easy integration for automatic activity logging throughout the application
 */
class ActivityLogger {
  static getInstance() {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  /**
   * Log a user activity using the AuditLog system
   * @param {string} action - The action performed (e.g., "user.login", "security.api_key_created")
   * @param {object} details - Additional details about the activity
   * @param {string} type - Legacy type field for backward compatibility
   * @returns {Promise} - The API call promise
   */
  async log(action, details = {}, type = "system") {
    try {
      const activityData = {
        action,
        details: typeof details === "object" ? details : { note: details },
        type, // For backward compatibility with existing controller
        ip: this.getClientIP(),
      };

      // Use the correct AuditLog endpoint
      const response = await api.post("/users/activity", activityData);
      return response.data.activity;
    } catch (error) {
      console.warn("Failed to log activity:", error);
      throw error;
    }
  }

  /**
   * Get client IP (best effort from available sources)
   */
  getClientIP() {
    // In browser environment, we can't directly get IP
    // The server will use req.ip as fallback
    return undefined;
  }

  // Convenience methods for different activity types with proper action naming
  auth(action, details = {}) {
    return this.log(`user.${action}`, details, "auth");
  }

  security(action, details = {}) {
    return this.log(`security.${action}`, details, "security");
  }

  profile(action, details = {}) {
    return this.log(`profile.${action}`, details, "profile");
  }

  system(action, details = {}) {
    return this.log(`system.${action}`, details, "system");
  }

  // Updated common activity shortcuts to use proper action naming
  login(method = "email") {
    return this.auth("login", { method });
  }

  logout() {
    return this.auth("logout");
  }

  profileUpdate(fields = []) {
    return this.profile("updated", { updatedFields: fields });
  }

  passwordChange() {
    return this.security("password_changed");
  }

  enable2FA() {
    return this.security("2fa_enabled");
  }

  disable2FA() {
    return this.security("2fa_disabled");
  }

  sessionTerminated(sessionId) {
    return this.security("session_terminated", { sessionId });
  }

  notificationSettingsChanged(changes = {}) {
    return this.profile("notification_settings_changed", changes);
  }

  apiKeyGenerated(keyName = "New API Key") {
    return this.security("api_key_created", { keyName });
  }

  apiKeyRevoked(keyId, keyName = "Unknown Key") {
    return this.security("api_key_revoked", { keyId, keyName });
  }

  deploymentCreated(deploymentId, projectId) {
    return this.system("deployment_created", { deploymentId, projectId });
  }
  projectCreated(projectId, projectName) {
    return this.system("project_created", { projectId, projectName });
  }

  projectDeleted(projectId, projectName) {
    return this.system("project_deleted", { projectId, projectName });
  }
}

// Export singleton instance
const activityLogger = ActivityLogger.getInstance();

export default activityLogger;
