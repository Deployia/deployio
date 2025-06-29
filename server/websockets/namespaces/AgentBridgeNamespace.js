/**
 * Agent Bridge Namespace
 * Handles real-time communication with remote deployment agents
 */

const EventEmitter = require("events");
const webSocketRegistry = require("../core/WebSocketRegistry");
const logger = require("@config/logger");
const RemoteAgentLogBridge = require("@services/logging/RemoteAgentLogBridge");

class AgentBridgeNamespace extends EventEmitter {
  constructor() {
    super();
    this.namespace = null;
    this.connectedAgents = new Map(); // agentId -> socket
    this.agentInfo = new Map(); // agentId -> agent metadata
    this.logStreams = new Map(); // streamId -> stream info
    this.userSubscriptions = new Map(); // userId -> Set of streamIds
  }

  // Static property to store the singleton instance
  static instance = null;

  /**
   * Initialize the agent bridge namespace
   */
  static initialize() {
    const instance = new AgentBridgeNamespace();

    // Register namespace with agent-specific authentication
    const namespace = webSocketRegistry.register("/agent-bridge", {
      requireAuth: false, // Agents authenticate differently
      requireAdmin: false,
      requireVerified: false,
      customAuth: true, // Use custom agent authentication
    });

    // Register event handlers
    namespace
      .on("agent:identify", instance.handleAgentIdentify.bind(instance))
      .on("agent:status", instance.handleAgentStatus.bind(instance))
      .on("agent:logs_batch", instance.handleLogsBatch.bind(instance))
      .on("heartbeat_response", instance.handleHeartbeat.bind(instance))
      .on("stream_started", instance.handleStreamStarted.bind(instance))
      .on("stream_stopped", instance.handleStreamStopped.bind(instance))
      .on("stream_error", instance.handleStreamError.bind(instance));

    // Connection and disconnection handlers
    namespace
      .onConnection(instance.handleConnection.bind(instance))
      .onDisconnection(instance.handleDisconnection.bind(instance));

    instance.namespace = namespace;

    // Setup periodic agent health checks
    instance.setupHealthChecks();

    // Store instance for global access
    AgentBridgeNamespace.instance = instance;

    logger.info("Agent bridge namespace initialized");
    return instance;
  }

  /**
   * Get the singleton instance
   */
  static getInstance() {
    return AgentBridgeNamespace.instance;
  }

