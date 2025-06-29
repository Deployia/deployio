/**
 * User Access Control
 * Validates user permissions for agent data access
 * Manages room-based access control for agent streams
 */

const logger = require("@config/logger");

class UserAccessControl {
  constructor() {
    this.isInitialized = false;
    this.userPermissions = new Map(); // userId -> permissions
    this.roomAccess = new Map(); // roomId -> allowed users
    this.accessStats = {
      permissionChecks: 0,
      accessGranted: 0,
      accessDenied: 0,
    };
  }

  /**
   * Initialize user access control
   */
  async initialize() {
    try {
      logger.info("Initializing User Access Control...");

      // Load default permissions
      await this._loadDefaultPermissions();

      this.isInitialized = true;

      logger.info("✅ User Access Control initialized");

      return true;
    } catch (error) {
      logger.error("Failed to initialize User Access Control", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check if user has permission to access specific data
   */
  async checkAccess(userId, resource, action) {
    try {
      this.accessStats.permissionChecks++;

      if (!userId) {
        this.accessStats.accessDenied++;
        return false;
      }

      // Get user permissions
      const permissions = await this._getUserPermissions(userId);
      if (!permissions) {
        this.accessStats.accessDenied++;
        return false;
      }

      // Check admin access (admins can access everything)
      if (permissions.role === "admin") {
        this.accessStats.accessGranted++;
        return true;
      }

      // Check specific resource access
      const hasAccess = await this._checkResourceAccess(
        userId,
        permissions,
        resource,
        action
      );

      if (hasAccess) {
        this.accessStats.accessGranted++;
      } else {
        this.accessStats.accessDenied++;
      }

      return hasAccess;
    } catch (error) {
      logger.error("Error checking user access", {
        error: error.message,
        userId,
        resource,
        action,
      });
      this.accessStats.accessDenied++;
      return false;
    }
  }

  /**
   * Validate room access for user
   */
  async validateRoomAccess(userId, roomName, agentData = {}) {
    try {
      if (!userId || !roomName) {
        return false;
      }

      // Admin rooms require admin access
      if (roomName.includes("admin-")) {
        return await this._isUserAdmin(userId);
      }

      // User-specific rooms
      if (roomName.includes("user-")) {
        const roomUserIdMatch = roomName.match(/user-(\d+)-/);
        if (roomUserIdMatch) {
          const roomUserId = roomUserIdMatch[1];

          // User can access their own rooms
          if (String(userId) === roomUserId) {
            return true;
          }

          // Admins can access any user room
          return await this._isUserAdmin(userId);
        }
      }

      // Container-specific access
      if (agentData.container_id) {
        return await this._checkContainerAccess(userId, agentData.container_id);
      }

      // Project-specific access
      if (agentData.project_id) {
        return await this._checkProjectAccess(userId, agentData.project_id);
      }

      // Default deny for unknown room patterns
      return false;
    } catch (error) {
      logger.error("Error validating room access", {
        error: error.message,
        userId,
        roomName,
      });
      return false;
    }
  }

  /**
   * Get allowed rooms for user
   */
  async getAllowedRooms(userId) {
    try {
      const permissions = await this._getUserPermissions(userId);
      if (!permissions) {
        return [];
      }

      const allowedRooms = [];

      // Admin users get admin rooms
      if (permissions.role === "admin") {
        allowedRooms.push(
          "admin-logs",
          "admin-metrics",
          "admin-system-logs",
          "admin-system-metrics"
        );
      }

      // User-specific rooms
      allowedRooms.push(
        `user-${userId}-logs`,
        `user-${userId}-metrics`,
        `user-${userId}-builds`,
        `user-${userId}-deployments`,
        `user-${userId}-notifications`
      );

      // Project-specific rooms (if user has project access)
      const userProjects = await this._getUserProjects(userId);
      for (const projectId of userProjects) {
        allowedRooms.push(`project-${projectId}-logs`);
      }

      return allowedRooms;
    } catch (error) {
      logger.error("Error getting allowed rooms", {
        error: error.message,
        userId,
      });
      return [];
    }
  }

  /**
   * Load default permissions
   */
  async _loadDefaultPermissions() {
    try {
      // Default admin permissions
      const defaultAdminPermissions = {
        role: "admin",
        permissions: [
          "read:all-logs",
          "read:all-metrics",
          "read:system-logs",
          "write:admin-commands",
        ],
        rooms: ["admin-*", "user-*"],
      };

      // Default user permissions
      const defaultUserPermissions = {
        role: "user",
        permissions: [
          "read:own-logs",
          "read:own-metrics",
          "read:own-containers",
        ],
        rooms: ["user-{userId}-*"],
      };

      // Store default permissions (will be overridden by database in production)
      this.userPermissions.set("default-admin", defaultAdminPermissions);
      this.userPermissions.set("default-user", defaultUserPermissions);

      logger.info("✅ Default permissions loaded");
    } catch (error) {
      logger.error("Error loading default permissions", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user permissions (from cache or database)
   */
  async _getUserPermissions(userId) {
    try {
      // Check cache first
      if (this.userPermissions.has(userId)) {
        return this.userPermissions.get(userId);
      }

      // In production, load from database
      // For development, use default permissions based on userId pattern
      let permissions;

      if (this._isAdminUserId(userId)) {
        permissions = this.userPermissions.get("default-admin");
      } else {
        permissions = this.userPermissions.get("default-user");
      }

      // Cache permissions
      if (permissions) {
        this.userPermissions.set(userId, { ...permissions, userId });
      }

      return permissions;
    } catch (error) {
      logger.error("Error getting user permissions", {
        error: error.message,
        userId,
      });
      return null;
    }
  }

  /**
   * Check specific resource access
   */
  async _checkResourceAccess(userId, permissions, resource, action) {
    try {
      const permission = `${action}:${resource}`;

      // Check direct permission
      if (permissions.permissions.includes(permission)) {
        return true;
      }

      // Check wildcard permissions
      const wildcardPermission = `${action}:all-${resource.split("-")[0]}`;
      if (permissions.permissions.includes(wildcardPermission)) {
        return true;
      }

      // Check user-specific resources
      if (resource.includes("own-") || resource.includes(`user-${userId}`)) {
        const ownPermission = permission.replace(
          resource,
          `own-${resource.split("-").slice(-1)[0]}`
        );
        return permissions.permissions.includes(ownPermission);
      }

      return false;
    } catch (error) {
      logger.error("Error checking resource access", {
        error: error.message,
        userId,
        resource,
        action,
      });
      return false;
    }
  }

  /**
   * Check if user is admin
   */
  async _isUserAdmin(userId) {
    try {
      const permissions = await this._getUserPermissions(userId);
      return permissions && permissions.role === "admin";
    } catch (error) {
      logger.error("Error checking admin status", {
        error: error.message,
        userId,
      });
      return false;
    }
  }

  /**
   * Check if userId indicates admin (for development)
   */
  _isAdminUserId(userId) {
    // Simple pattern for development - in production use database
    return (
      userId === "1" ||
      String(userId).includes("admin") ||
      String(userId).endsWith("1")
    ); // First user is often admin
  }

  /**
   * Check container access for user
   */
  async _checkContainerAccess(userId, containerId) {
    try {
      // In production, check database for container ownership
      // For development, assume users can access containers they created

      // Admin can access all containers
      if (await this._isUserAdmin(userId)) {
        return true;
      }

      // For now, return true for own containers (implement proper logic in production)
      return true;
    } catch (error) {
      logger.error("Error checking container access", {
        error: error.message,
        userId,
        containerId,
      });
      return false;
    }
  }

  /**
   * Check project access for user
   */
  async _checkProjectAccess(userId, projectId) {
    try {
      // In production, check database for project membership
      // For development, assume users can access their projects

      // Admin can access all projects
      if (await this._isUserAdmin(userId)) {
        return true;
      }

      // For now, return true (implement proper logic in production)
      return true;
    } catch (error) {
      logger.error("Error checking project access", {
        error: error.message,
        userId,
        projectId,
      });
      return false;
    }
  }

  /**
   * Get user's projects
   */
  async _getUserProjects(userId) {
    try {
      // In production, fetch from database
      // For development, return empty array
      return [];
    } catch (error) {
      logger.error("Error getting user projects", {
        error: error.message,
        userId,
      });
      return [];
    }
  }

  /**
   * Get access control status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      cachedPermissions: this.userPermissions.size,
      roomAccess: this.roomAccess.size,
      stats: this.accessStats,
    };
  }

  /**
   * Get access statistics
   */
  getStats() {
    return {
      ...this.accessStats,
      accessRate:
        this.accessStats.permissionChecks > 0
          ? (
              (this.accessStats.accessGranted /
                this.accessStats.permissionChecks) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };
  }

  /**
   * Cleanup access control
   */
  async cleanup() {
    logger.info("Cleaning up User Access Control...");

    this.userPermissions.clear();
    this.roomAccess.clear();
    this.accessStats = {
      permissionChecks: 0,
      accessGranted: 0,
      accessDenied: 0,
    };
    this.isInitialized = false;

    logger.info("✅ User Access Control cleanup completed");
  }
}

module.exports = UserAccessControl;
