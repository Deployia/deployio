/**
 * Agent Log Collector for Remote EC2 Service
 * Handles remote agent log collection via WebSocket (primary) and HTTP polling (fallback)
 */

const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const logger = require("@config/logger");
const BaseLogCollector = require("./BaseLogCollector");
const { agentServiceClient } = require("../agentServiceClient");
const AgentBridgeNamespace = require("@websockets/namespaces/AgentBridgeNamespace");

const execPromise = util.promisify(exec);

class AgentLogCollector extends BaseLogCollector {
  constructor() {
    super("agent");
    this.agentUrl = process.env.AGENT_URL || "http://localhost:5000";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pollingInterval = null;
    this.webSocketConnected = false;
    this.agentBridgeNamespace = null;
    this.lastLogId = null; // Track last seen log ID for HTTP polling deduplication
    this.logBuffer = new Set(); // Buffer to track processed logs and avoid duplicates
  }

  async start(options = {}) {
    await super.start(options);

    const { realtime = false } = options;

    if (realtime) {
      // Try WebSocket first, fallback to HTTP polling if not available
      const webSocketSuccess = await this.tryWebSocketConnection();
      if (!webSocketSuccess) {
        logger.warn(
          "WebSocket connection failed, falling back to HTTP polling"
        );
        this.startHttpPolling();
      }
    }
  }

  /**
   * Try to establish WebSocket connection for real-time log streaming
   */
  async tryWebSocketConnection() {
    try {
      // Get the agent bridge namespace instance
      this.agentBridgeNamespace = AgentBridgeNamespace.getInstance();

      if (!this.agentBridgeNamespace) {
        logger.warn("Agent bridge namespace not available");
        return false;
      }

      // Setup WebSocket subscription regardless of current agent status
      this.setupWebSocketSubscription();

      // Check if any agents are currently connected
      const connectedAgents = this.agentBridgeNamespace.connectedAgents;
      if (connectedAgents && connectedAgents.size > 0) {
        this.webSocketConnected = true;
        logger.info(
          "Successfully connected to agent WebSocket stream (agents already connected)"
        );
        return true;
      } else {
        // No agents connected yet, but keep the subscription active
        // The event handlers will activate streaming when an agent connects
        logger.info(
          "WebSocket subscription active, waiting for agent connection"
        );
        return false; // Return false so HTTP polling starts as fallback
      }
    } catch (error) {
      logger.error("Failed to establish WebSocket connection:", error);
      return false;
    }
  }

  /**
   * Setup WebSocket subscription for agent logs
   */
  setupWebSocketSubscription() {
    // Store handler references for proper cleanup
    this.handleWebSocketLog = (logData) => {
      this.processWebSocketLog(logData);
    };

    this.handleAgentConnected = (data) => {
      logger.info("Agent connected, WebSocket log streaming available");
      this.webSocketConnected = true;
      // Stop HTTP polling if it's running
      this.stopHttpPolling();
    };

    this.handleAgentDisconnected = (data) => {
      logger.warn("Agent disconnected, falling back to HTTP polling");
      this.webSocketConnected = false;
      // Start HTTP polling as fallback
      this.startHttpPolling();
    };

    // Listen for processed logs from the agent bridge
    this.agentBridgeNamespace.on("agent:log", this.handleWebSocketLog);

    // Listen for agent connection status changes
    this.agentBridgeNamespace.on("agent:connected", this.handleAgentConnected);
    this.agentBridgeNamespace.on(
      "agent:disconnected",
      this.handleAgentDisconnected
    );
  }

  /**
   * Handle logs received via WebSocket
   */
  processWebSocketLog(logData) {
    try {
      // Convert WebSocket log format to collector format
      const processedLog = {
        id: logData.id || `agent_ws_${Date.now()}_${Math.random()}`,
        timestamp: logData.timestamp || new Date().toISOString(),
        level: logData.level || "info",
        message: logData.message || logData.content || "",
        service: "agent",
        source: "websocket-agent",
        metadata: logData,
        raw: logData.raw || logData.message || logData.content,
        agentId: logData.agentId,
      };

      // Check for duplicates
      if (!this.logBuffer.has(processedLog.id)) {
        this.logBuffer.add(processedLog.id);

        // Emit the log to subscribers
        this.emit("log", processedLog);

        // Clean up old log IDs from buffer (keep last 1000)
        if (this.logBuffer.size > 1000) {
          const bufferArray = Array.from(this.logBuffer);
          this.logBuffer = new Set(bufferArray.slice(-1000));
        }
      }
    } catch (error) {
      logger.error("Error processing WebSocket log:", error);
    }
  }

  async startRemoteConnection() {
    // This method is now replaced by tryWebSocketConnection
    await this.tryWebSocketConnection();
  }

