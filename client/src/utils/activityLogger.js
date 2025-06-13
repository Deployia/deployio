import { store } from "@redux/store";
import { logUserActivity } from "@redux/slices/userSlice";

/**
 * Activity Logger Utility
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
   * Log a user activity
   * @param {string} action - The action performed
   * @param {string} type - The type of activity (auth, security, profile, system)
   * @param {string|object} details - Additional details about the activity
   * @returns {Promise} - The dispatch promise
   */
  log(action, type = "system", details = null) {
    try {
      const activityData = {
        action,
        type,
        details:
          typeof details === "string" ? details : JSON.stringify(details),
        timestamp: new Date().toISOString(),
      };

      // Dispatch to Redux store and return the promise
      return store.dispatch(logUserActivity(activityData));
    } catch (error) {
      console.warn("Failed to log activity:", error);
      return Promise.reject(error);
    }
  }
  // Convenience methods for different activity types
  auth(action, details = null) {
    return this.log(action, "auth", details);
  }

  security(action, details = null) {
    return this.log(action, "security", details);
  }

  profile(action, details = null) {
    return this.log(action, "profile", details);
  }

  system(action, details = null) {
    return this.log(action, "system", details);
  }

  // Common activity shortcuts
  login(method = "email") {
    return this.auth("User logged in", { method });
  }

  logout() {
    return this.auth("User logged out");
  }

  profileUpdate(fields = []) {
    return this.profile("Profile updated", { updatedFields: fields });
  }

  passwordChange() {
    return this.security("Password changed");
  }

  enable2FA() {
    return this.security("Two-factor authentication enabled");
  }

  disable2FA() {
    return this.security("Two-factor authentication disabled");
  }

  sessionTerminated(sessionId) {
    return this.security("Session terminated", { sessionId });
  }

  notificationSettingsChanged(changes = {}) {
    return this.profile("Notification settings updated", changes);
  }
  apiKeyGenerated(keyName = null) {
    const details = keyName ? { keyName } : { keyName: "New API Key" };
    return this.security("API key generated", details);
  }

  apiKeyRevoked(keyId, keyName = null) {
    return this.security("API key revoked", {
      keyId,
      keyName: keyName || "Unknown Key",
    });
  }

  deploymentCreated(deploymentId, projectId) {
    return this.system("Deployment created", { deploymentId, projectId });
  }

  projectCreated(projectId, projectName) {
    return this.system("Project created", { projectId, projectName });
  }

  projectDeleted(projectId, projectName) {
    return this.system("Project deleted", { projectId, projectName });
  }
}

// Export singleton instance
const activityLogger = ActivityLogger.getInstance();

export default activityLogger;
