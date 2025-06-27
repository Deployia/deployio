/**
 * Log Streaming Namespace
 * Unified namespace for all logging with room-based organization
 */

const webSocketRegistry = require("../core/WebSocketRegistry");
const logger = require("@config/logger");
const {
  logCollectorService,
} = require("@services/logging/LogCollectorService");

class LogStreamingNamespace {
  constructor() {
    this.namespace = null;
    this.activeStreams = new Map();
    this.userRooms = new Map(); // userId -> Set of rooms
    this.roomUsers = new Map(); // roomId -> Set of userIds
  }

  /**
   * Initialize the log streaming namespace
   */
  static initialize() {
    const instance = new LogStreamingNamespace();

    // Register namespace with proper authentication
    const namespace = webSocketRegistry.register("/logs", {
      requireAuth: true,
      requireAdmin: false, // Users can access their own logs
      requireVerified: false,
    });

    // Register event handlers
    namespace
      .on(
        "system:subscribe",
        instance.handleSystemLogSubscription.bind(instance)
      )
      .on("user:subscribe", instance.handleUserLogSubscription.bind(instance))
      .on(
        "deployment:subscribe",
        instance.handleDeploymentLogSubscription.bind(instance)
      )
      .on(
        "metrics:subscribe",
        instance.handleMetricsSubscription.bind(instance)
      )
      .on("stream:start", instance.startLogStream.bind(instance))
      .on("stream:stop", instance.stopLogStream.bind(instance))
      .on("stream:list", instance.getAvailableServices.bind(instance))
      .on("services:list", instance.getAvailableServices.bind(instance))
      .on("room:join", instance.handleRoomJoin.bind(instance))
      .on("room:leave", instance.handleRoomLeave.bind(instance));

    // Connection and disconnection handlers
    namespace
      .onConnection(instance.handleConnection.bind(instance))
      .onDisconnection(instance.handleDisconnection.bind(instance));

    instance.namespace = namespace;

    // Initialize log collector integration
    instance.initializeLogCollectorIntegration();

    logger.info("Log streaming namespace initialized");
    return instance;
  }

  /**
   * Initialize integration with log collector service
   */
  initializeLogCollectorIntegration() {
    // Listen for log events from the collector service
    logCollectorService.on("log", (logEntry) => {
      this.broadcastSystemLog(logEntry);
    });

    logCollectorService.on("metrics", (metrics) => {
      this.broadcastMetrics(metrics);
    });

    logCollectorService.on("error", (error) => {
      logger.error("Error from log collector service", error);
      this.broadcastError(error);
    });

    // Initialize the log collector service
    logCollectorService.initialize();
  }