  /**
   * Handle agent connection with custom authentication
   */
  async handleConnection(socket) {
    // Store socket headers for debugging
    this.lastSocketHeaders = socket.handshake.headers;

    logger.info("Agent attempting to connect", {
      socketId: socket.id,
      headers: {
        "x-agent-secret": socket.handshake.headers["x-agent-secret"]
          ? "***PRESENT***"
          : "MISSING",
        "x-agent-id": socket.handshake.headers["x-agent-id"],
        "x-agent-domain": socket.handshake.headers["x-agent-domain"],
        "user-agent": socket.handshake.headers["user-agent"],
        origin: socket.handshake.headers["origin"],
      },
      query: socket.handshake.query,
      address: socket.handshake.address,
    });

    // Extract agent credentials from headers
    const agentSecret = socket.handshake.headers["x-agent-secret"];
    const agentId = socket.handshake.headers["x-agent-id"];
    const agentDomain = socket.handshake.headers["x-agent-domain"];

    // Validate agent credentials
    if (!this.validateAgentCredentials(agentSecret, agentId)) {
      logger.error("Agent authentication failed - disconnecting", {
        agentId,
        socketId: socket.id,
        reason: "Invalid credentials",
      });
      socket.emit("auth_error", {
        error: "Invalid agent credentials",
        timestamp: new Date().toISOString(),
      });
      socket.disconnect();
      return;
    }

    // Store agent connection
    this.connectedAgents.set(agentId, socket);
    socket.agentId = agentId;

    logger.info("Agent connected successfully", {
      agentId,
      socketId: socket.id,
      domain: agentDomain,
      totalConnectedAgents: this.connectedAgents.size,
      connectedAgentIds: Array.from(this.connectedAgents.keys()),
    });

    // Send connection acknowledgment
    socket.emit("connection:ack", {
      success: true,
      agentId,
      timestamp: new Date().toISOString(),
      server: "DeployIO Platform",
    });

    // Emit event for AgentLogCollector
    this.emit("agent:connected", {
      agentId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle agent disconnection
   */
  async handleDisconnection(socket, reason) {
    const agentId = socket.agentId;

    if (agentId) {
      logger.info("Agent disconnected", { agentId, reason });

      // Clean up agent data
      this.connectedAgents.delete(agentId);
      this.agentInfo.delete(agentId);

      // Notify clients about agent disconnection
      this.notifyAgentStatusChange(agentId, "disconnected");

      // Clean up streams for this agent
      this.cleanupAgentStreams(agentId);

      // Emit event for AgentLogCollector
      this.emit("agent:disconnected", {
        agentId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Validate agent credentials
   */
  validateAgentCredentials(agentSecret, agentId) {
    const expectedSecret =
      process.env.AGENT_SECRET || "development-secret-change-in-production";
    const allowedAgentIds = (
      process.env.ALLOWED_AGENT_IDS || "agent-ec2-2"
    ).split(",");

    logger.info("Validating agent credentials", {
      providedAgentId: agentId,
      allowedAgentIds,
      hasSecret: !!agentSecret,
      expectedSecretExists: !!expectedSecret,
      secretLength: agentSecret ? agentSecret.length : 0,
      expectedSecretLength: expectedSecret.length,
    });

    if (!agentSecret || !agentId) {
      logger.warn("Missing agent credentials", {
        agentSecret: !!agentSecret,
        agentId: !!agentId,
        headers: Object.keys(this.lastSocketHeaders || {}),
      });
      return false;
    }

    const isValidSecret = agentSecret === expectedSecret;
    const isValidAgentId = allowedAgentIds.includes(agentId);

    if (!isValidSecret) {
      logger.warn("Invalid agent secret provided", {
        providedLength: agentSecret.length,
        expectedLength: expectedSecret.length,
        providedFirst5: agentSecret.substring(0, 5),
        expectedFirst5: expectedSecret.substring(0, 5),
      });
    }
    if (!isValidAgentId) {
      logger.warn("Invalid agent ID provided", {
        providedId: agentId,
        allowedIds: allowedAgentIds,
      });
    }

    const isValid = isValidSecret && isValidAgentId;
    logger.info("Agent credential validation result", {
      agentId,
      isValid,
      secretValid: isValidSecret,
      idValid: isValidAgentId,
    });

    return isValid;
  }

  /**
   * Handle agent identification
   */
  async handleAgentIdentify(socket, data) {
    const agentId = data.agent_id;

    logger.info("Agent identified", {
      agentId,
      capabilities: data.capabilities,
    });

    // Store agent information
    this.agentInfo.set(agentId, {
      id: agentId,
      domain: data.agent_domain,
      capabilities: data.capabilities,
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });

    // Send authentication success
    socket.emit("agent_authenticated", {
      success: true,
      message: "Agent authenticated successfully",
      server_capabilities: ["log_streaming", "metrics", "deployments"],
    });

    // Notify clients about new agent
    this.notifyAgentStatusChange(
      agentId,
      "connected",
      this.agentInfo.get(agentId)
    );

    // Initialize log streaming for this agent
    await this.initializeAgentLogStreaming(agentId, socket);
  }

  /**
   * Handle agent status updates
   */
  async handleAgentStatus(socket, data) {
    const agentId = data.agent_id;

    // Update agent info
    if (this.agentInfo.has(agentId)) {
      const agentInfo = this.agentInfo.get(agentId);
      agentInfo.lastSeen = new Date().toISOString();
      agentInfo.status = data;
    }

    // Broadcast agent status to subscribed clients
    this.broadcastToClients("agent:status_update", {
      agentId,
      status: data,
      timestamp: new Date().toISOString(),
    });

    logger.debug("Agent status updated", { agentId, status: data });
  }

  /**
   * Handle logs batch from agent
   */
  async handleLogsBatch(socket, data) {
    const agentId = data.agent_id;
    const logs = data.logs;

    logger.info(`Received ${logs.length} logs from agent ${agentId}`, {
      agentId,
      logCount: logs.length,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Process and distribute logs
    for (const logEntry of logs) {
      await this.processLogEntry(agentId, logEntry);
    }

    // Send acknowledgment
    socket.emit("logs_batch_ack", {
      batch_size: logs.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Process individual log entry and integrate with LogStreamingNamespace
   */
  async processLogEntry(agentId, logEntry) {
    // Add metadata and normalize log entry to match system log format
    const enrichedLog = {
      ...logEntry,
      agentId,
      receivedAt: new Date().toISOString(),
      processed: true,
      // Normalize to match existing log format
      service: "agent",
      level: this.normalizeLogLevel(logEntry.level),
      content: logEntry.message || logEntry.content,
      source: logEntry.source || "agent",
    };

    logger.debug("Processing agent log entry", {
      agentId,
      logLevel: enrichedLog.level,
      source: enrichedLog.source,
      messageLength: enrichedLog.content ? enrichedLog.content.length : 0,
    });

    // ✅ PRIMARY: Emit to AgentLogCollector for unified processing
    this.emit("agent:log", enrichedLog);
    logger.debug("Emitted agent:log event to AgentLogCollector", { agentId });

    // ✅ SECONDARY: Direct integration with LogStreamingNamespace as backup
    this.integrateWithLogStreaming(enrichedLog);

    // Determine distribution rooms based on log source
    const rooms = this.determineLogRooms(enrichedLog);

    // Broadcast to appropriate rooms
    for (const room of rooms) {
      this.broadcastToRoom(room, "agent:log", enrichedLog);
    }

    // Send to AI service for analysis (if enabled)
    if (process.env.AI_SERVICE_ENABLED === "true") {
      await this.sendToAIService(enrichedLog);
    }
  }

  /**
   * Integrate with existing LogStreamingNamespace
   */
  integrateWithLogStreaming(logEntry) {
    const logsNamespace = webSocketRegistry.getNamespace("/logs");
    if (logsNamespace) {
      // Format log to match LogCollectorService format for consistency
      const formattedLog = {
        id: `agent_bridge_${Date.now()}_${Math.random()}`,
        timestamp: logEntry.timestamp || new Date().toISOString(),
        level: logEntry.level,
        message: logEntry.content || logEntry.message,
        service: "agent",
        source: "agent-bridge",
        agentId: logEntry.agentId,
        // Additional metadata
        metadata: {
          container_id: logEntry.container_id,
          container_name: logEntry.container_name,
          image: logEntry.image,
          agent_source: logEntry.source,
        },
        raw: logEntry.message || logEntry.content,
      };

      // Get the actual Socket.IO namespace instance for proper broadcasting
      const socketIONamespace = logsNamespace.namespace;

      if (socketIONamespace) {
        // Broadcast using the unified log format that clients expect
        socketIONamespace.to("system:all").emit("log:data", {
          streamId: "agent_stream", // Standard agent stream ID
          data: formattedLog.message,
          timestamp: formattedLog.timestamp,
          level: formattedLog.level,
          service: "agent",
          source: "agent-bridge",
          isError:
            formattedLog.level === "error" || formattedLog.level === "critical",
          metadata: formattedLog.metadata,
          agentId: formattedLog.agentId,
        });

        logger.debug("Agent log integrated with LogStreamingNamespace", {
          agentId: logEntry.agentId,
          level: formattedLog.level,
          source: formattedLog.source,
        });
      }
    }
  }

  /**
   * Normalize log levels to standard format
   */
  normalizeLogLevel(level) {
    if (typeof level === "string") {
      return level.toLowerCase();
    }

    // Convert systemd priority levels
    const levels = {
      0: "emergency",
      1: "alert",
      2: "critical",
      3: "error",
      4: "warning",
      5: "notice",
      6: "info",
      7: "debug",
    };

    return levels[level] || "info";
  }

  /**
   * Determine which rooms should receive this log
   */
  determineLogRooms(logEntry) {
    const rooms = [];

    // Admin room - all logs
    rooms.push("admin-logs");

    // Agent-specific room
    rooms.push(`agent-${logEntry.agentId}-logs`);

    // Source-specific rooms
    if (logEntry.source) {
      rooms.push(`${logEntry.source}-logs`);
    }

    // Container-specific rooms (for Docker logs)
    if (logEntry.source === "docker" && logEntry.container_name) {
      // Determine user from container name if possible
      // This would need implementation based on your naming convention
      const userId = this.getUserFromContainerName(logEntry.container_name);
      if (userId) {
        rooms.push(`user-${userId}-logs`);
      }
    }

    return rooms;
  }

  /**
   * Extract user ID from container name
   */
  getUserFromContainerName(containerName) {
    // Implement based on your container naming convention
    // e.g., if containers are named like "user123-myapp-frontend"
    const match = containerName.match(/^user(\d+)-/);
    return match ? match[1] : null;
  }

  /**
   * Initialize log streaming for an agent
   */
  async initializeAgentLogStreaming(agentId, socket) {
    // Request basic log streams
    const defaultStreams = ["system", "docker"];

    for (const streamType of defaultStreams) {
      const streamId = `${agentId}-${streamType}-${Date.now()}`;

      socket.emit("stream_request", {
        type: streamType,
        stream_id: streamId,
        params: {
          auto_start: true,
          buffer_size: 100,
        },
      });

      // Track stream
      this.logStreams.set(streamId, {
        id: streamId,
        agentId,
        type: streamType,
        startedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle stream started confirmation
   */
  handleStreamStarted(socket, data) {
    const streamId = data.stream_id;

    if (this.logStreams.has(streamId)) {
      const stream = this.logStreams.get(streamId);
      stream.status = "active";
      stream.startedAt = new Date().toISOString();
    }

    logger.info("Stream started", {
      streamId,
      type: data.type,
      agentId: data.agent_id,
    });
  }

  /**
   * Handle stream stopped confirmation
   */
  handleStreamStopped(socket, data) {
    const streamId = data.stream_id;

    if (this.logStreams.has(streamId)) {
      this.logStreams.delete(streamId);
    }

    logger.info("Stream stopped", { streamId, agentId: data.agent_id });
  }

  /**
   * Handle stream errors
   */
  handleStreamError(socket, data) {
    logger.error("Stream error from agent", data);

    // Notify clients about stream error
    this.broadcastToClients("agent:stream_error", data);
  }

  /**
   * Handle heartbeat from agent
   */
  handleHeartbeat(socket, data) {
    const agentId = data.agent_id;

    if (this.agentInfo.has(agentId)) {
      const agentInfo = this.agentInfo.get(agentId);
      agentInfo.lastHeartbeat = data.timestamp;
    }
  }

  /**
   * Setup periodic health checks
   */
  setupHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Every minute
  }

  /**
   * Perform health checks on connected agents
   */
  performHealthChecks() {
    const now = Date.now();

    for (const [agentId, socket] of this.connectedAgents) {
      // Send heartbeat request
      socket.emit("heartbeat_request", {
        timestamp: now,
        server_id: "deployio-platform",
      });
    }
  }

  /**
   * Notify clients about agent status changes
   */
  notifyAgentStatusChange(agentId, status, agentInfo = null) {
    this.broadcastToClients("agent:status_change", {
      agentId,
      status,
      agentInfo,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast message to all subscribed clients
   */
  broadcastToClients(event, data) {
    // This would broadcast to the main logs namespace
    const logsNamespace = webSocketRegistry.getNamespace("/logs");
    if (logsNamespace) {
      logsNamespace.emit(event, data);
    }
  }

  /**
   * Broadcast message to specific room
   */
  broadcastToRoom(room, event, data) {
    const logsNamespace = webSocketRegistry.getNamespace("/logs");
    if (logsNamespace) {
      logsNamespace.to(room).emit(event, data);
    }
  }

  /**
   * Send log to AI service for analysis
   */
  async sendToAIService(logEntry) {
    try {
      // Implementation depends on your AI service setup
      // Since AI service is in the same network, this can be a direct HTTP call
      const axios = require("axios");
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://ai-service:8000";

      await axios.post(
        `${aiServiceUrl}/service/v1/analysis/log-entry`,
        {
          log: logEntry,
          source: "agent-bridge",
        },
        {
          headers: {
            "X-Internal-Service": "deployio-backend",
          },
          timeout: 5000,
        }
      );
    } catch (error) {
      logger.debug("Failed to send log to AI service", {
        error: error.message,
      });
    }
  }

  /**
   * Clean up streams for disconnected agent
   */
  cleanupAgentStreams(agentId) {
    for (const [streamId, stream] of this.logStreams) {
      if (stream.agentId === agentId) {
        this.logStreams.delete(streamId);
      }
    }
  }

  /**
   * Get connected agents info
   */
  getConnectedAgents() {
    const agents = [];
    for (const [agentId, agentInfo] of this.agentInfo) {
      agents.push({
        ...agentInfo,
        connected: this.connectedAgents.has(agentId),
      });
    }
    return agents;
  }

  /**
   * Get agent statistics
   */
  getAgentStats() {
    return {
      totalAgents: this.agentInfo.size,
      connectedAgents: this.connectedAgents.size,
      activeStreams: this.logStreams.size,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Get current connection status for debugging
   */
  getConnectionStatus() {
    return {
      connectedAgentsCount: this.connectedAgents.size,
      connectedAgentIds: Array.from(this.connectedAgents.keys()),
      agentInfoCount: this.agentInfo.size,
      logStreamsCount: this.logStreams.size,
      userSubscriptionsCount: this.userSubscriptions.size,
    };
  }
}

module.exports = AgentBridgeNamespace;
