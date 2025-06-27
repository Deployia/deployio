const webSocketRegistry = require("../core/WebSocketRegistry");
const logger = require("../../config/logger");
const fs = require("fs");
const path = require("path");
const { Tail } = require("tail");
const { exec } = require("child_process");
const util = require("util");

/**
 * Log Streaming WebSocket Namespace
 * Handles real-time log streaming for admin users
 */
class LogStreamingNamespace {
  constructor() {
    this.namespace = null;
    this.logWatchers = new Map();
    this.activeStreams = new Map();
    this.execAsync = util.promisify(exec);
  }

  /**
   * Initialize the log streaming namespace
   */
  static initialize() {
    const instance = new LogStreamingNamespace();

    // Register namespace with admin-only access
    const namespace = webSocketRegistry.register("/logs", {
      requireAuth: true,
      requireAdmin: true,
      requireVerified: false, // OAuth users are auto-verified
    });

    // Register event handlers
    namespace
      .on("stream:start", instance.startLogStream.bind(instance))
      .on("stream:stop", instance.stopLogStream.bind(instance))
      .on("stream:list", instance.listAvailableStreams.bind(instance))
      .on("stream:docker_logs", instance.startDockerLogStream.bind(instance))
      .on("stream:system_logs", instance.startSystemLogStream.bind(instance));

    // Add connection and disconnection handlers
    namespace
      .onConnection(instance.handleConnection.bind(instance))
      .onDisconnection(instance.handleDisconnection.bind(instance));

    instance.namespace = namespace;

    logger.info("Log streaming namespace initialized");
    return instance;
  }

  /**
   * Handle new connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    logger.info("Admin connected to log streaming", {
      userId: socket.userId,
      email: socket.userEmail,
    });

    // Send available log streams
    this.sendAvailableStreams(socket);
  }

  /**
   * Handle disconnection
   * @param {Object} socket - Socket instance
   * @param {String} reason - Disconnection reason
   */
  handleDisconnection(socket, reason) {
    // Stop all streams for this socket
    this.stopAllStreamsForSocket(socket);

    logger.info("Admin disconnected from log streaming", {
      userId: socket.userId,
      reason,
    });
  }

