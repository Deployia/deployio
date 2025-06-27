/**
 * Remote Agent Log Bridge - Integration with Agent Bridge Namespace
 * Coordinates with the AgentBridgeNamespace for real-time log streaming
 * Provides seamless integration between agent logs and existing log streaming infrastructure
 */

const EventEmitter = require("events");
const logger = require("@config/logger");
const webSocketRegistry = require("@websockets/core/WebSocketRegistry");

class RemoteAgentLogBridge extends EventEmitter {
  constructor(options = {}) {
    super();

    this.agentId = options.agentId || "agent-ec2-2";
    this.isInitialized = false;
    this.agentBridgeNamespace = null;
    this.connectedAgents = new Map();
    this.logSubscriptions = new Map(); // userId -> subscriptions

    // Configuration
    this.config = {
      enableLogProcessing: true,
      enableAIAnalysis: true,
      bufferSize: 1000,
      batchSize: 50,
    };
  }

  /**
   * Initialize the enhanced bridge
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    logger.info("Initializing Remote Agent Log Bridge");

    try {
      // Get the agent bridge namespace
      this.agentBridgeNamespace =
        webSocketRegistry.getNamespace("/agent-bridge");

      if (!this.agentBridgeNamespace) {
        throw new Error(
          "Agent bridge namespace not found. Make sure it's initialized first."
        );
      }

      // Setup integration with agent bridge namespace
      this.setupAgentBridgeIntegration();

      this.isInitialized = true;
      logger.info("Enhanced Remote Agent Log Bridge initialized successfully");

      this.emit("initialized");
    } catch (error) {
      logger.error("Failed to initialize Enhanced Remote Agent Log Bridge", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup integration with agent bridge namespace
   */
  setupAgentBridgeIntegration() {
    // Listen for agent status changes
    this.agentBridgeNamespace.on("agent:status_change", (data) => {
      this.handleAgentStatusChange(data);
    });

    // Listen for agent log entries
    this.agentBridgeNamespace.on("agent:log", (data) => {
      this.handleAgentLog(data);
    });

    // Listen for agent connection/disconnection
    this.agentBridgeNamespace.on("agent:connected", (data) => {
      this.handleAgentConnected(data);
    });

    this.agentBridgeNamespace.on("agent:disconnected", (data) => {
      this.handleAgentDisconnected(data);
    });

    logger.info("Agent bridge integration setup complete");
  }