  /**
   * Handle client connection
   */
  async handleConnection(socket) {
    const user = socket.user;

    logger.info(`User ${user.id} connected to logs namespace`);

    // Initialize user rooms tracking
    if (!this.userRooms.has(user.id)) {
      this.userRooms.set(user.id, new Set());
    }

    // Send initial status
    socket.emit("connection:status", {
      type: "connected",
      userId: user.id,
      permissions: {
        systemLogs: user.role === "admin",
        userLogs: true,
        metrics: user.role === "admin",
      },
      availableRooms: await this.getAvailableRooms(user),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnection(socket, reason) {
    const user = socket.user;

    logger.info(`User ${user.id} disconnected from logs namespace`);

    // Clean up user rooms
    const userRooms = this.userRooms.get(user.id);
    if (userRooms) {
      for (const roomId of userRooms) {
        await this.leaveRoom(user.id, roomId);
      }
      this.userRooms.delete(user.id);
    }

    // Stop any active streams for this user
    for (const [streamId, stream] of this.activeStreams) {
      if (stream.userId === user.id) {
        await this.stopLogStream(socket, { streamId });
      }
    }
  }

  /**
   * Handle system log subscription (admin only)
   */
  async handleSystemLogSubscription(socket, data) {
    const user = socket.user;

    if (user.role !== "admin") {
      socket.emit("error", {
        message: "Insufficient permissions for system logs",
        code: "PERMISSION_DENIED",
      });
      return;
    }

    const { services = ["backend", "ai-service", "agent"], realtime = false } =
      data;

    try {
      // Join system logs room
      await this.joinRoom(user.id, "system:all");
      socket.join("system:all");

      // Start log collection for requested services
      for (const serviceId of services) {
        if (realtime) {
          const streamId = await logCollectorService.startCollection(
            serviceId,
            { realtime: true }
          );
          this.activeStreams.set(streamId, {
            serviceId,
            userId: user.id,
            type: "system",
            startTime: new Date(),
          });
        }

        // Send recent logs
        const recentLogs = await logCollectorService.getRecentLogs(serviceId, {
          lines: 50,
          level: data.level || "all",
        });

        socket.emit("system:logs", {
          serviceId,
          logs: recentLogs.logs,
          totalLines: recentLogs.totalLines,
          source: recentLogs.source,
        });
      }

      socket.emit("system:subscribed", {
        services,
        realtime,
        room: "system:all",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error handling system log subscription:", error);
      socket.emit("error", {
        message: "Failed to subscribe to system logs",
        error: error.message,
      });
    }
  }

  /**
   * Handle user log subscription
   */
  async handleUserLogSubscription(socket, data) {
    const user = socket.user;
    const { projectId, deploymentId } = data;

    try {
      // Verify user has access to this project
      if (!(await this.verifyUserProjectAccess(user.id, projectId))) {
        socket.emit("error", {
          message: "Access denied to project logs",
          code: "ACCESS_DENIED",
        });
        return;
      }

      // Determine room based on scope
      let roomId;
      if (deploymentId) {
        roomId = `deployment:${deploymentId}`;
      } else if (projectId) {
        roomId = `project:${projectId}`;
      } else {
        roomId = `user:${user.id}`;
      }

      // Join appropriate room
      await this.joinRoom(user.id, roomId);
      socket.join(roomId);

      // Get recent deployment/project logs
      // TODO: Implement user log fetching
      const userLogs = await this.getUserLogs(user.id, projectId, deploymentId);

      socket.emit("user:logs", {
        projectId,
        deploymentId,
        logs: userLogs.logs,
        room: roomId,
        timestamp: new Date().toISOString(),
      });

      socket.emit("user:subscribed", {
        projectId,
        deploymentId,
        room: roomId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error handling user log subscription:", error);
      socket.emit("error", {
        message: "Failed to subscribe to user logs",
        error: error.message,
      });
    }
  }

  /**
   * Handle deployment log subscription
   */
  async handleDeploymentLogSubscription(socket, data) {
    const user = socket.user;
    const { deploymentId, realtime = false } = data;

    try {
      // Verify user has access to this deployment
      if (!(await this.verifyUserDeploymentAccess(user.id, deploymentId))) {
        socket.emit("error", {
          message: "Access denied to deployment logs",
          code: "ACCESS_DENIED",
        });
        return;
      }

      const roomId = `deployment:${deploymentId}`;

      // Join deployment room
      await this.joinRoom(user.id, roomId);
      socket.join(roomId);

      if (realtime) {
        // TODO: Start real-time deployment log streaming
        // This would connect to the agent service for live container logs
      }

      // Get recent deployment logs
      const deploymentLogs = await this.getDeploymentLogs(deploymentId);

      socket.emit("deployment:logs", {
        deploymentId,
        logs: deploymentLogs.logs,
        room: roomId,
        timestamp: new Date().toISOString(),
      });

      socket.emit("deployment:subscribed", {
        deploymentId,
        realtime,
        room: roomId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error handling deployment log subscription:", error);
      socket.emit("error", {
        message: "Failed to subscribe to deployment logs",
        error: error.message,
      });
    }
  }

  /**
   * Handle metrics subscription (admin only)
   */
  async handleMetricsSubscription(socket, data) {
    const user = socket.user;

    if (user.role !== "admin") {
      socket.emit("error", {
        message: "Insufficient permissions for metrics",
        code: "PERMISSION_DENIED",
      });
      return;
    }

    try {
      // Join metrics room
      await this.joinRoom(user.id, "metrics:system");
      socket.join("metrics:system");

      // Get current metrics
      const metrics = await logCollectorService.getSystemMetrics();

      socket.emit("metrics:data", {
        metrics,
        room: "metrics:system",
        timestamp: new Date().toISOString(),
      });

      socket.emit("metrics:subscribed", {
        room: "metrics:system",
        timestamp: new Date().toISOString(),
      });

      // Start periodic metrics streaming if requested
      if (data.realtime) {
        this.startMetricsStreaming(user.id);
      }
    } catch (error) {
      logger.error("Error handling metrics subscription:", error);
      socket.emit("error", {
        message: "Failed to subscribe to metrics",
        error: error.message,
      });
    }
  }

  /**
   * Start log stream
   */
  async startLogStream(socket, data) {
    const user = socket.user;

    // Validate input data
    if (!data) {
      socket.emit("error", {
        message: "Missing data for log stream",
        code: "INVALID_REQUEST",
      });
      return;
    }

    // Handle both serviceId and streamId (for backwards compatibility)
    let { serviceId, streamId, type = "system", options = {} } = data;

    // If streamId is provided but not serviceId, extract serviceId from streamId
    if (!serviceId && streamId) {
      // Extract service name from streamId (e.g., "backend-live" -> "backend")
      if (streamId.includes("-")) {
        serviceId = streamId.split("-")[0];
        logger.info("Extracted serviceId from streamId", {
          streamId,
          extractedServiceId: serviceId,
          userId: user.id,
        });
      } else {
        serviceId = streamId;
      }
    }

    // Map common service aliases to actual service IDs
    const serviceIdMappings = {
      backend: "backend",
      ai: "ai-service",
      "ai-service": "ai-service",
      agent: "agent",
    };

    if (serviceIdMappings[serviceId]) {
      const originalServiceId = serviceId;
      serviceId = serviceIdMappings[serviceId];
      logger.info("Mapped serviceId", {
        original: originalServiceId,
        mapped: serviceId,
        userId: user.id,
      });
    }

    // Validate serviceId
    if (!serviceId) {
      logger.error("Missing serviceId in startLogStream request", {
        data,
        userId: user.id,
      });
      socket.emit("error", {
        message: "serviceId or streamId is required to start log stream",
        code: "MISSING_SERVICE_ID",
        availableServices: logCollectorService.getAvailableServices(),
      });
      return;
    }

    // Check if collector exists for this service
    if (!logCollectorService.hasCollector(serviceId)) {
      logger.error("Invalid serviceId in startLogStream request", {
        serviceId,
        userId: user.id,
        availableServices: logCollectorService.getAvailableServices(),
      });
      socket.emit("error", {
        message: `Invalid serviceId: ${serviceId}`,
        code: "INVALID_SERVICE_ID",
        availableServices: logCollectorService.getAvailableServices(),
      });
      return;
    }

    try {
      // Check permissions
      if (type === "system" && user.role !== "admin") {
        socket.emit("error", {
          message: "Insufficient permissions for system log streaming",
          code: "PERMISSION_DENIED",
        });
        return;
      }

      logger.info("Starting log stream", { serviceId, type, userId: user.id });

      // Join appropriate room for receiving broadcasts
      if (type === "system") {
        await this.joinRoom(user.id, "system:all");
        socket.join("system:all");
        logger.info("User joined system:all room for log streaming", {
          userId: user.id,
        });
      }

      // Use the client-provided streamId if available, otherwise generate one
      const clientStreamId = data.streamId || `${serviceId}_${Date.now()}`;

      const collectorStreamId = await logCollectorService.startCollection(
        serviceId,
        {
          realtime: true,
          clientStreamId: clientStreamId, // Pass the client stream ID
          ...options,
        }
      );

      this.activeStreams.set(clientStreamId, {
        serviceId,
        userId: user.id,
        type,
        startTime: new Date(),
        options,
        collectorStreamId, // Keep reference to collector stream ID
      });

      socket.emit("log:started", {
        streamId: clientStreamId, // Use client stream ID in response
        serviceId,
        type,
        startedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      });

      logger.info("Log stream started successfully", {
        streamId: clientStreamId,
        collectorStreamId,
        serviceId,
        userId: user.id,
      });
    } catch (error) {
      logger.error("Error starting log stream:", error);
      socket.emit("error", {
        message: "Failed to start log stream",
        error: error.message,
        serviceId: serviceId || "undefined",
      });
    }
  }

  /**
   * Stop log stream
   */
  async stopLogStream(socket, data) {
    const { streamId } = data;

    try {
      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        socket.emit("error", {
          message: "Stream not found",
          code: "STREAM_NOT_FOUND",
        });
        return;
      }

      // Check if user owns this stream or is admin
      if (stream.userId !== socket.user.id && socket.user.role !== "admin") {
        socket.emit("error", {
          message: "Insufficient permissions to stop stream",
          code: "PERMISSION_DENIED",
        });
        return;
      }

      // Use collectorStreamId if available, otherwise use streamId
      const collectorStreamId = stream.collectorStreamId || streamId;

      await logCollectorService.stopCollection(collectorStreamId);
      this.activeStreams.delete(streamId);

      socket.emit("log:stopped", {
        streamId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error stopping log stream:", error);
      socket.emit("error", {
        message: "Failed to stop log stream",
        error: error.message,
      });
    }
  }

  /**
   * Handle room join
   */
  async handleRoomJoin(socket, data) {
    const user = socket.user;
    const { roomId } = data;

    try {
      // Verify user can join this room
      if (!(await this.verifyRoomAccess(user, roomId))) {
        socket.emit("error", {
          message: "Access denied to room",
          code: "ACCESS_DENIED",
        });
        return;
      }

      await this.joinRoom(user.id, roomId);
      socket.join(roomId);

      socket.emit("room:joined", {
        roomId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error joining room:", error);
      socket.emit("error", {
        message: "Failed to join room",
        error: error.message,
      });
    }
  }

  /**
   * Handle room leave
   */
  async handleRoomLeave(socket, data) {
    const user = socket.user;
    const { roomId } = data;

    try {
      await this.leaveRoom(user.id, roomId);
      socket.leave(roomId);

      socket.emit("room:left", {
        roomId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error leaving room:", error);
      socket.emit("error", {
        message: "Failed to leave room",
        error: error.message,
      });
    }
  }

  /**
   * Broadcast system log to appropriate rooms
   */
  broadcastSystemLog(logEntry) {
    if (!this.namespace || !this.namespace.namespace) {
      logger.warn("Namespace not initialized, cannot broadcast system log");
      return;
    }

    // Find the client streamId for this service
    let clientStreamId = `${logEntry.serviceId}_stream`; // Default fallback

    // Look for active stream with matching service
    for (const [streamId, stream] of this.activeStreams) {
      if (stream.serviceId === logEntry.serviceId) {
        clientStreamId = streamId; // Use the actual client stream ID
        break;
      }
    }

    // Get the actual Socket.IO namespace
    const socketIONamespace = this.namespace.namespace;

    // Broadcast to system logs room (admin only) - use "log:data" event for client compatibility
    socketIONamespace.to("system:all").emit("log:data", {
      streamId: clientStreamId, // Use the client stream ID
      data: logEntry.message,
      timestamp: logEntry.timestamp,
      level: logEntry.level,
      service: logEntry.serviceId,
      source: logEntry.source,
      isError: logEntry.level === "error",
      metadata: logEntry.metadata,
      ...logEntry,
    });

    // Also broadcast to admin room if it exists
    socketIONamespace.to("admin:all").emit("log:data", {
      streamId: clientStreamId, // Use the client stream ID
      data: logEntry.message,
      timestamp: logEntry.timestamp,
      level: logEntry.level,
      service: logEntry.serviceId,
      source: logEntry.source,
      isError: logEntry.level === "error",
      metadata: logEntry.metadata,
      ...logEntry,
    });
  }

  /**
   * Broadcast metrics to appropriate rooms
   */
  broadcastMetrics(metrics) {
    if (!this.namespace || !this.namespace.namespace) return;

    this.namespace.namespace.to("metrics:system").emit("metrics:update", {
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast error to appropriate rooms
   */
  broadcastError(error) {
    if (!this.namespace || !this.namespace.namespace) return;

    this.namespace.namespace.to("system:all").emit("system:error", {
      error: error.error,
      service: error.serviceId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Join a room and track membership
   */
  async joinRoom(userId, roomId) {
    // Add user to room tracking
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId).add(roomId);

    // Add room to user tracking
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId).add(userId);

    logger.debug(`User ${userId} joined room ${roomId}`);
  }

  /**
   * Leave a room and update tracking
   */
  async leaveRoom(userId, roomId) {
    // Remove user from room tracking
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.delete(roomId);
    }

    // Remove room from user tracking
    const roomUsers = this.roomUsers.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);

      // Clean up empty rooms
      if (roomUsers.size === 0) {
        this.roomUsers.delete(roomId);
      }
    }

    logger.debug(`User ${userId} left room ${roomId}`);
  }

  /**
   * Get available rooms for a user
   */
  async getAvailableRooms(user) {
    const rooms = [];

    // Admin can access all rooms
    if (user.role === "admin") {
      rooms.push("system:all", "metrics:system", "admin:all");
    }

    // User-specific room
    rooms.push(`user:${user.id}`);

    // TODO: Add user's project and deployment rooms
    // const userProjects = await getUserProjects(user.id);
    // for (const project of userProjects) {
    //   rooms.push(`project:${project.id}`);
    // }

    return rooms;
  }

  /**
   * Verify user has access to a room
   */
  async verifyRoomAccess(user, roomId) {
    // Admin can access all rooms
    if (user.role === "admin") {
      return true;
    }

    // System and metrics rooms are admin-only
    if (
      roomId.startsWith("system:") ||
      roomId.startsWith("metrics:") ||
      roomId.startsWith("admin:")
    ) {
      return false;
    }

    // User can access their own room
    if (roomId === `user:${user.id}`) {
      return true;
    }

    // Project and deployment room access needs to be verified
    if (roomId.startsWith("project:")) {
      const projectId = roomId.split(":")[1];
      return await this.verifyUserProjectAccess(user.id, projectId);
    }

    if (roomId.startsWith("deployment:")) {
      const deploymentId = roomId.split(":")[1];
      return await this.verifyUserDeploymentAccess(user.id, deploymentId);
    }

    return false;
  }

  /**
   * Verify user has access to a project
   */
  async verifyUserProjectAccess(userId, projectId) {
    // TODO: Implement project access verification
    // This should check the database to ensure the user owns or has access to the project
    return true; // Placeholder
  }

  /**
   * Verify user has access to a deployment
   */
  async verifyUserDeploymentAccess(userId, deploymentId) {
    // TODO: Implement deployment access verification
    // This should check the database to ensure the user owns or has access to the deployment
    return true; // Placeholder
  }

  /**
   * Get user logs
   */
  async getUserLogs(userId, projectId, deploymentId) {
    // TODO: Implement user log fetching
    // This should get logs for user's projects and deployments
    return {
      logs: [],
      totalLines: 0,
      source: "user-logs",
    };
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId) {
    // TODO: Implement deployment log fetching
    // This should get real-time logs from the agent service for the specific deployment
    return {
      logs: [],
      totalLines: 0,
      source: "deployment-logs",
    };
  }

  /**
   * Start metrics streaming for a user
   */
  startMetricsStreaming(userId) {
    // TODO: Implement periodic metrics streaming
    // This should send metrics updates at regular intervals
  }

  /**
   * Get namespace status
   */
  getStatus() {
    return {
      activeStreams: this.activeStreams.size,
      connectedUsers: this.userRooms.size,
      activeRooms: this.roomUsers.size,
      rooms: Array.from(this.roomUsers.keys()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get available services for log streaming
   */
  async getAvailableServices(socket) {
    const user = socket.user;

    try {
      const availableServices = logCollectorService.getAvailableServices();

      // Send available streams in the format the client expects
      const streamData = {};
      availableServices.forEach((serviceId) => {
        streamData[serviceId] = {
          name: serviceId,
          type: "application",
          description: `${serviceId} service logs`,
          available: true,
        };
      });

      socket.emit("streams:available", streamData);

      logger.info("Available services requested", {
        userId: user.id,
        services: availableServices,
      });
    } catch (error) {
      logger.error("Error getting available services:", error);
      socket.emit("error", {
        message: "Failed to get available services",
        error: error.message,
      });
    }
  }
}

module.exports = LogStreamingNamespace;
