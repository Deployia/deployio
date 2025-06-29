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
  }

  async start(options = {}) {
    await super.start(options);

    // Always use HTTP polling for now
    this.startHttpPolling();
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
    const { lines = 50, level = "info" } = options;

    try {
      logger.debug("Fetching logs from remote agent", {
        agentUrl: this.agentUrl,
        lines,
        level,
      });

      // Try to get logs from agent service
      const response = await agentServiceClient.getLogs(lines, level);

      if (response && response.logs) {
        logger.debug(`Retrieved ${response.logs.length} logs from agent`);
        this.reconnectAttempts = 0; // Reset on successful connection

        return {
          logs: response.logs.map((log) => ({
            id: log.id || `agent_${Date.now()}_${Math.random()}`,
            timestamp: log.timestamp || new Date().toISOString(),
            level: log.level || "info",
            message: log.message || "",
            service: "agent",
            source: "agent-service",
            metadata: log.metadata || {},
            raw: log.raw || log.message,
          })),
          source: "remote-agent",
          timestamp: new Date().toISOString(),
        };
      } else {
        // Try fallback to local agent logs if remote fails
        return await this.getLocalAgentLogs(lines, level);
      }
    } catch (error) {
      logger.error("Failed to fetch logs from remote agent:", error.message);

      // Fallback to local agent logs
      try {
        return await this.getLocalAgentLogs(lines, level);
      } catch (fallbackError) {
        logger.error(
          "Fallback to local agent logs also failed:",
          fallbackError.message
        );
        return {
          logs: [],
          source: "error",
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  async getLocalAgentLogs(lines, level) {
    // Try multiple potential log paths for agent
    const logPaths = [
      path.join(process.cwd(), "..", "agent", "logs", "agent.log"),
      path.join(process.cwd(), "agent", "logs", "agent.log"),
      path.join(process.cwd(), "logs", "agent.log"),
      "/var/log/deployio-agent.log",
    ];

    for (const logPath of logPaths) {
      try {
        if (fs.existsSync(logPath)) {
          logger.debug(`Using local agent log file: ${logPath}`);

          const { stdout } = await execPromise(
            `tail -n ${lines} "${logPath}" | grep -E "(${level}|error|warn|info)" || echo ""`
          );

          const logs = stdout
            .trim()
            .split("\n")
            .filter((line) => line.trim())
            .map((line, index) => {
              // Simple log parsing - adjust format as needed
              const timestamp = new Date().toISOString();
              return {
                id: `agent_local_${Date.now()}_${index}`,
                timestamp,
                level: line.includes("ERROR")
                  ? "error"
                  : line.includes("WARN")
                  ? "warn"
                  : line.includes("INFO")
                  ? "info"
                  : "debug",
                message: line,
                service: "agent",
                source: "local-file",
                metadata: { filePath: logPath },
                raw: line,
              };
            });

          return {
            logs,
            source: "local-agent-file",
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        logger.debug(
          `Failed to read agent log file ${logPath}:`,
          error.message
        );
        continue;
      }
    }

    // No log files found
    logger.warn("No agent log files found in any of the expected locations");
    return {
      logs: [],
      source: "no-agent-logs",
      timestamp: new Date().toISOString(),
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
