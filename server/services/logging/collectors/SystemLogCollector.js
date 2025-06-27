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

      // Always try shared volume or root logs dir first (for Docker)
      const logsRoot = process.env.LOGS_ROOT || "/app/logs";
      const sharedLogPath = path.join(logsRoot, filename);
      if (fs.existsSync(sharedLogPath)) {
        filePath = sharedLogPath;
      } else {
        // Fallback to local/dev path
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
    // Always use file watching for real-time logs, even in production
    await this.startFileWatching();
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
    // Always use file logs, even in production
    return await this.getFileLogs(lines, level);
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

    for (const watcher of this.watchers) {
      watcher.unwatch();
    }
    this.watchers = [];
  }
}

module.exports = SystemLogCollector;