  startHttpPolling() {
    // Don't start polling if WebSocket is connected
    if (this.webSocketConnected) {
      return;
    }

    // Don't start if already polling
    if (this.pollingInterval) {
      return;
    }

    logger.info("Starting HTTP polling for agent logs");

    this.pollingInterval = setInterval(async () => {
      try {
        // Skip polling if WebSocket connection is established
        if (this.webSocketConnected) {
          this.stopHttpPolling();
          return;
        }

        const logs = await this.getRecentLogs({ lines: 10 });

        // Process and emit new logs
        if (logs.logs && logs.logs.length > 0) {
          for (const log of logs.logs) {
            // Check for duplicates using log content and timestamp
            const logKey = `${log.timestamp}_${log.message}`;
            if (!this.logBuffer.has(logKey)) {
              this.logBuffer.add(logKey);

              // Mark as HTTP polling source
              const httpLog = {
                ...log,
                source: "http-polling-agent",
              };

              this.emit("log", httpLog);

              // Clean up old log keys from buffer
              if (this.logBuffer.size > 1000) {
                const bufferArray = Array.from(this.logBuffer);
                this.logBuffer = new Set(bufferArray.slice(-1000));
              }
            }
          }
        }
      } catch (error) {
        logger.error("Agent HTTP polling failed:", error);

        // Increment reconnection attempts
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error(
            "Max reconnection attempts reached, stopping HTTP polling"
          );
          this.stopHttpPolling();
        }
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Stop HTTP polling
   */
  stopHttpPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      logger.info("Stopped HTTP polling for agent logs");
    }
  }

  async getRecentLogs(options = {}) {
    const { lines = 50, level = "all", user } = options;
    try {
      // Use the agentServiceClient with user context if provided
      const response = await agentServiceClient.get("/logs", {
        params: { lines, level },
        user, // Pass user context for per-user JWT, or omit for system
      });
      const agentLogs = response.data.logs || [];
      const parsedLogs = agentLogs.map((log, index) => ({
        id: `agent_remote_${Date.now()}_${index}`,
        timestamp: log.timestamp || new Date().toISOString(),
        level: log.level || "info",
        message: log.message || "",
        service: "agent",
        source: "remote-agent",
        metadata: log,
        raw: log.raw || log.message,
      }));
      return {
        logs: parsedLogs,
        totalLines: parsedLogs.length,
        source: "remote-agent",
        url: this.agentUrl,
      };
    } catch (error) {
      logger.error("Failed to fetch remote agent logs:", error);
      return {
        logs: [],
        totalLines: 0,
        source: "remote-agent-error",
        url: this.agentUrl,
        error: error.response
          ? error.response.data
          : error.message || error.toString(),
        status: error.response ? error.response.status : undefined,
      };
    }
  }

  async getLocalAgentLogs(lines, level) {
    const localPaths = [
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "agent",
        "logs",
        "agent.log"
      ),
      "/app/logs/agent.log",
    ];

    for (const logPath of localPaths) {
      if (fs.existsSync(logPath)) {
        try {
          const command = `tail -n ${lines} "${logPath}"`;
          const { stdout } = await execPromise(command);

          const logLines = stdout
            .trim()
            .split("\n")
            .filter((line) => line.trim());
          const parsedLogs = logLines.map((line, index) => ({
            id: `agent_local_${Date.now()}_${index}`,
            timestamp: new Date().toISOString(),
            level: "info",
            message: line,
            service: "agent",
            source: "local-fallback",
            raw: line,
          }));

          return {
            logs: parsedLogs,
            totalLines: parsedLogs.length,
            source: "local-fallback",
            path: logPath,
          };
        } catch (error) {
          logger.error(
            `Failed to read local agent logs from ${logPath}:`,
            error
          );
        }
      }
    }

    return {
      logs: [],
      totalLines: 0,
      source: "agent-unavailable",
      error: "Agent logs not available locally or remotely",
    };
  }

  async stop() {
    await super.stop();

    // Stop HTTP polling
    this.stopHttpPolling();

    // Clean up WebSocket subscriptions safely
    if (this.agentBridgeNamespace) {
      try {
        // Only remove listeners if they were actually set
        if (this.handleWebSocketLog) {
          this.agentBridgeNamespace.off("agent:log", this.handleWebSocketLog);
        }
        if (this.handleAgentConnected) {
          this.agentBridgeNamespace.off(
            "agent:connected",
            this.handleAgentConnected
          );
        }
        if (this.handleAgentDisconnected) {
          this.agentBridgeNamespace.off(
            "agent:disconnected",
            this.handleAgentDisconnected
          );
        }
      } catch (error) {
        logger.warn("Error removing event listeners:", error.message);
      }
    }

    // Reset state
    this.webSocketConnected = false;
    this.reconnectAttempts = 0;
    this.logBuffer.clear();

    logger.info("Agent log collector stopped");
  }

  /**
   * Get connection status for monitoring
   */
  getConnectionStatus() {
    return {
      webSocketConnected: this.webSocketConnected,
      httpPollingActive: !!this.pollingInterval,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      bufferSize: this.logBuffer.size,
    };
  }
}

module.exports = AgentLogCollector;
