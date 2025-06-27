/**
 * Unified Log Collector Service
 * Handles log collection from multiple sources with standardized output
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const EventEmitter = require("events");
const axios = require("axios");
const logger = require("@config/logger");

const execPromise = util.promisify(exec);

class LogCollectorService extends EventEmitter {
  constructor() {
    super();
    this.collectors = new Map();
    this.activeStreams = new Map();
    this.config = {
      maxLines: 1000,
      retentionHours: 24,
      bufferSize: 100,
    };
  }

  /**
   * Initialize the log collector service
   */
  initialize() {
    logger.info("Initializing Unified Log Collector Service");

    // Register system service collectors
    this.registerCollector("backend", new SystemLogCollector("backend"));
    this.registerCollector("ai-service", new SystemLogCollector("ai-service"));
    this.registerCollector("agent", new AgentLogCollector());

    // Initialize metrics collector
    this.metricsCollector = new MetricsCollector();

    logger.info("Log Collector Service initialized successfully");
  }

  /**
   * Register a log collector for a specific service
   */
  registerCollector(serviceId, collector) {
    this.collectors.set(serviceId, collector);

    // Forward collector events
    collector.on("log", (logEntry) => {
      this.emit("log", { serviceId, ...logEntry });
    });

    collector.on("error", (error) => {
      this.emit("error", { serviceId, error });
    });

    logger.info(`Registered log collector for service: ${serviceId}`);
  }

  /**
   * Start collecting logs for a specific service
   */
  async startCollection(serviceId, options = {}) {
    logger.debug("Starting log collection", {
      serviceId,
      options,
      availableCollectors: Array.from(this.collectors.keys()),
    });

    const collector = this.collectors.get(serviceId);
    if (!collector) {
      const availableServices = Array.from(this.collectors.keys());
      logger.error(`No collector registered for service: ${serviceId}`, {
        serviceId,
        availableServices,
        collectorCount: this.collectors.size,
      });
      throw new Error(
        `No collector registered for service: ${serviceId}. Available services: ${availableServices.join(
          ", "
        )}`
      );
    }

    // Use clientStreamId if provided, otherwise generate internal streamId
    const streamId = options.clientStreamId || `${serviceId}_${Date.now()}`;

    this.activeStreams.set(streamId, {
      serviceId,
      collector,
      startTime: new Date(),
      options,
      isClientStream: !!options.clientStreamId,
    });

    try {
      await collector.start(options);
      logger.info(`Started log collection for service: ${serviceId}`, {
        streamId,
        isClientStream: !!options.clientStreamId,
      });
      return streamId;
    } catch (error) {
      this.activeStreams.delete(streamId);
      throw error;
    }
  }

  /**
   * Stop collecting logs for a specific service
   */
  async stopCollection(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return false;
    }

    try {
      await stream.collector.stop();
      this.activeStreams.delete(streamId);
      logger.info(`Stopped log collection for stream: ${streamId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error stopping log collection for stream ${streamId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get recent logs for a service
   */
  async getRecentLogs(serviceId, options = {}) {
    const collector = this.collectors.get(serviceId);
    if (!collector) {
      throw new Error(`No collector registered for service: ${serviceId}`);
    }

    return await collector.getRecentLogs(options);
  }

  /**
   * Get deployment logs (user-specific)
   */
  async getDeploymentLogs(deploymentId, options = {}) {
    // This will be implemented when we add deployment log collectors
    throw new Error("Deployment log collection not yet implemented");
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    return await this.metricsCollector.getMetrics();
  }

  /**
   * Clean up old logs and inactive streams
   */
  async cleanup() {
    const now = new Date();
    const cutoffTime = new Date(
      now.getTime() - this.config.retentionHours * 60 * 60 * 1000
    );

    // Clean up inactive streams
    for (const [streamId, stream] of this.activeStreams) {
      if (stream.startTime < cutoffTime) {
        await this.stopCollection(streamId);
        logger.info(`Cleaned up inactive stream: ${streamId}`);
      }
    }

    // Clean up collectors
    for (const collector of this.collectors.values()) {
      if (collector.cleanup) {
        await collector.cleanup(cutoffTime);
      }
    }
  }

  /**
   * Get status of all collectors
   */
  getStatus() {
    const status = {
      activeStreams: this.activeStreams.size,
      collectors: {},
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    for (const [serviceId, collector] of this.collectors) {
      status.collectors[serviceId] = {
        type: collector.constructor.name,
        status: collector.isActive ? "active" : "inactive",
        lastActivity: collector.lastActivity || null,
      };
    }

    return status;
  }

  /**
   * Get list of available service collectors
   */
  getAvailableServices() {
    return Array.from(this.collectors.keys());
  }

  /**
   * Check if a collector is registered for a service
   */
  hasCollector(serviceId) {
    return this.collectors.has(serviceId);
  }
}

/**
 * Base Log Collector Class
 */
class BaseLogCollector extends EventEmitter {
  constructor(serviceId) {
    super();
    this.serviceId = serviceId;
    this.isActive = false;
    this.lastActivity = null;
    this.buffer = [];
  }

  async start(options = {}) {
    this.isActive = true;
    this.lastActivity = new Date();
  }

  async stop() {
    this.isActive = false;
  }

  standardizeLogEntry(entry) {
    return {
      id: `${this.serviceId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      level: (entry.level || "info").toLowerCase(),
      message: entry.message || "",
      service: this.serviceId,
      source: entry.source || "unknown",
      metadata: entry.metadata || {},
      raw: entry.raw || entry.message,
    };
  }

  emitLog(entry) {
    const standardized = this.standardizeLogEntry(entry);
    this.lastActivity = new Date();

    this.emit("log", standardized);
  }
}

