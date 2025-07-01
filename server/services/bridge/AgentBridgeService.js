/**
 * Agent Bridge Service
 * Main coordinator for agent-server-client WebSocket bridge
 * Routes agent streams to client namespaces with AI integration
 */

const EventEmitter = require("events");
const logger = require("@config/logger");
const webSocketManager = require("@config/webSocketManager");
const AgentConnectionManager = require("./AgentConnectionManager");
const StreamRouter = require("./StreamRouter");
const UserAccessControl = require("./UserAccessControl");

class AgentBridgeService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.connectionManager = new AgentConnectionManager();
    this.streamRouter = new StreamRouter();
    this.accessControl = new UserAccessControl();
    this.connectedAgents = new Map(); // agentId -> connection info
    this.activeStreams = new Map(); // streamId -> stream info
  }

  /**
   * Initialize the Agent Bridge Service
   */
  async initialize() {
    if (this.isInitialized) {
      logger.debug("Agent Bridge Service already initialized");
      return true;
    }

    try {
      logger.info("Initializing Agent Bridge Service...");

      // Initialize sub-components
      await this.connectionManager.initialize();
      await this.streamRouter.initialize();
      await this.accessControl.initialize();

      // Setup agent namespace for receiving connections
      await this._setupAgentNamespace();

      this.isInitialized = true;

      logger.info("Agent Bridge Service initialized successfully", {
        components: [
          "ConnectionManager",
          "StreamRouter",
          "AccessControl",
        ],
        agentNamespace: "/agent-bridge",
      });

      return true;
    } catch (error) {
      logger.error("Failed to initialize Agent Bridge Service", {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Handle new agent connection
   */
  async handleAgentConnection(socket, agentInfo) {
    try {
      const { agentId, agentSecret, platformDomain } = agentInfo;

      logger.info("New agent attempting connection", {
        agentId,
        platformDomain,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Validate agent credentials
      const isValid = await this.connectionManager.validateAgent(
        agentId,
        agentSecret,
        platformDomain
      );
      if (!isValid) {
        logger.error("🚫 Agent authentication failed", {
          agentId,
          reason: "Invalid credentials",
        });
        socket.emit("authentication_failed", {
          message: "Invalid agent credentials",
          timestamp: new Date().toISOString(),
        });
        socket.disconnect();
        return false;
      }

      // Register agent connection
      const connectionInfo = {
        agentId,
        socketId: socket.id,
        socket,
        platformDomain,
        connectedAt: new Date(),
        lastHeartbeat: new Date(),
        namespaces: new Set(),
        connectionStatus: "establishing",
        handshakeCompleted: false,
      };

      this.connectedAgents.set(agentId, connectionInfo);

      // Setup agent-specific event handlers
      await this._setupAgentEventHandlers(socket, agentId);

      // Send connection establishment with verification data
      const establishmentData = {
        agentId,
        serverTime: new Date().toISOString(),
        availableNamespaces: [
          "/agent-logs",
          "/agent-metrics",
          "/agent-builds",
          "/agent-deployments",
        ],
        bridgeStatus: "connected",
        connectionId: socket.id,
      };

      socket.emit("connection_established", establishmentData);

      logger.info("Agent connection established - awaiting handshake", {
        agentId,
        socketId: socket.id,
        totalAgents: this.connectedAgents.size,
      });

      // Start periodic health check for this agent
      this._startAgentHealthCheck(agentId);

      return true;
    } catch (error) {
      logger.error("Error handling agent connection", {
        error: error.message,
        stack: error.stack,
        socketId: socket.id,
      });
      return false;
    }
  }

  /**
   * Handle agent disconnection
   */
  async handleAgentDisconnection(socket, agentId) {
    try {
      logger.info("🔌 Agent disconnecting", {
        agentId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });

      const agentInfo = this.connectedAgents.get(agentId);
      if (agentInfo) {
        // Log connection duration and stats
        const connectionDuration = new Date() - agentInfo.connectedAt;
        logger.info("Agent connection statistics", {
          agentId,
          connectionDuration: `${Math.round(connectionDuration / 1000)}s`,
          handshakeCompleted: agentInfo.handshakeCompleted,
          connectionAcked: agentInfo.connectionAcked,
          lastHeartbeat: agentInfo.lastHeartbeat,
          lastPong: agentInfo.lastPong,
        });

        // Clean up health check interval
        if (agentInfo.healthCheckInterval) {
          clearInterval(agentInfo.healthCheckInterval);
        }
      }

      // Clean up active streams
      await this._cleanupAgentStreams(agentId);

      // Remove from connected agents
      this.connectedAgents.delete(agentId);

      logger.info("Agent disconnected and cleaned up", {
        agentId,
        remainingAgents: this.connectedAgents.size,
      });
    } catch (error) {
      logger.error("Error handling agent disconnection", {
        error: error.message,
        agentId,
      });
    }
  }

  /**
   * Route agent stream data to appropriate client rooms
   */
  async routeAgentStream(agentId, namespace, event, data, room) {
    try {
      // Validate agent is connected
      if (!this.connectedAgents.has(agentId)) {
        logger.warning("Received stream from unknown agent", { agentId });
        return false;
      }

      // Process through AI middleware (async, non-blocking)
      this.aiMiddleware.processLogData(data, {
        agentId,
        namespace,
        event,
        room,
      });

      // Route to appropriate client namespace
      const routed = await this.streamRouter.routeStream({
        agentId,
        sourceNamespace: namespace,
        event,
        data,
        room,
        timestamp: new Date().toISOString(),
      });

      if (routed) {
        logger.debug("Stream routed successfully", {
          agentId,
          namespace,
          event,
          room,
          dataSize: JSON.stringify(data).length,
        });
      }

      return routed;
    } catch (error) {
      logger.error("Error routing agent stream", {
        error: error.message,
        agentId,
        namespace,
        event,
      });
      return false;
    }
  }

  /**
   * Request logs from a specific agent
   */
  async requestAgentLogs(agentId, options = {}) {
    try {
      const connectionInfo = this.connectedAgents.get(agentId);
      if (!connectionInfo) {
        logger.warning("Cannot request logs from disconnected agent", {
          agentId,
        });
        return null;
      }

      const { type = "system", lines = 50 } = options;
      const requestId = `log_request_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Send log request to agent
      connectionInfo.socket.emit("request_logs", {
        requestId,
        type,
        lines,
        timestamp: new Date().toISOString(),
      });

      logger.info("Log request sent to agent", {
        agentId,
        requestId,
        type,
        lines,
      });

      // Return request ID for tracking (actual logs will come via stream)
      return { requestId, status: "requested" };
    } catch (error) {
      logger.error("Error requesting agent logs", {
        error: error.message,
        agentId,
      });
      return null;
    }
  }

  /**
   * Setup agent namespace for receiving connections
   */
  async _setupAgentNamespace() {
    const agentNamespace = webSocketManager.getIO().of("/agent-bridge");

    // Agent authentication middleware
    agentNamespace.use(async (socket, next) => {
      try {
        const agentSecret = socket.handshake.headers["x-agent-secret"];
        const agentId = socket.handshake.headers["x-agent-id"];
        const platformDomain = socket.handshake.headers["x-platform-domain"];

        if (!agentSecret || !agentId || !platformDomain) {
          return next(new Error("Missing agent authentication headers"));
        }

        // Store agent info in socket
        socket.agentInfo = { agentId, agentSecret, platformDomain };
        next();
      } catch (error) {
        logger.error("Agent authentication middleware error", {
          error: error.message,
        });
        next(new Error("Authentication failed"));
      }
    });

    // Handle agent connections
    agentNamespace.on("connection", async (socket) => {
      await this.handleAgentConnection(socket, socket.agentInfo);

      socket.on("disconnect", async (reason) => {
        await this.handleAgentDisconnection(socket, socket.agentInfo?.agentId);
      });
    });

    logger.info("Agent namespace setup completed", {
      namespace: "/agent-bridge",
      middleware: "agent-auth",
    });
  }

  /**
   * Setup event handlers for a specific agent
   */
  async _setupAgentEventHandlers(socket, agentId) {
    // Agent logs events
    socket.on("/agent-logs:system_logs", async (data) => {
      await this.routeAgentStream(
        agentId,
        "/agent-logs",
        "system_logs",
        data,
        data.room
      );
    });

    socket.on("/agent-logs:container_logs", async (data) => {
      await this.routeAgentStream(
        agentId,
        "/agent-logs",
        "container_logs",
        data,
        data.room
      );
    });

    // Log response events (for responding to log requests)
    socket.on("/agent-logs:system_logs_response", async (data) => {
      await this.routeAgentStream(
        agentId,
        "/agent-logs",
        "system_logs_response",
        data,
        data.room
      );

      // Also emit to log collector for processing
      this.emit("agent_logs", agentId, data);
    });

    socket.on("/agent-logs:container_logs_response", async (data) => {
      await this.routeAgentStream(
        agentId,
        "/agent-logs",
        "container_logs_response",
        data,
        data.room
      );

      // Also emit to log collector for processing
      this.emit("agent_logs", agentId, data);
    });

    // Agent metrics events (future)
    socket.on("/agent-metrics:system_metrics", async (data) => {
      await this.routeAgentStream(
        agentId,
        "/agent-metrics",
        "system_metrics",
        data,
        data.room
      );
    });

    // Live streaming events (real-time log streams)
    socket.on("live_system_logs", async (data) => {
      logger.debug("Received live system logs from agent", {
        agentId,
        logCount: data.logs?.length || 0,
        streamType: data.stream_type,
      });

      // Route through StreamRouter to client ONLY
      // Do NOT emit to AgentLogCollector to avoid duplicate processing
      await this.routeAgentStream(
        agentId,
        "/agent-logs",
        "live_system_logs",
        data,
        data.room || "admin-system-logs"
      );
    });

    socket.on("live_container_logs", async (data) => {
      logger.debug("Received live container logs from agent", {
        agentId,
        containerId: data.container_id,
        logCount: data.logs?.length || 0,
      });

      // Route through StreamRouter to client ONLY
      // Do NOT emit to AgentLogCollector to avoid duplicate processing
      await this.routeAgentStream(
        agentId,
        "/agent-logs",
        "live_container_logs",
        data,
        data.room || `user-${data.user_id}-logs`
      );
    });

    // Stream control events
    socket.on("log_stream_started", async (data) => {
      logger.info("Agent confirmed log stream started", { agentId, data });
      this.emit("log_stream_started", data);
    });

    socket.on("log_stream_stopped", async (data) => {
      logger.info("Agent confirmed log stream stopped", { agentId, data });
      this.emit("log_stream_stopped", data);
    });

    // Heartbeat
    socket.on("heartbeat", (data) => {
      const agentInfo = this.connectedAgents.get(agentId);
      if (agentInfo) {
        agentInfo.lastHeartbeat = new Date();
      }
    });

    // Bridge handshake - agent sends initial connection data
    socket.on("bridge_handshake", async (data) => {
      logger.info("Received bridge handshake from agent", {
        agentId,
        handshakeId: data.handshake_id,
        capabilities: data.capabilities,
        agentVersion: data.agent_version,
      });

      const agentInfo = this.connectedAgents.get(agentId);
      if (agentInfo) {
        agentInfo.handshakeCompleted = true;
        agentInfo.connectionStatus = "established";
        agentInfo.capabilities = data.capabilities;
        agentInfo.agentVersion = data.agent_version;
      }

      // Send handshake response back to agent
      socket.emit("bridge_handshake_ack", {
        handshakeId: data.handshake_id,
        serverTime: new Date().toISOString(),
        status: "handshake_complete",
        bridgeReady: true,
      });

      // Notify AgentLogCollector that this agent is ready for log streaming
      this.emit("agent_ready", agentId, {
        capabilities: data.capabilities,
        connectionInfo: agentInfo,
      });

      logger.info("Bridge handshake completed successfully", {
        agentId,
        status: "fully_connected",
        capabilities: data.capabilities,
      });
    });

    // Connection ACK - agent confirms connection establishment
    socket.on("connection_ack", async (data) => {
      logger.info("Received connection ACK from agent", {
        agentId,
        clientTime: data.client_time,
        status: data.status,
        message: data.message,
      });

      const agentInfo = this.connectedAgents.get(agentId);
      if (agentInfo) {
        agentInfo.connectionAcked = true;
        agentInfo.lastAck = new Date();
      }
    });

    // Bridge pong - health check response
    socket.on("bridge_pong", (data) => {
      logger.debug("📡 Received bridge pong from agent", {
        agentId,
        pingId: data.ping_id,
        timestamp: data.timestamp,
      });

      const agentInfo = this.connectedAgents.get(agentId);
      if (agentInfo) {
        agentInfo.lastPong = new Date();
        agentInfo.healthStatus = "healthy";
      }
    });

    // Error handling
    socket.on("error", (error) => {
      logger.error("Agent socket error", {
        agentId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    logger.debug("Agent event handlers setup completed", { agentId });
  }

  /**
   * Clean up streams for disconnected agent
   */
  async _cleanupAgentStreams(agentId) {
    try {
      // Stop any active streams from this agent
      for (const [streamId, streamInfo] of this.activeStreams.entries()) {
        if (streamInfo.agentId === agentId) {
          this.activeStreams.delete(streamId);
          logger.debug("Cleaned up agent stream", { agentId, streamId });
        }
      }

      // Notify stream router to cleanup
      await this.streamRouter.cleanupAgentStreams(agentId);
    } catch (error) {
      logger.error("Error cleaning up agent streams", {
        error: error.message,
        agentId,
      });
    }
  }

  /**
   * Send a message to a specific agent
   */
  async sendToAgent(agentId, event, data = {}) {
    try {
      const connectionInfo = this.connectedAgents.get(agentId);
      if (!connectionInfo) {
        logger.warning("Cannot send message to disconnected agent", {
          agentId,
          event,
        });
        return false;
      }

      // Send message to agent via WebSocket
      connectionInfo.socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });

      logger.debug("Message sent to agent", {
        agentId,
        event,
        dataKeys: Object.keys(data),
      });

      return true;
    } catch (error) {
      logger.error("Error sending message to agent", {
        error: error.message,
        agentId,
        event,
      });
      return false;
    }
  }

  /**
   * Send a message to all connected agents
   */
  async sendToAllAgents(event, data = {}) {
    try {
      const results = [];
      for (const [agentId] of this.connectedAgents) {
        const success = await this.sendToAgent(agentId, event, data);
        results.push({ agentId, success });
      }

      logger.info("Message sent to all connected agents", {
        event,
        totalAgents: this.connectedAgents.size,
        successCount: results.filter((r) => r.success).length,
      });

      return results;
    } catch (error) {
      logger.error("Error sending message to all agents", {
        error: error.message,
        event,
      });
      return [];
    }
  }

  /**
   * Get bridge service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      connectedAgents: this.connectedAgents.size,
      agentList: Array.from(this.connectedAgents.keys()),
      activeStreams: this.activeStreams.size,
      componentStatus: {
        connectionManager: this.connectionManager.getStatus(),
        streamRouter: this.streamRouter.getStatus(),
        aiMiddleware: this.aiMiddleware.getStatus(),
        accessControl: this.accessControl.getStatus(),
      },
    };
  }

  /**
   * Health check for bridge service
   */
  async healthCheck() {
    const status = this.getStatus();

    return {
      ...status,
      health: {
        overall: this.isInitialized ? "healthy" : "unhealthy",
        agentConnections: this.connectedAgents.size > 0 ? "active" : "none",
        streamRouting: this.streamRouter.isActive() ? "active" : "inactive",
      },
    };
  }

  /**
   * Cleanup bridge service
   */
  async cleanup() {
    logger.info("Cleaning up Agent Bridge Service...");

    try {
      // Disconnect all agents
      for (const [agentId, connectionInfo] of this.connectedAgents.entries()) {
        try {
          connectionInfo.socket.disconnect();
        } catch (error) {
          logger.error("Error disconnecting agent", {
            agentId,
            error: error.message,
          });
        }
      }

      // Cleanup components
      await this.connectionManager.cleanup();
      await this.streamRouter.cleanup();
      await this.aiMiddleware.cleanup();
      await this.accessControl.cleanup();

      // Clear maps
      this.connectedAgents.clear();
      this.activeStreams.clear();

      this.isInitialized = false;

      logger.info("Agent Bridge Service cleanup completed");
    } catch (error) {
      logger.error("Error during bridge service cleanup", {
        error: error.message,
      });
    }
  }

  /**
   * Start periodic health check for agent
   */
  _startAgentHealthCheck(agentId) {
    const healthCheckInterval = setInterval(async () => {
      const agentInfo = this.connectedAgents.get(agentId);
      if (!agentInfo) {
        clearInterval(healthCheckInterval);
        return;
      }

      try {
        // Send ping to agent
        const pingId = `ping_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        logger.debug("📡 Sending bridge ping to agent", {
          agentId,
          pingId,
        });

        agentInfo.socket.emit("bridge_ping", {
          ping_id: pingId,
          timestamp: new Date().toISOString(),
        });

        // Store ping info for tracking
        agentInfo.lastPing = new Date();
        agentInfo.lastPingId = pingId;
      } catch (error) {
        logger.error("Error sending health ping to agent", {
          agentId,
          error: error.message,
        });
      }
    }, 30000); // Every 30 seconds

    // Store interval for cleanup
    const agentInfo = this.connectedAgents.get(agentId);
    if (agentInfo) {
      agentInfo.healthCheckInterval = healthCheckInterval;
    }
  }

  /**
   * Enhanced bridge connection with verification logging
   */
  async verifyBridgeConnection(agentId) {
    try {
      const agentInfo = this.connectedAgents.get(agentId);
      if (!agentInfo) {
        return {
          connected: false,
          reason: "Agent not found",
        };
      }

      const verification = {
        connected: agentInfo.socket.connected,
        handshakeCompleted: agentInfo.handshakeCompleted || false,
        connectionAcked: agentInfo.connectionAcked || false,
        healthStatus: agentInfo.healthStatus || "unknown",
        lastHeartbeat: agentInfo.lastHeartbeat,
        lastPong: agentInfo.lastPong,
        connectionDuration: new Date() - agentInfo.connectedAt,
        capabilities: agentInfo.capabilities || {},
      };

      logger.info("Bridge connection verification", {
        agentId,
        verification,
      });

      return verification;
    } catch (error) {
      logger.error("Error verifying bridge connection", {
        agentId,
        error: error.message,
      });
      return {
        connected: false,
        reason: error.message,
      };
    }
  }
}

// Global bridge service instance
const agentBridgeService = new AgentBridgeService();

module.exports = agentBridgeService;
