/**
 * Agent Bridge Service
 * Main coordinator for agent-server-client WebSocket bridge
 * Routes agent streams to client namespaces with AI integration
 */

const logger = require("@config/logger");
const webSocketManager = require("@config/webSocketManager");
const AgentConnectionManager = require("./AgentConnectionManager");
const StreamRouter = require("./StreamRouter");
const AIAnalysisMiddleware = require("./AIAnalysisMiddleware");
const UserAccessControl = require("./UserAccessControl");

class AgentBridgeService {
  constructor() {
    this.isInitialized = false;
    this.connectionManager = new AgentConnectionManager();
    this.streamRouter = new StreamRouter();
    this.aiMiddleware = new AIAnalysisMiddleware();
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
      await this.aiMiddleware.initialize();
      await this.accessControl.initialize();

      // Setup agent namespace for receiving connections
      await this._setupAgentNamespace();

      this.isInitialized = true;

      logger.info("✅ Agent Bridge Service initialized successfully", {
        components: [
          "ConnectionManager",
          "StreamRouter",
          "AIMiddleware",
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
      });

      // Validate agent credentials
      const isValid = await this.connectionManager.validateAgent(
        agentId,
        agentSecret,
        platformDomain
      );
      if (!isValid) {
        logger.error("Agent authentication failed", { agentId });
        socket.emit("authentication_failed", {
          message: "Invalid agent credentials",
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
      };

      this.connectedAgents.set(agentId, connectionInfo);

      // Setup agent-specific event handlers
      await this._setupAgentEventHandlers(socket, agentId);

      // Notify connection success
      socket.emit("connection_established", {
        agentId,
        serverTime: new Date().toISOString(),
        availableNamespaces: [
          "/agent-logs",
          "/agent-metrics",
          "/agent-builds",
          "/agent-deployments",
        ],
      });

      logger.info("✅ Agent connected successfully", {
        agentId,
        socketId: socket.id,
        totalAgents: this.connectedAgents.size,
      });

      return true;
    } catch (error) {
      logger.error("Error handling agent connection", {
        error: error.message,
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
      logger.info("Agent disconnecting", { agentId, socketId: socket.id });

      // Clean up active streams
      await this._cleanupAgentStreams(agentId);

      // Remove from connected agents
      this.connectedAgents.delete(agentId);

      logger.info("✅ Agent disconnected", {
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
        logger.debug("✅ Stream routed successfully", {
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

    logger.info("✅ Agent namespace setup completed", {
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

    // Heartbeat
    socket.on("heartbeat", (data) => {
      const agentInfo = this.connectedAgents.get(agentId);
      if (agentInfo) {
        agentInfo.lastHeartbeat = new Date();
      }
    });

    // Error handling
    socket.on("error", (error) => {
      logger.error("Agent socket error", { agentId, error: error.message });
    });

    logger.debug("✅ Agent event handlers setup completed", { agentId });
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

      logger.info("✅ Agent Bridge Service cleanup completed");
    } catch (error) {
      logger.error("Error during bridge service cleanup", {
        error: error.message,
      });
    }
  }
}

// Global bridge service instance
const agentBridgeService = new AgentBridgeService();

module.exports = agentBridgeService;