  /**
   * Start log streaming
   * @param {Object} socket - Socket instance
   * @param {Object} data - Stream configuration
   */
  async startLogStream(socket, data) {
    try {
      const { streamId, logType, options = {} } = data;

      if (!streamId || !logType) {
        return socket.emit("error", {
          message: "Stream ID and log type are required",
          code: "MISSING_STREAM_CONFIG",
        });
      }

      // Stop existing stream if any
      this.stopLogStreamForSocket(socket, streamId);

      let logPath;
      let streamConfig;

      switch (logType) {
        case "application":
          logPath = path.join(process.cwd(), "logs", "combined.log");
          streamConfig = {
            follow: true,
            fromBeginning: false,
            logger: console, // Enable tail library logging
            useWatchFile: true, // Use watchFile for better compatibility
            fsWatchOptions: {
              interval: 1000, // Check every second
            },
          };
          break;
        case "error":
          logPath = path.join(process.cwd(), "logs", "error.log");
          streamConfig = {
            follow: true,
            fromBeginning: false,
            logger: console,
            useWatchFile: true,
            fsWatchOptions: {
              interval: 1000,
            },
          };
          break;
        case "access":
          logPath = path.join(process.cwd(), "logs", "access.log");
          streamConfig = {
            follow: true,
            fromBeginning: false,
            logger: console,
            useWatchFile: true,
            fsWatchOptions: {
              interval: 1000,
            },
          };
          break;
        default:
          return socket.emit("error", {
            message: `Unsupported log type: ${logType}`,
            code: "UNSUPPORTED_LOG_TYPE",
          });
      }

      // Check if log file exists
      if (!fs.existsSync(logPath)) {
        return socket.emit("error", {
          message: `Log file not found: ${logPath}`,
          code: "LOG_FILE_NOT_FOUND",
        });
      }

      // Create tail instance
      console.log(`Setting up tail for log file: ${logPath}`); // Debug log
      const tail = new Tail(logPath, streamConfig);

      // Set up stream handlers
      tail.on("line", (line) => {
        console.log(`New log line for stream ${streamId}:`, line); // Debug log
        socket.emit("log:data", {
          streamId,
          logType,
          timestamp: new Date().toISOString(),
          data: line,
        });
        console.log(`Emitted log:data for stream ${streamId}`); // Debug log
      });

      tail.on("error", (error) => {
        console.error(`Tail error for stream ${streamId}:`, error); // Debug log
        logger.error("Log stream error", {
          error: error.message,
          streamId,
          logType,
          userId: socket.userId,
        });
        socket.emit("log:error", {
          streamId,
          logType,
          error: error.message,
        });
      });

      // Add more tail event handlers for debugging
      tail.on("start", () => {
        console.log(`Tail started for stream ${streamId}`);
      });

      tail.on("stop", () => {
        console.log(`Tail stopped for stream ${streamId}`);
      });

      socket.emit("log:started", {
        streamId,
        logType,
        logPath,
        startedAt: new Date().toISOString(),
      });

      // Generate test logs to verify streaming works
      let testLogCounter = 0;
      const testLogInterval = setInterval(() => {
        testLogCounter++;
        const testMessage = `Test log message #${testLogCounter} for stream ${streamId}`;
        console.log(`Generating test log: ${testMessage}`);

        socket.emit("log:data", {
          streamId,
          logType,
          timestamp: new Date().toISOString(),
          data: testMessage,
        });

        // Stop test logs after 5 messages
        if (testLogCounter >= 5) {
          clearInterval(testLogInterval);
          console.log(`Test log generation completed for stream ${streamId}`);
        }
      }, 2000); // Send a test log every 2 seconds

      // Store the interval reference so we can clean it up
      const streamKey = `${socket.id}_${streamId}`;
      this.activeStreams.set(streamKey, {
        tail,
        streamId,
        logType,
        socketId: socket.id,
        userId: socket.userId,
        startedAt: new Date(),
        testLogInterval, // Store the interval for cleanup
      });

      logger.info("Log stream started", {
        streamId,
        logType,
        logPath,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error("Error starting log stream", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to start log stream",
        code: "STREAM_START_ERROR",
      });
    }
  }

  /**
   * Stop log streaming
   * @param {Object} socket - Socket instance
   * @param {Object} data - Stream configuration
   */
  async stopLogStream(socket, data) {
    try {
      const { streamId } = data;

      if (!streamId) {
        return socket.emit("error", {
          message: "Stream ID is required",
          code: "MISSING_STREAM_ID",
        });
      }

      const stopped = this.stopLogStreamForSocket(socket, streamId);

      if (stopped) {
        socket.emit("log:stopped", {
          streamId,
          stoppedAt: new Date().toISOString(),
        });
        logger.info("Log stream stopped", {
          streamId,
          userId: socket.userId,
        });
      } else {
        socket.emit("error", {
          message: "Stream not found",
          code: "STREAM_NOT_FOUND",
        });
      }
    } catch (error) {
      logger.error("Error stopping log stream", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to stop log stream",
        code: "STREAM_STOP_ERROR",
      });
    }
  }

  /**
   * List available log streams
   * @param {Object} socket - Socket instance
   */
  async listAvailableStreams(socket) {
    try {
      this.sendAvailableStreams(socket);
    } catch (error) {
      logger.error("Error listing available streams", {
        error: error.message,
        userId: socket.userId,
      });
      socket.emit("error", {
        message: "Failed to list available streams",
        code: "LIST_STREAMS_ERROR",
      });
    }
  }