/**
 * System Log Collector for Backend/AI Services
 */
class SystemLogCollector extends BaseLogCollector {
  constructor(serviceId) {
    super(serviceId);
    this.logPaths = this.getLogPaths();
    this.watchers = [];
  }

  getLogPaths() {
    const basePaths = {
      backend: {
        basePath: path.join(__dirname, "..", "..", "logs"), // server directory
        files: ["combined.log", "backend.log"],
      },
      "ai-service": {
        basePath: path.join(__dirname, "..", "..", "..", "ai-service", "logs"), // go to root, then ai-service
        files: ["ai-service.log"],
      },
    };

    const config = basePaths[this.serviceId];
    if (!config) {
      logger.warn(`No log path configuration for service: ${this.serviceId}`);
      return [];
    }

    const paths = [];
    for (const filename of config.files) {
      let filePath;

      // Try production path first
      if (process.env.NODE_ENV === "production" && fs.existsSync("/app/logs")) {
        filePath = path.join("/app/logs", filename);
      } else {
        // Development path - construct based on service
        if (this.serviceId === "backend") {
          filePath = path.join(config.basePath, filename);
        } else {
          // For ai-service, logs are in ai-service/logs/
          filePath = path.join(config.basePath, filename);
        }
      }

      if (fs.existsSync(filePath)) {
        paths.push(filePath);
      }
    }

    logger.info(`Found log paths for ${this.serviceId}:`, {
      paths,
      nodeEnv: process.env.NODE_ENV,
      basePath: config.basePath,
      files: config.files,
    });

    return paths;
  }

  async start(options = {}) {
    await super.start(options);

    const { realtime = false } = options;

    logger.info(`SystemLogCollector.start() called for ${this.serviceId}`, {
      realtime,
      logPaths: this.logPaths,
      nodeEnv: process.env.NODE_ENV,
    });

    if (realtime) {
      await this.startRealtimeCollection();
    } else {
      logger.info(`Real-time collection not requested for ${this.serviceId}`);
    }
  }

