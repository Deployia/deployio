const webSocketRegistry = require("../core/WebSocketRegistry");
const logger = require("../../config/logger");

/**
 * Metrics Streaming WebSocket Namespace
 * Handles real-time metrics streaming for admin users
 */
class MetricsNamespace {
  constructor() {
    this.namespace = null;
    this.activeStreams = new Map();
    this.streamIntervals = new Map();
  }

  /**
   * Initialize the metrics streaming namespace
   */
  static initialize() {
    const instance = new MetricsNamespace();

    // Register namespace with admin-only access
    const namespace = webSocketRegistry.register("/metrics", {
      requireAuth: true,
      requireAdmin: true,
      requireVerified: false, // OAuth users are auto-verified
    });

    // Register event handlers
    namespace
      .on("stream:start", instance.startMetricsStream.bind(instance))
      .on("stream:stop", instance.stopMetricsStream.bind(instance))
      .on("stream:list", instance.listAvailableServices.bind(instance));

    // Add connection and disconnection handlers
    namespace
      .onConnection(instance.handleConnection.bind(instance))
      .onDisconnection(instance.handleDisconnection.bind(instance));

    instance.namespace = namespace;

    logger.info("Metrics streaming namespace initialized");
    return instance;
  }

  /**
   * Handle new connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    logger.info("Admin connected to metrics streaming", {
      userId: socket.userId,
      email: socket.userEmail,
    });

    // Send available services
    this.sendAvailableServices(socket);
  }

  /**
   * Handle disconnection
   * @param {Object} socket - Socket instance
   * @param {String} reason - Disconnection reason
   */
  handleDisconnection(socket, reason) {
    // Stop all streams for this socket
    this.stopAllStreamsForSocket(socket);

    logger.info("Admin disconnected from metrics streaming", {
      userId: socket.userId,
      reason,
    });
  }

  /**
   * Start metrics streaming for a service
   * @param {Object} socket - Socket instance
   * @param {Object} data - Stream configuration
   */
  async startMetricsStream(socket, data) {
    try {
      const { serviceName, interval = 5000 } = data;

      if (!serviceName) {
        return socket.emit("error", {
          message: "Service name is required",
          code: "MISSING_SERVICE_NAME",
        });
      }

      // Validate service name
      const validServices = ["backend", "ai-service", "agent"];
      if (!validServices.includes(serviceName)) {
        return socket.emit("error", {
          message: "Invalid service name",
          code: "INVALID_SERVICE",
        });
      }

      // Validate interval (1-60 seconds)
      const streamInterval = Math.max(
        1000,
        Math.min(60000, parseInt(interval))
      );
      const streamId = `metrics_${serviceName}_${socket.id}_${Date.now()}`;

      // Stop existing stream for this service if any
      this.stopMetricsStreamForSocket(socket, serviceName);

      // Get metrics function from the service module
      const { getServiceMetrics } = require("../../routes/health/service");

      // Create streaming function
      const streamFunction = async () => {
        try {
          const metrics = await getServiceMetrics(serviceName);

          socket.emit("metrics_update", {
            service: serviceName,
            timestamp: new Date().toISOString(),
            data: metrics,
            streamId,
          });
        } catch (error) {
          logger.error(`Error streaming metrics for ${serviceName}:`, error);
          socket.emit("error", {
            message: `Failed to get metrics for ${serviceName}`,
            code: "METRICS_ERROR",
            service: serviceName,
          });
        }
      };

      // Start the interval
      const intervalId = setInterval(streamFunction, streamInterval);

      // Store stream info
      const streamInfo = {
        streamId,
        serviceName,
        interval: streamInterval,
        intervalId,
        socket,
        startedAt: new Date(),
      };

      this.activeStreams.set(streamId, streamInfo);
      this.streamIntervals.set(`${socket.id}_${serviceName}`, streamInfo);

      // Send initial metrics immediately
      await streamFunction();

      // Confirm stream started
      socket.emit("stream:started", {
        streamId,
        serviceName,
        interval: streamInterval,
        message: `Metrics streaming started for ${serviceName}`,
      });

      logger.info("Metrics stream started", {
        userId: socket.userId,
        serviceName,
        streamId,
        interval: streamInterval,
      });
    } catch (error) {
      logger.error("Error starting metrics stream:", error);
      socket.emit("error", {
        message: "Failed to start metrics stream",
        code: "STREAM_START_ERROR",
        error: error.message,
      });
    }
  }

