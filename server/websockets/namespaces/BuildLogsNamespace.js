const webSocketRegistry = require("../core/WebSocketRegistry");
const logger = require("../../config/logger");

/**
 * Build Logs WebSocket Namespace Template
 * Real-time build and deployment log streaming (future implementation)
 */
class BuildLogsNamespace {
  constructor() {
    this.namespace = null;
    this.activeBuildStreams = new Map();
    this.buildSubscriptions = new Map();
  }

  /**
   * Initialize the build logs namespace
   */
  static initialize() {
    const instance = new BuildLogsNamespace();

    // Register namespace with authentication required
    const namespace = webSocketRegistry.register("/build-logs", {
      requireAuth: true,
      requireAdmin: false, // Project members can view their build logs
      requireVerified: false,
    });

    // Register event handlers
    namespace
      .on("subscribe_to_build", instance.subscribeToBuild.bind(instance))
      .on(
        "unsubscribe_from_build",
        instance.unsubscribeFromBuild.bind(instance)
      )
      .on("get_build_history", instance.getBuildHistory.bind(instance))
      .on("get_active_builds", instance.getActiveBuilds.bind(instance))
      .on("cancel_build", instance.cancelBuild.bind(instance));

    // Add connection and disconnection handlers
    namespace
      .onConnection(instance.handleConnection.bind(instance))
      .onDisconnection(instance.handleDisconnection.bind(instance));

    instance.namespace = namespace;

    logger.info("Build logs namespace initialized");
    return instance;
  }

  /**
   * Handle new connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    logger.debug("User connected to build logs", {
      userId: socket.userId,
      email: socket.userEmail,
    });

    // Send active builds for user's projects
    this.sendActiveBuilds(socket);
  }

  /**
   * Handle disconnection
   * @param {Object} socket - Socket instance
   * @param {String} reason - Disconnection reason
   */
  handleDisconnection(socket, reason) {
    // Clean up subscriptions for this socket
    this.cleanupSocketSubscriptions(socket);

    logger.debug("User disconnected from build logs", {
      userId: socket.userId,
      reason,
    });
  }

