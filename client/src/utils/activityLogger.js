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

      // Dispatch to Redux store
      store.dispatch(logUserActivity(activityData));
    } catch (error) {
      console.warn("Failed to log activity:", error);
    }
  }

  // Convenience methods for different activity types
  auth(action, details = null) {
    this.log(action, "auth", details);
  }

  security(action, details = null) {
    this.log(action, "security", details);
  }

  profile(action, details = null) {
    this.log(action, "profile", details);
  }

  system(action, details = null) {
    this.log(action, "system", details);
  }

  // Common activity shortcuts
  login(method = "email") {
    this.auth("User logged in", { method });
  }

  logout() {
    this.auth("User logged out");
  }

  profileUpdate(fields = []) {
    this.profile("Profile updated", { updatedFields: fields });
  }

  passwordChange() {
    this.security("Password changed");
  }

  enable2FA() {
    this.security("Two-factor authentication enabled");
  }

  disable2FA() {
    this.security("Two-factor authentication disabled");
  }

  sessionTerminated(sessionId) {
    this.security("Session terminated", { sessionId });
  }

  notificationSettingsChanged(changes = {}) {
    this.profile("Notification settings updated", changes);
  }

  apiKeyGenerated() {
    this.security("API key generated");
  }

  apiKeyRevoked(keyId) {
    this.security("API key revoked", { keyId });
  }

  deploymentCreated(deploymentId, projectId) {
    this.system("Deployment created", { deploymentId, projectId });
  }
  projectCreated(projectId, projectName) {
    this.system("Project created", { projectId, projectName });
  }

  projectDeleted(projectId, projectName) {
    this.system("Project deleted", { projectId, projectName });
  }
}

// Export singleton instance
const activityLogger = ActivityLogger.getInstance();

export default activityLogger;
