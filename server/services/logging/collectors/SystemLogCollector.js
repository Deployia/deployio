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
        // Use /app/logs in Docker, local path in dev
        basePath:
          process.env.NODE_ENV === "development"
            ? path.join(__dirname, "..", "..", "..", "logs")
            : "/app/logs",
        files: ["combined.log", "backend.log"],
      },
      "ai-service": {
        // Use shared volume in Docker, local path in dev
        basePath:
          process.env.NODE_ENV === "development"
            ? path.resolve(
                __dirname,
                "..",
                "..",
                "..",
                "..",
                "ai-service",
                "logs"
              )
            : "/shared-logs",
        files: ["ai-service.log", "error.log"],
      },
    };

    const config = basePaths[this.serviceId];
    if (!config) {
      logger.warn(`No log path configuration for service: ${this.serviceId}`);
      return [];
    }

    const paths = [];
    for (const filename of config.files) {
      const filePath = path.join(config.basePath, filename);
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
      // Fast Node.js tail implementation
      const logLines = await tailFile(logPath, lines);
      const parsedLogs = logLines
        .map((line, index) => {
          try {
            const logEntry = JSON.parse(line);
            return {
              id: `${this.serviceId}_file_${Date.now()}_${index}`,
              timestamp: logEntry.timestamp || new Date().toISOString(),
              level: (logEntry.level || "info").toUpperCase(),
              message: logEntry.message || line,
              service: this.serviceId,
              source: "file-logs",
              metadata: logEntry,
              raw: line,
            };
          } catch {
            return {
              id: `${this.serviceId}_file_${Date.now()}_${index}`,
              timestamp: new Date().toISOString(),
              level: "INFO",
              message: line,
              service: this.serviceId,
              source: "file-logs",
              raw: line,
            };
          }
        })
        .filter((log) =>
          level === "all"
            ? true
            : log.level.toLowerCase() === level.toLowerCase()
        );

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

async function tailFile(filePath, lines = 100, chunkSize = 4096) {
  return new Promise((resolve, reject) => {
    fs.open(filePath, "r", (err, fd) => {
      if (err) return resolve([]);
      fs.fstat(fd, (err, stats) => {
        if (err) {
          fs.close(fd, () => {});
          return resolve([]);
        }
        let fileSize = stats.size;
        let buffer = Buffer.alloc(0);
        let position = fileSize;
        let lineCount = 0;
        let chunks = [];
        function readChunk() {
          if (position === 0 || lineCount > lines * 2) {
            processBuffer();
            return;
          }
          let readSize = Math.min(chunkSize, position);
          position -= readSize;
          let chunkBuffer = Buffer.alloc(readSize);
          fs.read(fd, chunkBuffer, 0, readSize, position, (err, bytesRead) => {
            if (err) {
              fs.close(fd, () => {});
              return resolve([]);
            }
            buffer = Buffer.concat([chunkBuffer, buffer]);
            lineCount = buffer.toString().split("\n").length - 1;
            if (position > 0 && lineCount <= lines * 2) {
              readChunk();
            } else {
              processBuffer();
            }
          });
        }
        function processBuffer() {
          fs.close(fd, () => {});
          let allLines = buffer.toString().split("\n");
          if (allLines[allLines.length - 1] === "") allLines.pop();
          resolve(allLines.slice(-lines));
        }
        readChunk();
      });
    });
  });
}

module.exports = SystemLogCollector;