  async startRealtimeCollection() {
    logger.info(`Starting real-time collection for ${this.serviceId}`, {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === "production",
    });

    if (process.env.NODE_ENV === "production") {
      // Use Docker logs in production
      await this.startDockerLogStreaming();
    } else {
      // Use file watching in development
      await this.startFileWatching();
    }
  }

  async startDockerLogStreaming() {
    const dockerServices = {
      "ai-service": "deployio-ai-service",
      backend: "deployio-backend",
    };

    const serviceName = dockerServices[this.serviceId];
    if (!serviceName) return;

    try {
      const command = `docker-compose logs -f --tail=10 ${this.serviceId}`;
      const child = exec(command);

      child.stdout.on("data", (data) => {
        this.parseDockerLogs(data.toString());
      });

      child.stderr.on("data", (data) => {
        logger.error(
          `Docker logs error for ${this.serviceId}:`,
          data.toString()
        );
      });

      child.on("close", (code) => {
        logger.info(
          `Docker logs stream closed for ${this.serviceId} with code ${code}`
        );
      });

      this.dockerProcess = child;
    } catch (error) {
      logger.error(
        `Failed to start Docker log streaming for ${this.serviceId}:`,
        error
      );
    }
  }

  parseDockerLogs(data) {
    const lines = data.trim().split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse Docker compose log format: service_name | log_content
      const match = line.match(/^[\w-]+\s*\|\s*(.+)$/);
      const logContent = match ? match[1] : line;

      // Try to parse as JSON (Winston format)
      try {
        const logEntry = JSON.parse(logContent);
        this.emitLog({
          timestamp: logEntry.timestamp,
          level: logEntry.level,
          message: logEntry.message,
          source: "docker-logs",
          metadata: logEntry,
          raw: line,
        });
      } catch {
        // Parse as plain text
        this.emitLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: logContent,
          source: "docker-logs",
          raw: line,
        });
      }
    }
  }

  async startFileWatching() {
    const { Tail } = require("tail");

    logger.info(`Starting file watching for ${this.serviceId}`, {
      logPaths: this.logPaths,
      pathCount: this.logPaths.length,
    });

    if (this.logPaths.length === 0) {
      logger.warn(
        `No log files found for ${this.serviceId} - cannot start file watching`
      );
      return;
    }

    for (const logPath of this.logPaths) {
      try {
        logger.info(`Attempting to watch file: ${logPath}`);

        // Check if file exists
        if (!fs.existsSync(logPath)) {
          logger.warn(`Log file does not exist: ${logPath}`);
          continue;
        }

        const tail = new Tail(logPath, {
          fromBeginning: false,
          fsWatchOptions: { interval: 1000 },
          useWatchFile: true, // Force use of watchFile for better compatibility
          follow: true,
        });

        tail.on("line", (line) => {
          this.parseLogLine(line, "file-watch", logPath);
        });

        tail.on("error", (error) => {
          logger.error(`File watch error for ${logPath}:`, error);
        });

        // Add event for when file is watched
        tail.watch();

        this.watchers.push(tail);
        logger.info(`Successfully started file watching for: ${logPath}`);
      } catch (error) {
        logger.error(`Failed to watch file ${logPath}:`, error);
      }
    }
  }

  parseLogLine(line, source, filePath) {
    try {
      // Try to parse as JSON (Winston format)
      const logEntry = JSON.parse(line);
      const standardizedLog = {
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        message: logEntry.message,
        source: source,
        metadata: { filePath, ...logEntry },
        raw: line,
      };

      this.emitLog(standardizedLog);
    } catch {
      // Parse as plain text with timestamp extraction
      const timestampMatch = line.match(
        /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
      );
      const timestamp = timestampMatch
        ? timestampMatch[1]
        : new Date().toISOString();

      const standardizedLog = {
        timestamp: timestamp,
        level: "info",
        message: line,
        source: source,
        metadata: { filePath },
        raw: line,
      };

      this.emitLog(standardizedLog);
    }
  }

  async getRecentLogs(options = {}) {
    const { lines = 50, level = "all" } = options;

    // Try Docker logs first in production
    if (process.env.NODE_ENV === "production") {
      return await this.getDockerLogs(lines, level);
    } else {
      return await this.getFileLogs(lines, level);
    }
  }

  async getDockerLogs(lines, level) {
    const dockerServices = {
      "ai-service": "ai-service",
      backend: "backend",
    };

    const serviceName = dockerServices[this.serviceId];
    if (!serviceName) {
      throw new Error(`Unknown Docker service: ${this.serviceId}`);
    }

    try {
      const command = `docker-compose logs --tail=${lines} ${serviceName}`;
      const { stdout } = await execPromise(command);

      const logLines = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      const parsedLogs = logLines.map((line, index) => {
        const match = line.match(/^[\w-]+\s*\|\s*(.+)$/);
        const logContent = match ? match[1] : line;

        return {
          id: `${this.serviceId}_docker_${Date.now()}_${index}`,
          timestamp: new Date().toISOString(),
          level: "info",
          message: logContent,
          service: this.serviceId,
          source: "docker-logs",
          raw: line,
        };
      });

      return {
        logs: parsedLogs,
        totalLines: parsedLogs.length,
        source: "docker-logs",
        path: "docker-compose",
      };
    } catch (error) {
      throw new Error(`Failed to get Docker logs: ${error.message}`);
    }
  }

  async getFileLogs(lines, level) {
    if (this.logPaths.length === 0) {
      return {
        logs: [],
        totalLines: 0,
        source: "file-logs",
        error: "No log files found",
      };
    }

    try {
      const logPath = this.logPaths[0]; // Use first available log file
      const command = `tail -n ${lines} "${logPath}"`;
      const { stdout } = await execPromise(command);

      const logLines = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      const parsedLogs = logLines.map((line, index) => {
        try {
          const logEntry = JSON.parse(line);
          return {
            id: `${this.serviceId}_file_${Date.now()}_${index}`,
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            service: this.serviceId,
            source: "file-logs",
            metadata: logEntry,
            raw: line,
          };
        } catch {
          return {
            id: `${this.serviceId}_file_${Date.now()}_${index}`,
            timestamp: new Date().toISOString(),
            level: "info",
            message: line,
            service: this.serviceId,
            source: "file-logs",
            raw: line,
          };
        }
      });

      return {
        logs: parsedLogs,
        totalLines: parsedLogs.length,
        source: "file-logs",
        path: logPath,
      };
    } catch (error) {
      throw new Error(`Failed to read log files: ${error.message}`);
    }
  }

  async stop() {
    await super.stop();

    // Stop Docker process
    if (this.dockerProcess) {
      this.dockerProcess.kill();
      this.dockerProcess = null;
    }

    // Stop file watchers
    for (const watcher of this.watchers) {
      watcher.unwatch();
    }
    this.watchers = [];
  }
}

/**
 * Agent Log Collector for Remote EC2 Service
 */
class AgentLogCollector extends BaseLogCollector {
  constructor() {
    super("agent");
    this.agentUrl = process.env.AGENT_URL || "http://localhost:8001";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
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

/**
 * Metrics Collector for System Metrics
 */
class MetricsCollector {
  async getMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: await this.getSystemMetrics(),
      services: await this.getServiceMetrics(),
    };

    return metrics;
  }

  async getSystemMetrics() {
    const os = require("os");

    return {
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      cpu: {
        cores: os.cpus().length,
        architecture: os.arch(),
      },
    };
  }

  async getServiceMetrics() {
    // Placeholder for service-specific metrics
    return {
      backend: { status: "healthy", connections: 0 },
      "ai-service": { status: "healthy", requests: 0 },
      agent: { status: "healthy", deployments: 0 },
    };
  }
}

// Create singleton instance
const logCollectorService = new LogCollectorService();

module.exports = {
  LogCollectorService,
  SystemLogCollector,
  AgentLogCollector,
  MetricsCollector,
  logCollectorService,
};
