/**
 * Agent Log Collector for Remote EC2 Service
 * Handles remote agent log collection via HTTP and WebSocket
 */

const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const logger = require("@config/logger");
const BaseLogCollector = require("./BaseLogCollector");

const execPromise = util.promisify(exec);

class AgentLogCollector extends BaseLogCollector {
  constructor() {
    super("agent");
    this.agentUrl = process.env.AGENT_URL || "http://localhost:8001";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pollingInterval = null;
  }

  async start(options = {}) {
    await super.start(options);

    const { realtime = false } = options;

    if (realtime) {
      await this.startRemoteConnection();
    }
  }

  async startRemoteConnection() {
    // TODO: Implement WebSocket connection to remote agent
    // For now, we'll use HTTP polling as fallback
    this.startHttpPolling();
  }

  startHttpPolling() {
    this.pollingInterval = setInterval(async () => {
      try {
        const logs = await this.getRecentLogs({ lines: 10 });
        // Emit any new logs found
        // This is a simple implementation - in production, we'd track last seen log ID
      } catch (error) {
        logger.error("Agent HTTP polling failed:", error);
      }
    }, 5000); // Poll every 5 seconds
  }

  async getRecentLogs(options = {}) {
    const { lines = 50, level = "all" } = options;

    try {
      const response = await axios.get(`${this.agentUrl}/agent/v1/logs`, {
        params: { lines, level },
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${
            process.env.AGENT_SECRET || "default-secret"
          }`,
          "User-Agent": "LogCollector/1.0",
        },
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
      // Fallback to local agent logs if available
      return await this.getLocalAgentLogs(lines, level);
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

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

module.exports = AgentLogCollector;