  /**
   * Start Docker log streaming
   * @param {Object} socket - Socket instance
   * @param {Object} data - Docker configuration
   */
  async startDockerLogStream(socket, data) {
    try {
      const { streamId, containerName, options = {} } = data;

      if (!streamId || !containerName) {
        return socket.emit("error", {
          message: "Stream ID and container name are required",
          code: "MISSING_DOCKER_CONFIG",
        });
      }

      // Stop existing stream if any
      this.stopLogStreamForSocket(socket, streamId);

      const dockerCommand = `docker logs -f ${
        options.tail ? `--tail ${options.tail}` : ""
      } ${containerName}`;

      const childProcess = exec(dockerCommand);

      childProcess.stdout.on("data", (data) => {
        socket.emit("log:data", {
          streamId,
          logType: "docker",
          containerName,
          timestamp: new Date().toISOString(),
          data: data.toString(),
        });
      });

      childProcess.stderr.on("data", (data) => {
        socket.emit("log:data", {
          streamId,
          logType: "docker",
          containerName,
          timestamp: new Date().toISOString(),
          data: data.toString(),
          isError: true,
        });
      });

      childProcess.on("error", (error) => {
        logger.error("Docker log stream error", {
          error: error.message,
          streamId,
          containerName,
          userId: socket.userId,
        });
        socket.emit("log:error", {
          streamId,
          logType: "docker",
          containerName,
          error: error.message,
        });
      });

      // Store stream reference
      const streamKey = `${socket.id}_${streamId}`;
      this.activeStreams.set(streamKey, {
        process: childProcess,
        streamId,
        logType: "docker",
        containerName,
        socketId: socket.id,
        userId: socket.userId,
        startedAt: new Date(),
      });

      socket.emit("log:started", {
        streamId,
        logType: "docker",
        containerName,
        startedAt: new Date().toISOString(),
      });

      logger.info("Docker log stream started", {
        streamId,
        containerName,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error("Error starting Docker log stream", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to start Docker log stream",
        code: "DOCKER_STREAM_ERROR",
      });
    }
  }

  /**
   * Start system log streaming
   * @param {Object} socket - Socket instance
   * @param {Object} data - System log configuration
   */
  async startSystemLogStream(socket, data) {
    try {
      const { streamId, logType = "syslog", options = {} } = data;

      if (!streamId) {
        return socket.emit("error", {
          message: "Stream ID is required",
          code: "MISSING_STREAM_ID",
        });
      }

      // Stop existing stream if any
      this.stopLogStreamForSocket(socket, streamId);

      let command;
      if (process.platform === "win32") {
        // Windows Event Logs
        command =
          "powershell Get-EventLog -LogName System -Newest 10 | ConvertTo-Json";
      } else {
        // Unix/Linux system logs
        command = `tail -f /var/log/${logType}`;
      }

      const childProcess = exec(command);

      childProcess.stdout.on("data", (data) => {
        socket.emit("log:data", {
          streamId,
          logType: "system",
          systemLogType: logType,
          timestamp: new Date().toISOString(),
          data: data.toString(),
        });
      });

      childProcess.stderr.on("data", (data) => {
        socket.emit("log:data", {
          streamId,
          logType: "system",
          systemLogType: logType,
          timestamp: new Date().toISOString(),
          data: data.toString(),
          isError: true,
        });
      });

      childProcess.on("error", (error) => {
        logger.error("System log stream error", {
          error: error.message,
          streamId,
          logType,
          userId: socket.userId,
        });
        socket.emit("log:error", {
          streamId,
          logType: "system",
          systemLogType: logType,
          error: error.message,
        });
      });

      // Store stream reference
      const streamKey = `${socket.id}_${streamId}`;
      this.activeStreams.set(streamKey, {
        process: childProcess,
        streamId,
        logType: "system",
        systemLogType: logType,
        socketId: socket.id,
        userId: socket.userId,
        startedAt: new Date(),
      });

      socket.emit("log:started", {
        streamId,
        logType: "system",
        systemLogType: logType,
        startedAt: new Date().toISOString(),
      });

      logger.info("System log stream started", {
        streamId,
        logType,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error("Error starting system log stream", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to start system log stream",
        code: "SYSTEM_STREAM_ERROR",
      });
    }
  }

  /**
   * Send available streams to socket
   * @param {Object} socket - Socket instance
   */
  async sendAvailableStreams(socket) {
    try {
      const logsDir = path.join(process.cwd(), "logs");
      const availableStreams = {
        application: [],
        docker: [],
        system: [],
      };

      // Check for application log files
      if (fs.existsSync(logsDir)) {
        const logFiles = fs
          .readdirSync(logsDir)
          .filter((file) => file.endsWith(".log"));
        availableStreams.application = logFiles.map((file) => ({
          name: file.replace(".log", ""),
          path: path.join(logsDir, file),
          type: "application",
        }));
      }

      // Check for Docker containers
      try {
        const { stdout } = await this.execAsync(
          "docker ps --format '{{.Names}}'"
        );
        availableStreams.docker = stdout
          .trim()
          .split("\n")
          .filter((name) => name)
          .map((name) => ({
            name,
            type: "docker",
          }));
      } catch (error) {
        logger.debug("Docker not available or no containers running");
      }

      // System logs (platform-specific)
      if (process.platform !== "win32") {
        availableStreams.system = [
          { name: "syslog", type: "system" },
          { name: "auth.log", type: "system" },
          { name: "kern.log", type: "system" },
        ];
      } else {
        availableStreams.system = [
          { name: "System", type: "system" },
          { name: "Application", type: "system" },
          { name: "Security", type: "system" },
        ];
      }

      socket.emit("streams:available", availableStreams);
    } catch (error) {
      logger.error("Error getting available streams", {
        error: error.message,
        userId: socket.userId,
      });
      socket.emit("error", {
        message: "Failed to get available streams",
        code: "GET_STREAMS_ERROR",
      });
    }
  }

  /**
   * Stop log stream for socket
   * @param {Object} socket - Socket instance
   * @param {String} streamId - Stream ID
   * @returns {Boolean} True if stream was stopped
   */
  stopLogStreamForSocket(socket, streamId) {
    const streamKey = `${socket.id}_${streamId}`;
    const stream = this.activeStreams.get(streamKey);

    if (stream) {
      try {
        if (stream.tail) {
          stream.tail.unwatch();
        }
        if (stream.process) {
          stream.process.kill();
        }
        if (stream.testLogInterval) {
          clearInterval(stream.testLogInterval);
        }
        this.activeStreams.delete(streamKey);
        return true;
      } catch (error) {
        logger.error("Error stopping stream", {
          error: error.message,
          streamId,
          userId: socket.userId,
        });
      }
    }

    return false;
  }

  /**
   * Stop all streams for socket
   * @param {Object} socket - Socket instance
   */
  stopAllStreamsForSocket(socket) {
    const streamsToStop = [];

    this.activeStreams.forEach((stream, key) => {
      if (stream.socketId === socket.id) {
        streamsToStop.push({ key, stream });
      }
    });

    streamsToStop.forEach(({ key, stream }) => {
      try {
        if (stream.tail) {
          stream.tail.unwatch();
        }
        if (stream.process) {
          stream.process.kill();
        }
        this.activeStreams.delete(key);
      } catch (error) {
        logger.error("Error stopping stream during cleanup", {
          error: error.message,
          streamId: stream.streamId,
          userId: socket.userId,
        });
      }
    });

    logger.debug("Stopped all streams for socket", {
      socketId: socket.id,
      userId: socket.userId,
      stoppedCount: streamsToStop.length,
    });
  }

  /**
   * Cleanup all streams
   */
  static cleanup() {
    const instance = this._instance;
    if (instance) {
      instance.activeStreams.forEach((stream) => {
        try {
          if (stream.tail) {
            stream.tail.unwatch();
          }
          if (stream.process) {
            stream.process.kill();
          }
        } catch (error) {
          logger.error("Error during cleanup", error);
        }
      });
      instance.activeStreams.clear();
      logger.info("Log streaming cleanup completed");
    }
  }
}

module.exports = LogStreamingNamespace;
