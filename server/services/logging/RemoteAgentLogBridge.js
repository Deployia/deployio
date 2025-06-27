/**
 * Remote Agent Log Bridge
 * Handles real-time log streaming from remote EC2 agent using Socket.IO
 */

const axios = require("axios");
const EventEmitter = require("events");
const { io } = require("socket.io-client");
const logger = require("@config/logger");

class RemoteAgentLogBridge extends EventEmitter {
  constructor(options = {}) {
    super();

    this.agentUrl =
      options.agentUrl || process.env.AGENT_URL || "http://localhost:8001";
    this.agentSecret =
      options.agentSecret || process.env.AGENT_SECRET || "default-secret";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds
    this.isConnected = false;
    this.socket = null;
    this.heartbeatInterval = null;

    // Connection state
    this.connectionState = "disconnected"; // disconnected, connecting, connected, error
    this.lastHeartbeat = null;
    this.connectionStartTime = null;

    // Configuration
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      maxReconnectDelay: 60000, // 60 seconds
    };
  }

  /**
   * Initialize the bridge and attempt connection
   */
  async initialize() {
    logger.info("Initializing Remote Agent Log Bridge", {
      agentUrl: this.agentUrl,
      maxReconnectAttempts: this.maxReconnectAttempts,
    });

    // Try Socket.IO connection first, fallback to HTTP polling
    try {
      await this.connectSocketIO();
    } catch (error) {
      logger.warn("Socket.IO connection failed, falling back to HTTP polling", {
        error: error.message,
      });
      this.startHttpPolling();
    }
  }

  /**
   * Connect to agent using Socket.IO
   */
  async connectSocketIO() {
    if (
      this.connectionState === "connecting" ||
      this.connectionState === "connected"
    ) {
      return;
    }

    this.connectionState = "connecting";
    this.connectionStartTime = new Date();

    logger.info("Attempting Socket.IO connection to agent", {
      url: this.agentUrl,
    });

    try {
      this.socket = io(this.agentUrl + "/logs", {
        auth: {
          token: this.agentSecret,
        },
        timeout: this.config.connectionTimeout,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on("connect", () => {
        this.handleSocketIOConnect();
      });

      this.socket.on("log", (data) => {
        this.handleLogMessage(data);
      });

      this.socket.on("error", (error) => {
        this.handleSocketIOError(error);
      });

      this.socket.on("disconnect", (reason) => {
        this.handleSocketIODisconnect(reason);
      });

      // Connection timeout
      setTimeout(() => {
        if (this.connectionState === "connecting") {
          this.handleConnectionTimeout();
        }
      }, this.config.connectionTimeout);
    } catch (error) {
      this.handleSocketIOError(error);
    }
  }

  /**
   * Handle Socket.IO connection
   */
  handleSocketIOConnect() {
    logger.info("Socket.IO connection to agent established");

    this.connectionState = "connected";
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.lastHeartbeat = new Date();

    // Start heartbeat
    this.startHeartbeat();

    // Subscribe to log streams
    this.subscribeToLogStreams();

    this.emit("connected");
  }

  /**
   * Handle Socket.IO error
   */
  handleSocketIOError(error) {
    logger.error("Socket.IO error with agent", {
      error: error.message,
      connectionState: this.connectionState,
    });

    this.connectionState = "error";
    this.isConnected = false;

    this.emit("error", error);

    // Attempt reconnection
    this.scheduleReconnection();
  }

  /**
   * Handle Socket.IO disconnect
   */
  handleSocketIODisconnect(reason) {
    logger.warn("Socket.IO connection to agent disconnected", {
      reason,
      wasConnected: this.isConnected,
    });

    this.connectionState = "disconnected";
    this.isConnected = false;

    // Stop heartbeat
    this.stopHeartbeat();

    this.emit("disconnected", { code, reason });

    // Attempt reconnection if it wasn't a clean close
    if (code !== 1000) {
      this.scheduleReconnection();
    }
  }

  /**
   * Handle connection timeout
   */
  handleConnectionTimeout() {
    logger.error("Socket.IO connection to agent timed out");

    if (this.socket) {
      this.socket.disconnect();
    }

    this.connectionState = "error";
    this.scheduleReconnection();
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(
        "Max reconnection attempts reached, falling back to HTTP polling",
        {
          attempts: this.reconnectAttempts,
        }
      );
      this.startHttpPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    logger.info("Scheduling Socket.IO reconnection", {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      this.connectSocketIO();
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit("heartbeat", {
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Subscribe to log streams on the agent
   */
  subscribeToLogStreams() {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    // Subscribe to agent system logs
    this.socket.emit("subscribe", {
      streams: ["system", "deployments", "containers"],
      timestamp: new Date().toISOString(),
    });

    logger.info("Subscribed to agent log streams");
  }

  /**
   * Handle log message from agent
   */
  handleLogMessage(logData) {
    const standardizedLog = {
      id:
        logData.id ||
        `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: logData.timestamp || new Date().toISOString(),
      level: (logData.level || "info").toLowerCase(),
      message: logData.message || "",
      service: "agent",
      source: "remote-agent",
      metadata: {
        ...logData.metadata,
        agentUrl: this.agentUrl,
        bridge: "socket.io",
      },
      raw: logData.raw || logData.message,
    };

    this.emit("log", standardizedLog);
  }

  /**
   * Handle deployment log from agent
   */
  handleDeploymentLog(logData) {
    const standardizedLog = {
      id:
        logData.id ||
        `deployment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: logData.timestamp || new Date().toISOString(),
      level: (logData.level || "info").toLowerCase(),
      message: logData.message || "",
      service: "agent-deployment",
      source: "remote-agent",
      metadata: {
        ...logData.metadata,
        deploymentId: logData.deploymentId,
        projectId: logData.projectId,
        userId: logData.userId,
        containerId: logData.containerId,
        agentUrl: this.agentUrl,
        bridge: "websocket",
      },
      raw: logData.raw || logData.message,
    };

    this.emit("deployment_log", standardizedLog);
  }

  /**
   * Handle heartbeat response
   */
  handleHeartbeat(heartbeatData) {
    this.lastHeartbeat = new Date();
    this.emit("heartbeat", heartbeatData);
  }

  /**
   * Handle remote error
   */
  handleRemoteError(errorData) {
    logger.error("Remote error from agent", errorData);
    this.emit("remote_error", errorData);
  }

  /**
   * Start HTTP polling as fallback
   */
  startHttpPolling() {
    logger.info("Starting HTTP polling for agent logs");

    this.httpPollingInterval = setInterval(async () => {
      try {
        await this.pollAgentLogs();
      } catch (error) {
        logger.error("HTTP polling failed", { error: error.message });
      }
    }, 10000); // Poll every 10 seconds
  }

  /**
   * Poll agent logs via HTTP
   */
  async pollAgentLogs() {
    try {
      const response = await axios.get(`${this.agentUrl}/agent/v1/logs`, {
        params: {
          lines: 10,
          since:
            this.lastPollTime || new Date(Date.now() - 60000).toISOString(),
        },
        timeout: 5000,
        headers: {
          Authorization: `Bearer ${this.agentSecret}`,
          "User-Agent": "DeployIO-LogBridge-HTTP/1.0",
        },
      });

      const logs = response.data.logs || [];
      for (const log of logs) {
        this.handleLogMessage(log);
      }

      this.lastPollTime = new Date().toISOString();
      this.emit("poll_success", { logs: logs.length });
    } catch (error) {
      this.emit("poll_error", error);
      throw error;
    }
  }

  /**
   * Request deployment logs for specific deployment
   */
  async requestDeploymentLogs(deploymentId, options = {}) {
    if (this.socket && this.socket.connected) {
      // Use Socket.IO for real-time streaming
      this.socket.emit("subscribe_deployment", {
        deploymentId,
        options,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Use HTTP for one-time fetch
      try {
        const response = await axios.get(
          `${this.agentUrl}/agent/v1/deployments/${deploymentId}/logs`,
          {
            params: options,
            headers: {
              Authorization: `Bearer ${this.agentSecret}`,
            },
          }
        );
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch deployment logs: ${error.message}`);
      }
    }
  }

  /**
   * Get bridge status
   */
  getStatus() {
    return {
      connectionState: this.connectionState,
      isConnected: this.isConnected,
      agentUrl: this.agentUrl,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      connectionStartTime: this.connectionStartTime,
      uptime: this.connectionStartTime
        ? new Date() - this.connectionStartTime
        : 0,
      socket: {
        connected: this.socket ? this.socket.connected : false,
        id: this.socket ? this.socket.id : null,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Close the bridge connection
   */
  async close() {
    logger.info("Closing Remote Agent Log Bridge");

    // Stop heartbeat
    this.stopHeartbeat();

    // Stop HTTP polling
    if (this.httpPollingInterval) {
      clearInterval(this.httpPollingInterval);
      this.httpPollingInterval = null;
    }

    // Close Socket.IO connection
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionState = "disconnected";
    this.isConnected = false;

    this.emit("closed");
  }
}

module.exports = RemoteAgentLogBridge;
