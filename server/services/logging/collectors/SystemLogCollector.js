/**
 * System Log Collector for Backend/AI Services
 * Handles file watching and Docker log streaming for system services
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const logger = require("@config/logger");
const BaseLogCollector = require("./BaseLogCollector");

const execPromise = util.promisify(exec);

class SystemLogCollector extends BaseLogCollector {
  constructor(serviceId) {
    super(serviceId);
    this.logPaths = this.getLogPaths();
    this.watchers = [];
    this.dockerProcess = null;
  }

  getLogPaths() {
    const basePaths = {
      backend: {
        basePath: path.join(__dirname, "..", "..", "..", "logs"),
        files: ["combined.log", "backend.log"],
      },
      "ai-service": {
        basePath: path.join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "ai-service",
          "logs"
        ),
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
        // Development path
        filePath = path.join(config.basePath, filename);
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
      await this.startDockerLogStreaming();
    } else {
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

      const match = line.match(/^[\w-]+\s*\|\s*(.+)$/);
      const logContent = match ? match[1] : line;

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

        if (!fs.existsSync(logPath)) {
          logger.warn(`Log file does not exist: ${logPath}`);
          continue;
        }

        const tail = new Tail(logPath, {
          fromBeginning: false,
          fsWatchOptions: { interval: 1000 },
          useWatchFile: true,
          follow: true,
        });

        tail.on("line", (line) => {
          this.parseLogLine(line, "file-watch", logPath);
        });

        tail.on("error", (error) => {
          logger.error(`File watch error for ${logPath}:`, error);
        });

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
      const logPath = this.logPaths[0];
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

    if (this.dockerProcess) {
      this.dockerProcess.kill();
      this.dockerProcess = null;
    }

    for (const watcher of this.watchers) {
      watcher.unwatch();
    }
    this.watchers = [];
  }
}

module.exports = SystemLogCollector;