  /**
   * Handle agent status changes
   */
  handleAgentStatusChange(data) {
    const { agentId, status, agentInfo } = data;

    logger.debug("Agent status changed", { agentId, status: status });

    // Update connected agents map
    if (status === "connected" && agentInfo) {
      this.connectedAgents.set(agentId, {
        id: agentId,
        info: agentInfo,
        connectedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
    } else if (status === "disconnected") {
      this.connectedAgents.delete(agentId);
    }

    // Emit to subscribers
    this.emit("agent:status", {
      agentId,
      status,
      timestamp: new Date().toISOString(),
      connectedAgents: this.getConnectedAgentsCount(),
    });
  }

  /**
   * Handle agent connection
   */
  handleAgentConnected(data) {
    logger.info("Agent connected to bridge", { agentId: data.agentId });

    this.emit("agent:connected", {
      agentId: data.agentId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle agent disconnection
   */
  handleAgentDisconnected(data) {
    logger.info("Agent disconnected from bridge", { agentId: data.agentId });

    this.emit("agent:disconnected", {
      agentId: data.agentId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle incoming agent logs
   */
  handleAgentLog(logData) {
    const { agentId } = logData;

    // Process and enrich log
    const processedLog = this.processLog(logData);

    // Emit to local subscribers
    this.emit("log", processedLog);

    // Route to specific log handlers based on source
    this.routeLog(processedLog);

    logger.debug("Agent log processed", {
      agentId,
      source: logData.source,
      timestamp: logData.timestamp,
    });
  }

  /**
   * Process and enrich log entry
   */
  processLog(logData) {
    return {
      ...logData,
      processedAt: new Date().toISOString(),
      bridgeId: "enhanced-remote-agent-bridge",
      enriched: {
        level: this.normalizeLogLevel(logData.level),
        category: this.categorizeLog(logData),
        severity: this.calculateSeverity(logData),
      },
    };
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
   * Categorize log based on content and source
   */
  categorizeLog(logData) {
    const { source, service, message } = logData;

    if (source === "docker") {
      return "container";
    }

    if (source === "system") {
      if (service && service.includes("docker")) {
        return "docker-system";
      }
      if (service && service.includes("ssh")) {
        return "security";
      }
      return "system";
    }

    if (message) {
      if (message.includes("error") || message.includes("failed")) {
        return "error";
      }
      if (message.includes("warning") || message.includes("warn")) {
        return "warning";
      }
    }

    return "general";
  }

  /**
   * Calculate log severity score
   */
  calculateSeverity(logData) {
    const level = this.normalizeLogLevel(logData.level);
    const severityMap = {
      emergency: 10,
      alert: 9,
      critical: 8,
      error: 7,
      warning: 5,
      notice: 3,
      info: 2,
      debug: 1,
    };

    return severityMap[level] || 2;
  }

  /**
   * Route log to appropriate handlers
   */
  routeLog(logData) {
    const { source, enriched } = logData;

    // Route to source-specific handlers
    switch (source) {
      case "docker":
        this.emit("docker:log", logData);
        break;
      case "system":
        this.emit("system:log", logData);
        break;
      case "deployment":
        this.emit("deployment:log", logData);
        break;
    }

    // Route to severity-specific handlers
    if (enriched.severity >= 7) {
      this.emit("critical:log", logData);
    } else if (enriched.severity >= 5) {
      this.emit("warning:log", logData);
    }

    // Route to category-specific handlers
    this.emit(`${enriched.category}:log`, logData);
  }

  /**
   * Subscribe to logs for a specific user
   */
  subscribeUserToLogs(userId, filters = {}) {
    if (!this.logSubscriptions.has(userId)) {
      this.logSubscriptions.set(userId, new Set());
    }

    const subscription = {
      userId,
      filters,
      subscribedAt: new Date().toISOString(),
    };

    this.logSubscriptions.get(userId).add(subscription);

    logger.info("User subscribed to agent logs", { userId, filters });

    return subscription;
  }

  /**
   * Unsubscribe user from logs
   */
  unsubscribeUserFromLogs(userId, subscriptionId = null) {
    if (subscriptionId) {
      // Remove specific subscription
      const userSubs = this.logSubscriptions.get(userId);
      if (userSubs) {
        userSubs.delete(subscriptionId);
        if (userSubs.size === 0) {
          this.logSubscriptions.delete(userId);
        }
      }
    } else {
      // Remove all subscriptions for user
      this.logSubscriptions.delete(userId);
    }

    logger.info("User unsubscribed from agent logs", { userId });
  }

  /**
   * Get connected agents count
   */
  getConnectedAgentsCount() {
    return this.connectedAgents.size;
  }

  /**
   * Get connected agents info
   */
  getConnectedAgents() {
    return Array.from(this.connectedAgents.values());
  }

  /**
   * Get bridge status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      connectedAgents: this.getConnectedAgentsCount(),
      totalSubscriptions: this.logSubscriptions.size,
      config: this.config,
      uptime: process.uptime(),
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Request specific log stream from agent
   */
  async requestLogStream(agentId, streamType, params = {}) {
    if (!this.agentBridgeNamespace) {
      throw new Error("Agent bridge namespace not available");
    }

    const streamId = `${agentId}-${streamType}-${Date.now()}`;

    // Send stream request to agent via namespace
    this.agentBridgeNamespace.to(agentId).emit("stream_request", {
      type: streamType,
      stream_id: streamId,
      params,
    });

    logger.info("Log stream requested", { agentId, streamType, streamId });

    return streamId;
  }

  /**
   * Stop log stream
   */
  async stopLogStream(agentId, streamId) {
    if (!this.agentBridgeNamespace) {
      throw new Error("Agent bridge namespace not available");
    }

    this.agentBridgeNamespace.to(agentId).emit("stream_stop", {
      stream_id: streamId,
    });

    logger.info("Log stream stop requested", { agentId, streamId });
  }

  /**
   * Get bridge statistics
   */
  getStatistics() {
    return {
      bridge: {
        initialized: this.isInitialized,
        uptime: process.uptime(),
      },
      agents: {
        connected: this.getConnectedAgentsCount(),
        total: this.connectedAgents.size,
      },
      subscriptions: {
        active: this.logSubscriptions.size,
        total: Array.from(this.logSubscriptions.values()).reduce(
          (total, userSubs) => total + userSubs.size,
          0
        ),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send health check to all connected agents
   */
  async healthCheckAgents() {
    if (!this.agentBridgeNamespace) {
      return { error: "Agent bridge namespace not available" };
    }

    const results = {};

    for (const agentId of this.connectedAgents.keys()) {
      this.agentBridgeNamespace.to(agentId).emit("health_check", {
        timestamp: Date.now(),
        requestId: `health-${Date.now()}`,
      });

      results[agentId] = "request_sent";
    }

    return results;
  }
}

// Export the class for instantiation
module.exports = RemoteAgentLogBridge;
