/**
 * Agent Log Collector for Remote EC2 Service
 * Handles remote agent log collection via HTTP polling
 */

const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const logger = require("@config/logger");
const BaseLogCollector = require("./BaseLogCollector");
const { agentServiceClient } = require("../agentServiceClient");

const execPromise = util.promisify(exec);

class AgentLogCollector extends BaseLogCollector {
  constructor() {
    super("agent");
    this.agentUrl = process.env.AGENT_URL || "http://localhost:5000";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pollingInterval = null;
    this.lastLogId = null; // Track last seen log ID for HTTP polling deduplication
    this.logBuffer = new Set(); // Buffer to track processed logs and avoid duplicates
    this.bridgeService = null; // Will be injected
    this.useWebSocketBridge = true; // Prefer WebSocket bridge over HTTP polling
  }

  /**
   * Set the agent bridge service for WebSocket communication
   */
  setBridgeService(bridgeService) {
    this.bridgeService = bridgeService;

    // Listen for agent ready events
    this.bridgeService.on("agent_ready", (agentId, agentData) => {
      this.handleAgentReady(agentId, agentData);
    });

    // Listen for agent logs from the bridge
    this.bridgeService.on("agent_logs", (agentId, logData) => {
      this.handleBridgeLogData(agentId, logData);
    });

    logger.info("✅ Agent Log Collector integrated with WebSocket bridge", {
      bridgeIntegrated: true,
      eventsListening: ["agent_ready", "agent_logs"],
    });
  }

  /**
   * Handle agent ready event from bridge
   */
  handleAgentReady(agentId, agentData) {
    logger.info("🚀 Agent ready for log streaming", {
      agentId,
      capabilities: agentData.capabilities,
      connectionTime: agentData.connectionInfo?.connectedAt,
    });

    // Auto-start log collection for ready agents
    if (agentData.capabilities?.logs) {
      this.requestAgentLogs(agentId, {
        type: "system",
        lines: 100,
        autoStart: true,
      });
    }
  }

  async start(options = {}) {
    await super.start(options);

    // Try WebSocket bridge first, fall back to HTTP polling
    if (this.useWebSocketBridge && this.bridgeService) {
      logger.info("Starting agent log collection via WebSocket bridge");
      this.startBridgeLogging();
    } else {
      logger.info(
        "WebSocket bridge not available, falling back to HTTP polling"
      );
      this.startHttpPolling();
    }
  }

  /**
   * Start log collection via WebSocket bridge
   */
  startBridgeLogging() {
    if (!this.bridgeService) {
      logger.error("Bridge service not available for agent log collection");
      this.startHttpPolling();
      return;
    }

    logger.info("Agent log collection via WebSocket bridge started");

    // Listen for agent log streams
    this.bridgeService.on("agent_logs", (agentId, logData) => {
      this.handleBridgeLogData(agentId, logData);
    });
  }

  /**
   * Handle log data received via WebSocket bridge
   */
  handleBridgeLogData(agentId, logData) {
    try {
      const { logs, log_type, timestamp, room } = logData;

      logger.debug("📨 Received log data via bridge", {
        agentId,
        logType: log_type,
        logCount: Array.isArray(logs) ? logs.length : 1,
        room,
        bridgeTimestamp: timestamp,
      });

      if (logs && Array.isArray(logs)) {
        for (const log of logs) {
          const bridgeLog = {
            ...log,
            source: "websocket-bridge-agent",
            agent_id: agentId,
            bridge_timestamp: timestamp,
            log_type: log_type || "system",
            bridge_room: room,
            processed_at: new Date().toISOString(),
          };

          // Process and emit the log
          this.emitLog(bridgeLog);
        }

        // Log successful processing
        logger.info("✅ Processed agent logs via bridge", {
          agentId,
          processedCount: logs.length,
          logType: log_type,
          room,
        });
      } else if (logs) {
        // Single log entry
        const bridgeLog = {
          ...logs,
          source: "websocket-bridge-agent",
          agent_id: agentId,
          bridge_timestamp: timestamp,
          log_type: log_type || "system",
          bridge_room: room,
          processed_at: new Date().toISOString(),
        };

        this.emitLog(bridgeLog);

        logger.debug("✅ Processed single agent log via bridge", {
          agentId,
          logType: log_type,
          room,
        });
      }
    } catch (error) {
      logger.error("❌ Error processing bridge log data", {
        error: error.message,
        agentId,
        logDataKeys: Object.keys(logData || {}),
      });
    }
  }

  /**
   * Request logs from specific agent via bridge
   */
  async requestAgentLogs(agentId, options = {}) {
    if (!this.bridgeService) {
      logger.warning("Bridge service not available, cannot request agent logs");
      return null;
    }

    try {
      const { lines = 50, type = "system", autoStart = false } = options;

      logger.info("📤 Requesting logs from agent via bridge", {
        agentId,
        type,
        lines,
        autoStart,
        requestTime: new Date().toISOString(),
      });

      const result = await this.bridgeService.requestAgentLogs(agentId, {
        type,
        lines,
        timestamp: new Date().toISOString(),
      });

      if (result) {
        logger.info("✅ Agent log request successful", {
          agentId,
          requestId: result.requestId,
          status: result.status,
        });
      }

      return result;
    } catch (error) {
      logger.error("❌ Failed to request agent logs via bridge", {
        error: error.message,
        agentId,
        options,
      });
      return null;
    }
  }

  startHttpPolling() {
    // Don't start if already polling
    if (this.pollingInterval) {
      return;
    }

    logger.info("Starting HTTP polling for agent logs");

    this.pollingInterval = setInterval(async () => {
      try {
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
            `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping HTTP polling.`
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
      logger.info("HTTP polling stopped");
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
    this.stopHttpPolling();
    await super.stop();
  }

  /**
   * Get connection status for monitoring
   */
  getConnectionStatus() {
    return {
      httpPollingActive: !!this.pollingInterval,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      bufferSize: this.logBuffer.size,
    };
  }
}

module.exports = AgentLogCollector;
