/**
 * Agent Log Collector for Remote EC2 Service
 *
 * ROLE CLARIFICATION (Updated Architecture):
 * - Handles HTTP polling fallback when WebSocket unavailable
 * - Manages historical log requests (not live streaming)
 * - Provides local file-based agent logs
 *
 * NOTE: Live agent logs via WebSocket are now handled directly by
 * StreamRouter in AgentBridgeService to avoid duplicate processing.
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

    // Setup event handlers for live streaming
    if (this.bridgeService) {
      // Handle live log streams from agents - NOTE: These are now handled directly
      // by StreamRouter in AgentBridgeService to avoid duplicate processing.
      // AgentLogCollector only handles HTTP fallback and historical logs.

      // Keep stream control event handlers
      this.bridgeService.on(
        "log_stream_started",
        this.handleStreamStarted.bind(this)
      );
      this.bridgeService.on(
        "log_stream_stopped",
        this.handleStreamStopped.bind(this)
      );

      logger.info(
        "Stream control event handlers registered with bridge service"
      );
    }
  }

  /**
   * Handle agent ready event from bridge
   */
  handleAgentReady(agentId, agentData) {
    logger.info("Agent ready for log streaming", {
      agentId,
      capabilities: agentData.capabilities,
      connectionTime: agentData.connectionInfo?.connectedAt,
    });

    // If log collection is already active and realtime, start streaming from this agent
    if (this.isActive && agentData.capabilities?.logs) {
      logger.info(
        "Agent collector is active - starting realtime streaming for new agent",
        {
          agentId,
        }
      );

      // Request initial logs and start realtime streaming
      this.requestAgentLogs(agentId, {
        type: "system",
        lines: 50,
        autoStart: true,
      });

      // Also start realtime streaming if collector is in realtime mode
      this.requestRealtimeStreaming(agentId, {
        type: "system",
        autoStart: true,
      }).catch((error) => {
        logger.error("Failed to start realtime streaming for new agent", {
          agentId,
          error: error.message,
        });
      });
    }
  }

  async start(options = {}) {
    await super.start(options);

    const { realtime = false, agentId = null } = options;

    logger.info("Starting AgentLogCollector", {
      realtime,
      agentId,
      useWebSocketBridge: this.useWebSocketBridge,
      bridgeAvailable: !!this.bridgeService,
      role: "http_fallback_and_historical_logs",
    });

    // Use WebSocket bridge for stream control, HTTP for fallback
    if (this.useWebSocketBridge && this.bridgeService) {
      logger.info("WebSocket bridge available for agent communication");
      this.startBridgeLogging();

      // NOTE: Live streaming is now handled directly by StreamRouter
      // AgentLogCollector focuses on HTTP fallback and historical requests
      if (realtime) {
        logger.info(
          "Requesting realtime log streaming from agents (via StreamRouter)"
        );
        await this.requestRealtimeFromAllAgents(options);
      }
    } else {
      logger.info(
        "WebSocket bridge not available, using HTTP polling fallback"
      );
      this.startHttpPolling();
    }
  }

  /**
   * Request realtime streaming from a specific agent
   * Integrates with unified /streams endpoint
   */
  async requestRealtimeStreaming(agentId, options = {}) {
    if (!this.bridgeService) {
      throw new Error("Bridge service not available for realtime streaming");
    }

    const streamRequest = {
      type: options.type || "system",
      autoStart: true,
      lines: options.lines || 50,
      realtime: true,
      timestamp: new Date().toISOString(),
      streamId: options.streamId || `agent_${agentId}_${Date.now()}`,
      ...options,
    };

    logger.info("Requesting realtime log streaming from agent via bridge", {
      agentId,
      streamRequest,
    });

    try {
      // Send start stream request to agent
      await this.bridgeService.sendToAgent(
        agentId,
        "start_log_stream",
        streamRequest
      );

      return {
        success: true,
        agentId,
        streamType: streamRequest.type,
        streamId: streamRequest.streamId,
        message: "Realtime stream requested successfully",
      };
    } catch (error) {
      logger.error("Failed to request realtime streaming", {
        error: error.message,
        agentId,
      });
      throw error;
    }
  }
  /**
   * Request realtime streaming from all connected agents
   */
  async requestRealtimeFromAllAgents(options = {}) {
    if (!this.bridgeService) {
      logger.warning("Bridge service not available for realtime streaming");
      return;
    }

    try {
      // Get all connected agents from the bridge service
      const bridgeStatus = this.bridgeService.getStatus();
      const connectedAgentIds = bridgeStatus.agentList || [];

      if (!connectedAgentIds || connectedAgentIds.length === 0) {
        logger.info(
          "No agents currently connected - will start streaming when agents connect"
        );
        return;
      }

      logger.info(
        `Requesting realtime streaming from ${connectedAgentIds.length} connected agents`,
        {
          connectedAgents: connectedAgentIds,
        }
      );

      // Send stream requests to all connected agents
      const streamPromises = connectedAgentIds.map(async (agentId) => {
        try {
          await this.requestRealtimeStreaming(agentId, options);
          logger.info(
            `Successfully requested streaming from agent: ${agentId}`
          );
        } catch (error) {
          logger.error(`Failed to request streaming from agent: ${agentId}`, {
            error: error.message,
          });
        }
      });

      await Promise.allSettled(streamPromises);
      logger.info(
        "Completed realtime streaming requests to all connected agents"
      );
    } catch (error) {
      logger.error("Error requesting realtime streaming from all agents", {
        error: error.message,
      });
    }
  }

  /**
   * Start log collection via WebSocket bridge
   * NOTE: This primarily handles non-live log requests and bridge management.
   * Live streaming is handled directly by StreamRouter to avoid duplicates.
   */
  startBridgeLogging() {
    if (!this.bridgeService) {
      logger.error("Bridge service not available for agent log collection");
      this.startHttpPolling();
      return;
    }

    logger.info(
      "Agent bridge logging started (non-live requests and management)"
    );

    // Listen for agent log responses (non-live requests)
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

      logger.debug("Received log data via bridge", {
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
        logger.info("Processed agent logs via bridge", {
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

        logger.debug("Processed single agent log via bridge", {
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

      logger.info("Requesting logs from agent via bridge", {
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
        logger.info("Agent log request successful", {
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

  /**
   * Handle live system logs from agent
   */
  handleLiveSystemLogs(bridgeLog) {
    try {
      logger.debug("Received live system logs from agent", {
        agentId: bridgeLog.agent_id,
        logCount: bridgeLog.logs?.length || 0,
        streamType: bridgeLog.stream_type,
      });

      // Process each log entry
      if (bridgeLog.logs && Array.isArray(bridgeLog.logs)) {
        bridgeLog.logs.forEach((logEntry) => {
          const standardizedLog = {
            ...logEntry,
            serviceId: bridgeLog.agent_id,
            source: "agent-live-stream",
            stream_type: "live",
            room: bridgeLog.room || "admin-system-logs",
          };

          this.emitLog(standardizedLog);
        });
      }
    } catch (error) {
      logger.error("Error processing live system logs", {
        error: error.message,
        agentId: bridgeLog?.agent_id,
      });
    }
  }

  /**
   * Handle live container logs from agent
   */
  handleLiveContainerLogs(bridgeLog) {
    try {
      logger.debug("Received live container logs from agent", {
        agentId: bridgeLog.agent_id,
        containerId: bridgeLog.container_id,
        logCount: bridgeLog.logs?.length || 0,
      });

      if (bridgeLog.logs && Array.isArray(bridgeLog.logs)) {
        bridgeLog.logs.forEach((logEntry) => {
          const standardizedLog = {
            ...logEntry,
            serviceId: bridgeLog.agent_id,
            source: "agent-container-stream",
            container_id: bridgeLog.container_id,
            user_id: bridgeLog.user_id,
            stream_type: "live",
            room: bridgeLog.room,
          };

          this.emitLog(standardizedLog);
        });
      }
    } catch (error) {
      logger.error("Error processing live container logs", {
        error: error.message,
        agentId: bridgeLog?.agent_id,
        containerId: bridgeLog?.container_id,
      });
    }
  }

  /**
   * Handle stream started confirmation
   */
  handleStreamStarted(data) {
    logger.info("Agent confirmed log stream started", {
      agentId: data.agent_id,
      streamType: data.stream_type,
      timestamp: data.timestamp,
    });
  }

  /**
   * Handle stream stopped confirmation
   */
  handleStreamStopped(data) {
    logger.info("Agent confirmed log stream stopped", {
      agentId: data.agent_id,
      streamType: data.stream_type,
      timestamp: data.timestamp,
    });
  }

  /**
   * Request live log streaming from agent
   */
  async requestLiveStream(agentId, options = {}) {
    if (!this.bridgeService) {
      throw new Error("Bridge service not available for live streaming");
    }

    const streamRequest = {
      type: options.type || "system",
      autoStart: options.autoStart !== false,
      lines: options.lines || 50,
      timestamp: new Date().toISOString(),
      ...options,
    };

    logger.info("Requesting live log stream from agent", {
      agentId,
      streamRequest,
    });

    // Send start stream request to agent
    await this.bridgeService.sendToAgent(
      agentId,
      "start_log_stream",
      streamRequest
    );

    return {
      success: true,
      agentId,
      streamType: streamRequest.type,
      message: "Live stream requested",
    };
  }

  /**
   * Stop live log streaming from agent
   */
  async stopLiveStream(agentId, options = {}) {
    if (!this.bridgeService) {
      throw new Error("Bridge service not available");
    }

    const stopRequest = {
      type: options.type || "system",
      timestamp: new Date().toISOString(),
      ...options,
    };

    logger.info("Requesting to stop live log stream from agent", {
      agentId,
      stopRequest,
    });

    await this.bridgeService.sendToAgent(
      agentId,
      "stop_log_stream",
      stopRequest
    );

    return {
      success: true,
      agentId,
      streamType: stopRequest.type,
      message: "Live stream stop requested",
    };
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

  /**
   * Handle live system logs from agent
   */
  handleLiveSystemLogs(bridgeLog) {
    try {
      logger.debug("Received live system logs from agent", {
        agentId: bridgeLog.agent_id,
        logCount: bridgeLog.logs?.length || 0,
        streamType: bridgeLog.stream_type,
      });

      // Process each log entry
      if (bridgeLog.logs && Array.isArray(bridgeLog.logs)) {
        bridgeLog.logs.forEach((logEntry) => {
          const standardizedLog = {
            ...logEntry,
            serviceId: bridgeLog.agent_id,
            source: "agent-live-stream",
            stream_type: "live",
            room: bridgeLog.room || "admin-system-logs",
          };

          this.emitLog(standardizedLog);
        });
      }
    } catch (error) {
      logger.error("Error processing live system logs", {
        error: error.message,
        agentId: bridgeLog?.agent_id,
      });
    }
  }

  /**
   * Handle live container logs from agent
   */
  handleLiveContainerLogs(bridgeLog) {
    try {
      logger.debug("Received live container logs from agent", {
        agentId: bridgeLog.agent_id,
        containerId: bridgeLog.container_id,
        logCount: bridgeLog.logs?.length || 0,
      });

      if (bridgeLog.logs && Array.isArray(bridgeLog.logs)) {
        bridgeLog.logs.forEach((logEntry) => {
          const standardizedLog = {
            ...logEntry,
            serviceId: bridgeLog.agent_id,
            source: "agent-container-stream",
            container_id: bridgeLog.container_id,
            user_id: bridgeLog.user_id,
            stream_type: "live",
            room: bridgeLog.room,
          };

          this.emitLog(standardizedLog);
        });
      }
    } catch (error) {
      logger.error("Error processing live container logs", {
        error: error.message,
        agentId: bridgeLog?.agent_id,
        containerId: bridgeLog?.container_id,
      });
    }
  }

  /**
   * Handle stream started confirmation
   */
  handleStreamStarted(data) {
    logger.info("Agent confirmed log stream started", {
      agentId: data.agent_id,
      streamType: data.stream_type,
      timestamp: data.timestamp,
    });
  }

  /**
   * Handle stream stopped confirmation
   */
  handleStreamStopped(data) {
    logger.info("Agent confirmed log stream stopped", {
      agentId: data.agent_id,
      streamType: data.stream_type,
      timestamp: data.timestamp,
    });
  }

  /**
   * Request live log streaming from agent
   */
  async requestLiveStream(agentId, options = {}) {
    if (!this.bridgeService) {
      throw new Error("Bridge service not available for live streaming");
    }

    const streamRequest = {
      type: options.type || "system",
      autoStart: options.autoStart !== false,
      lines: options.lines || 50,
      timestamp: new Date().toISOString(),
      ...options,
    };

    logger.info("Requesting live log stream from agent", {
      agentId,
      streamRequest,
    });

    // Send start stream request to agent
    await this.bridgeService.sendToAgent(
      agentId,
      "start_log_stream",
      streamRequest
    );

    return {
      success: true,
      agentId,
      streamType: streamRequest.type,
      message: "Live stream requested",
    };
  }

  /**
   * Stop live log streaming from agent
   */
  async stopLiveStream(agentId, options = {}) {
    if (!this.bridgeService) {
      throw new Error("Bridge service not available");
    }

    const stopRequest = {
      type: options.type || "system",
      timestamp: new Date().toISOString(),
      ...options,
    };

    logger.info("Requesting to stop live log stream from agent", {
      agentId,
      stopRequest,
    });

    await this.bridgeService.sendToAgent(
      agentId,
      "stop_log_stream",
      stopRequest
    );

    return {
      success: true,
      agentId,
      streamType: stopRequest.type,
      message: "Live stream stop requested",
    };
  }

  async stop() {
    // Stop realtime streaming from all connected agents
    if (this.bridgeService) {
      const bridgeStatus = this.bridgeService.getStatus();
      const connectedAgentIds = bridgeStatus.agentList || [];

      logger.info("Stopping realtime streaming for all connected agents", {
        agentCount: connectedAgentIds.length,
        agentIds: connectedAgentIds,
      });

      // Stop streaming from each connected agent
      for (const agentId of connectedAgentIds) {
        try {
          await this.stopLiveStream(agentId, { type: "system" });
          logger.info("Stop request sent to agent", { agentId });
        } catch (error) {
          logger.error("Failed to stop streaming from agent", {
            agentId,
            error: error.message,
          });
        }
      }
    }

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