  /**
   * Stop metrics streaming for a service
   * @param {Object} socket - Socket instance
   * @param {Object} data - Stop configuration
   */
  async stopMetricsStream(socket, data) {
    try {
      const { serviceName, streamId } = data;

      if (streamId) {
        // Stop specific stream by ID
        const streamInfo = this.activeStreams.get(streamId);
        if (streamInfo && streamInfo.socket.id === socket.id) {
          this.stopStreamById(streamId);
          socket.emit("stream:stopped", {
            streamId,
            serviceName: streamInfo.serviceName,
            message: "Metrics stream stopped",
          });
        }
      } else if (serviceName) {
        // Stop stream by service name
        this.stopMetricsStreamForSocket(socket, serviceName);
        socket.emit("stream:stopped", {
          serviceName,
          message: `Metrics stream stopped for ${serviceName}`,
        });
      } else {
        socket.emit("error", {
          message: "Stream ID or service name is required",
          code: "MISSING_STOP_CONFIG",
        });
      }
    } catch (error) {
      logger.error("Error stopping metrics stream:", error);
      socket.emit("error", {
        message: "Failed to stop metrics stream",
        code: "STREAM_STOP_ERROR",
        error: error.message,
      });
    }
  }

  /**
   * List available services for metrics streaming
   * @param {Object} socket - Socket instance
   */
  sendAvailableServices(socket) {
    const services = [
      {
        name: "backend",
        displayName: "Express Backend",
        description: "Node.js Express server metrics",
        available: true,
      },
      {
        name: "ai-service",
        displayName: "AI Service",
        description: "FastAPI AI service metrics",
        available: true,
      },
      {
        name: "agent",
        displayName: "Deployment Agent",
        description: "DeployIO agent metrics",
        available: true,
      },
    ];

    socket.emit("services:available", services);
  }

  /**
   * Handle list available services request
   * @param {Object} socket - Socket instance
   */
  listAvailableServices(socket) {
    this.sendAvailableServices(socket);
  }

  /**
   * Stop specific stream by ID
   * @param {String} streamId - Stream ID
   */
  stopStreamById(streamId) {
    const streamInfo = this.activeStreams.get(streamId);
    if (streamInfo) {
      clearInterval(streamInfo.intervalId);
      this.activeStreams.delete(streamId);

      // Also remove from socket-service mapping
      const socketServiceKey = `${streamInfo.socket.id}_${streamInfo.serviceName}`;
      this.streamIntervals.delete(socketServiceKey);

      logger.debug("Metrics stream stopped", {
        streamId,
        serviceName: streamInfo.serviceName,
      });
    }
  }

  /**
   * Stop metrics stream for a specific socket and service
   * @param {Object} socket - Socket instance
   * @param {String} serviceName - Service name
   */
  stopMetricsStreamForSocket(socket, serviceName) {
    const socketServiceKey = `${socket.id}_${serviceName}`;
    const streamInfo = this.streamIntervals.get(socketServiceKey);

    if (streamInfo) {
      this.stopStreamById(streamInfo.streamId);
    }
  }

  /**
   * Stop all streams for a socket (when disconnecting)
   * @param {Object} socket - Socket instance
   */
  stopAllStreamsForSocket(socket) {
    const streamsToStop = [];

    for (const [streamId, streamInfo] of this.activeStreams) {
      if (streamInfo.socket.id === socket.id) {
        streamsToStop.push(streamId);
      }
    }

    streamsToStop.forEach((streamId) => {
      this.stopStreamById(streamId);
    });

    logger.debug("Stopped all metrics streams for socket", {
      socketId: socket.id,
      streamCount: streamsToStop.length,
    });
  }

  /**
   * Get namespace instance for external access
   */
  getNamespace() {
    return this.namespace;
  }
}

module.exports = MetricsNamespace;