  /**
   * Subscribe to build logs
   * @param {Object} socket - Socket instance
   * @param {Object} data - Build subscription data
   */
  async subscribeToBuild(socket, data) {
    try {
      const { buildId, projectId } = data;

      if (!buildId) {
        return socket.emit("error", {
          message: "Build ID is required",
          code: "MISSING_BUILD_ID",
        });
      }

      // TODO: Verify user has access to this project/build
      // const Project = require("../../models/Project");
      // const hasAccess = await Project.userHasAccess(projectId, socket.userId);
      // if (!hasAccess) {
      //   return socket.emit("error", {
      //     message: "Access denied to this build",
      //     code: "ACCESS_DENIED",
      //   });
      // }

      // Join build-specific room
      const buildRoom = `build_${buildId}`;
      socket.join(buildRoom);

      // Track subscription
      const subscriptionKey = `${socket.id}_${buildId}`;
      this.buildSubscriptions.set(subscriptionKey, {
        socketId: socket.id,
        userId: socket.userId,
        buildId,
        projectId,
        subscribedAt: new Date(),
      });

      socket.emit("build_subscribed", {
        buildId,
        projectId,
        timestamp: new Date().toISOString(),
      });

      // Send recent build logs if available
      this.sendRecentBuildLogs(socket, buildId);

      logger.debug("User subscribed to build", {
        userId: socket.userId,
        buildId,
        projectId,
      });
    } catch (error) {
      logger.error("Error subscribing to build", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to subscribe to build",
        code: "SUBSCRIBE_BUILD_ERROR",
      });
    }
  }

  /**
   * Unsubscribe from build logs
   * @param {Object} socket - Socket instance
   * @param {Object} data - Build subscription data
   */
  async unsubscribeFromBuild(socket, data) {
    try {
      const { buildId } = data;

      if (!buildId) {
        return socket.emit("error", {
          message: "Build ID is required",
          code: "MISSING_BUILD_ID",
        });
      }

      // Leave build room
      const buildRoom = `build_${buildId}`;
      socket.leave(buildRoom);

      // Remove subscription
      const subscriptionKey = `${socket.id}_${buildId}`;
      this.buildSubscriptions.delete(subscriptionKey);

      socket.emit("build_unsubscribed", {
        buildId,
        timestamp: new Date().toISOString(),
      });

      logger.debug("User unsubscribed from build", {
        userId: socket.userId,
        buildId,
      });
    } catch (error) {
      logger.error("Error unsubscribing from build", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to unsubscribe from build",
        code: "UNSUBSCRIBE_BUILD_ERROR",
      });
    }
  }

  /**
   * Get build history
   * @param {Object} socket - Socket instance
   * @param {Object} data - History request data
   */
  async getBuildHistory(socket, data) {
    try {
      const { projectId, limit = 20, offset = 0 } = data;

      if (!projectId) {
        return socket.emit("error", {
          message: "Project ID is required",
          code: "MISSING_PROJECT_ID",
        });
      }

      // TODO: Get builds from database
      // const Build = require("../../models/Build");
      // const builds = await Build.find({ projectId })
      //   .sort({ createdAt: -1 })
      //   .limit(limit)
      //   .skip(offset)
      //   .populate('user', 'email firstName lastName');

      // Placeholder response
      const builds = [];

      socket.emit("build_history", {
        projectId,
        builds,
        hasMore: false,
        limit,
        offset,
      });

      logger.debug("Build history requested", {
        userId: socket.userId,
        projectId,
        limit,
        offset,
      });
    } catch (error) {
      logger.error("Error getting build history", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to get build history",
        code: "GET_BUILD_HISTORY_ERROR",
      });
    }
  }

  /**
   * Get active builds
   * @param {Object} socket - Socket instance
   */
  async getActiveBuilds(socket) {
    try {
      this.sendActiveBuilds(socket);
    } catch (error) {
      logger.error("Error getting active builds", {
        error: error.message,
        userId: socket.userId,
      });
      socket.emit("error", {
        message: "Failed to get active builds",
        code: "GET_ACTIVE_BUILDS_ERROR",
      });
    }
  }

  /**
   * Cancel a build
   * @param {Object} socket - Socket instance
   * @param {Object} data - Cancel request data
   */
  async cancelBuild(socket, data) {
    try {
      const { buildId } = data;

      if (!buildId) {
        return socket.emit("error", {
          message: "Build ID is required",
          code: "MISSING_BUILD_ID",
        });
      }

      // TODO: Verify user can cancel this build and perform cancellation
      // const Build = require("../../models/Build");
      // const build = await Build.findById(buildId);
      // if (!build || (build.user.toString() !== socket.userId && socket.userRole !== 'admin')) {
      //   return socket.emit("error", {
      //     message: "Cannot cancel this build",
      //     code: "CANCEL_NOT_ALLOWED",
      //   });
      // }
      //
      // await build.cancel();

      // Broadcast cancellation to all subscribers
      const buildRoom = `build_${buildId}`;
      this.namespace.emit("build_cancelled", {
        buildId,
        cancelledBy: socket.userId,
        timestamp: new Date().toISOString(),
      });

      socket.emit("build_cancel_success", {
        buildId,
        timestamp: new Date().toISOString(),
      });

      logger.info("Build cancelled", {
        buildId,
        cancelledBy: socket.userId,
      });
    } catch (error) {
      logger.error("Error cancelling build", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to cancel build",
        code: "CANCEL_BUILD_ERROR",
      });
    }
  }

  /**
   * Send active builds to user
   * @param {Object} socket - Socket instance
   */
  async sendActiveBuilds(socket) {
    try {
      // TODO: Get active builds for user's projects
      // const Build = require("../../models/Build");
      // const activeBuilds = await Build.find({
      //   status: { $in: ['pending', 'running'] },
      //   // Add project access filter
      // });

      // Placeholder response
      const activeBuilds = [];

      socket.emit("active_builds", {
        builds: activeBuilds,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error sending active builds", {
        error: error.message,
        userId: socket.userId,
      });
    }
  }

  /**
   * Send recent build logs
   * @param {Object} socket - Socket instance
   * @param {String} buildId - Build ID
   */
  async sendRecentBuildLogs(socket, buildId) {
    try {
      // TODO: Get recent logs for this build
      // const BuildLog = require("../../models/BuildLog");
      // const recentLogs = await BuildLog.find({ buildId })
      //   .sort({ timestamp: -1 })
      //   .limit(100);

      // Placeholder response
      const recentLogs = [];

      socket.emit("build_logs_history", {
        buildId,
        logs: recentLogs,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error sending recent build logs", {
        error: error.message,
        buildId,
        userId: socket.userId,
      });
    }
  }

  /**
   * Clean up subscriptions for a socket
   * @param {Object} socket - Socket instance
   */
  cleanupSocketSubscriptions(socket) {
    const subscriptionsToRemove = [];

    this.buildSubscriptions.forEach((subscription, key) => {
      if (subscription.socketId === socket.id) {
        subscriptionsToRemove.push(key);
      }
    });

    subscriptionsToRemove.forEach((key) => {
      this.buildSubscriptions.delete(key);
    });

    logger.debug("Cleaned up build subscriptions", {
      socketId: socket.id,
      userId: socket.userId,
      count: subscriptionsToRemove.length,
    });
  }

  /**
   * Broadcast build log to subscribers (called from build system)
   * @param {String} buildId - Build ID
   * @param {Object} logData - Log data
   */
  static broadcastBuildLog(buildId, logData) {
    const namespace = webSocketRegistry.get("/build-logs");
    if (namespace) {
      const buildRoom = `build_${buildId}`;
      namespace.namespace.to(buildRoom).emit("build_log", {
        buildId,
        ...logData,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Broadcast build status change to subscribers
   * @param {String} buildId - Build ID
   * @param {Object} statusData - Status data
   */
  static broadcastBuildStatus(buildId, statusData) {
    const namespace = webSocketRegistry.get("/build-logs");
    if (namespace) {
      const buildRoom = `build_${buildId}`;
      namespace.namespace.to(buildRoom).emit("build_status_change", {
        buildId,
        ...statusData,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = BuildLogsNamespace;
