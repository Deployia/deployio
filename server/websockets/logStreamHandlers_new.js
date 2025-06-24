const fs = require("fs");
const path = require("path");
const { Tail } = require("tail");
const logger = require("@config/logger");
const jwt = require("jsonwebtoken");
const User = require("@models/User");
const { exec } = require("child_process");
const util = require("util");

/**
 * Log Streaming WebSocket Handlers
 * Provides real-time log streaming from server and connected services
 */
class LogStreamHandlers {
  constructor() {
    this.logWatchers = new Map();
    this.activeStreams = new Map();
  }

  /**
   * Register log streaming handlers with WebSocket manager
   * @param {Object} webSocketManager - WebSocket manager instance
   */
  register(webSocketManager) {
    // Register namespace using the same pattern as notifications
    webSocketManager.registerNamespace("/logs", {
      "stream:start": this.startLogStream.bind(this),
      "stream:stop": this.stopLogStream.bind(this),
      "stream:list": this.listAvailableStreams.bind(this),
    });

    // Get the namespace and add authentication middleware
    const logsNamespace = webSocketManager.getIO().of("/logs");

    // Add authentication middleware specifically for this namespace
    logsNamespace.use(async (socket, next) => {
      try {
        let token;

        // Extract token from cookies first (same as Express middleware)
        if (socket.handshake.headers.cookie) {
          const cookies = this.parseCookies(socket.handshake.headers.cookie);
          token = cookies.token;
        }

        // Fallback to other methods
        if (!token) {
          token =
            socket.handshake.auth.token ||
            socket.handshake.query.token ||
            socket.handshake.headers.authorization?.replace("Bearer ", "");
        }

        if (!token) {
          return next(
            new Error("Authentication token required for log streaming")
          );
        }

        // Verify JWT token using the same secret and logic as Express
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, sessionId } = decoded;

        if (!id) {
          return next(new Error("Invalid token format"));
        }

        const user = await User.findById(id);

        if (!user) {
          return next(new Error("User not found"));
        }

        // Same user validation as Express middleware
        if (!user.isVerified) {
          return next(new Error("Account not verified"));
        }

        if (user.status !== "active") {
          return next(new Error("Account is not active"));
        }

        // Admin check for log streaming access
        if (user.role !== "admin") {
          return next(new Error("Admin privileges required for log streaming"));
        }

        // Set socket user info (consistent with Express req.user)
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.userEmail = user.email;
        socket.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          status: user.status,
        };
        socket.sessionId = sessionId;

        next();
      } catch (error) {
        const errorMessage =
          error.name === "JsonWebTokenError"
            ? "Invalid authentication token"
            : error.message;
        next(new Error(errorMessage));
      }
    });

    // Add connection and disconnection handlers
    logsNamespace.on("connection", (socket) => {
      this.handleConnection(socket);

      socket.on("disconnect", () => {
        this.handleDisconnection(socket);
      });
    });
  }

  /**
   * Handle new connection to log streaming namespace
   */
  handleConnection(socket) {
    logger.info(
      `Log streaming client connected: ${socket.id} (User: ${socket.userEmail}, Role: ${socket.userRole})`
    );

    // Send available log streams
    this.listAvailableStreams(socket);
  }

  /**
   * Handle disconnection from log streaming namespace
   */
  handleDisconnection(socket) {
    logger.info(
      `Log streaming client disconnected: ${socket.id} (User: ${socket.userEmail})`
    );

    // Stop all streams for this socket
    const activeStreams = this.activeStreams.get(socket.id) || [];
    activeStreams.forEach((streamId) => {
      this.stopLogStream(socket, { streamId });
    });

    this.activeStreams.delete(socket.id);
  }

  /**
   * Start streaming logs for a specific service/file
   */
  async startLogStream(socket, { streamId, logType, lines = 50 }) {
    try {
      const logConfig = this.getLogConfig(logType);
      if (!logConfig) {
        socket.emit("stream:error", {
          streamId,
          error: "Invalid log type",
          availableTypes: this.getAvailableLogTypes(),
        });
        return;
      }

      // Check if log file exists
      if (!fs.existsSync(logConfig.path)) {
        socket.emit("stream:error", {
          streamId,
          error: `Log file not found: ${logConfig.path}`,
        });
        return;
      }

      // Send initial recent lines
      await this.sendRecentLines(socket, streamId, logConfig.path, lines);

      // Start tailing the log file
      const tail = new Tail(logConfig.path, {
        separator: /[\r]{0,1}\n/,
        fromBeginning: false,
        fsWatchOptions: {
          interval: 1000,
        },
        follow: true,
      });

      // Handle new log lines
      tail.on("line", (data) => {
        try {
          // Parse log line based on log type
          const parsedLine = this.parseLogLine(data, logConfig.format);

          socket.emit("stream:data", {
            streamId,
            logType,
            timestamp: new Date().toISOString(),
            data: parsedLine,
            raw: data,
          });
        } catch (error) {
          logger.error(
            `Error processing log line for stream ${streamId}:`,
            error
          );
        }
      });

      // Handle tail errors
      tail.on("error", (error) => {
        logger.error(`Tail error for stream ${streamId}:`, error);
        socket.emit("stream:error", {
          streamId,
          error: `Log streaming error: ${error.message}`,
        });
      });

      // Store the tail watcher
      const watcherKey = `${socket.id}:${streamId}`;
      this.logWatchers.set(watcherKey, tail);

      // Track active streams for this socket
      if (!this.activeStreams.has(socket.id)) {
        this.activeStreams.set(socket.id, []);
      }
      this.activeStreams.get(socket.id).push(streamId);

      socket.emit("stream:started", {
        streamId,
        logType,
        path: logConfig.path,
        message: `Started streaming ${logType} logs`,
      });

      logger.info(
        `Started log stream: ${streamId} (${logType}) for user ${socket.userEmail}`
      );
    } catch (error) {
      logger.error(`Error starting log stream ${streamId}:`, error);
      socket.emit("stream:error", {
        streamId,
        error: `Failed to start log stream: ${error.message}`,
      });
    }
  }

  /**
   * Stop streaming logs for a specific stream
   */
  stopLogStream(socket, { streamId }) {
    try {
      const watcherKey = `${socket.id}:${streamId}`;
      const tail = this.logWatchers.get(watcherKey);

      if (tail) {
        tail.unwatch();
        this.logWatchers.delete(watcherKey);

        // Remove from active streams
        const activeStreams = this.activeStreams.get(socket.id) || [];
        const updatedStreams = activeStreams.filter((id) => id !== streamId);
        this.activeStreams.set(socket.id, updatedStreams);

        socket.emit("stream:stopped", {
          streamId,
          message: `Stopped streaming logs for ${streamId}`,
        });

        logger.info(
          `Stopped log stream: ${streamId} for user ${socket.userEmail}`
        );
      } else {
        socket.emit("stream:error", {
          streamId,
          error: "Stream not found or already stopped",
        });
      }
    } catch (error) {
      logger.error(`Error stopping log stream ${streamId}:`, error);
      socket.emit("stream:error", {
        streamId,
        error: `Failed to stop log stream: ${error.message}`,
      });
    }
  }

  /**
   * List available log streams
   */
  listAvailableStreams(socket) {
    const availableStreams = this.getAvailableLogTypes().map((logType) => {
      const config = this.getLogConfig(logType);
      return {
        id: logType,
        name: config.name,
        description: config.description,
        path: config.path,
        available: fs.existsSync(config.path),
        format: config.format,
      };
    });

    socket.emit("stream:available", { streams: availableStreams });
  }

  /**
   * Send recent lines from a log file
   */
  async sendRecentLines(socket, streamId, logPath, lines) {
    try {
      const execPromise = util.promisify(exec);

      // Platform-agnostic command to get recent lines
      let command;
      if (process.platform === "win32") {
        // Use PowerShell on Windows
        command = `powershell "Get-Content -Path '${logPath}' -Tail ${lines}"`;
      } else {
        // Use tail on Unix-like systems
        command = `tail -n ${lines} "${logPath}"`;
      }

      const { stdout } = await execPromise(command);
      const logLines = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      // Send each line as historical data
      logLines.forEach((line, index) => {
        const parsed = this.parseLogLine(line, "json");
        socket.emit("stream:data", {
          streamId,
          timestamp: new Date().toISOString(),
          data: {
            ...parsed,
            historical: true,
            index,
          },
          raw: line,
        });
      });

      socket.emit("stream:history-complete", {
        streamId,
        totalLines: logLines.length,
      });
    } catch (error) {
      logger.error(`Error reading recent lines from ${logPath}:`, error);
      socket.emit("stream:error", {
        streamId,
        error: `Failed to read recent logs: ${error.message}`,
      });
    }
  }

  /**
   * Parse log line based on format
   */
  parseLogLine(line, format) {
    try {
      // Try to parse as JSON first (for structured logs)
      if (line.startsWith("{")) {
        const parsed = JSON.parse(line);
        return {
          parsed: true,
          timestamp: parsed.timestamp,
          level: parsed.level,
          message: parsed.message,
          service: parsed.service,
          ...parsed,
        };
      }

      // Fallback to basic parsing
      return {
        parsed: false,
        level: "INFO",
        message: line,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        parsed: false,
        level: "INFO",
        message: line,
        timestamp: new Date().toISOString(),
        parseError: error.message,
      };
    }
  }

  /**
   * Get log configuration for a service type
   */
  getLogConfig(logType) {
    const logConfigs = {
      backend: {
        name: "Backend Service",
        description: "Express.js backend server logs",
        path: path.join(process.cwd(), "logs", "combined.log"),
        format: "json",
      },
      "ai-service": {
        name: "AI Service",
        description: "FastAPI AI service logs",
        path: path.join(
          process.cwd(),
          "..",
          "ai-service",
          "logs",
          "ai-service.log"
        ),
        format: "json",
      },
      agent: {
        name: "DeployIO Agent",
        description: "Deployment agent logs",
        path: path.join(process.cwd(), "..", "agent", "logs", "agent.log"),
        format: "json",
      },
    };

    return logConfigs[logType];
  }

  /**
   * Get available log types
   */
  getAvailableLogTypes() {
    return ["backend", "ai-service", "agent"];
  }

  /**
   * Parse cookies from cookie header string
   */
  parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }

  /**
   * Cleanup method for graceful shutdown
   */
  cleanup() {
    // Stop all active watchers
    for (const [key, tail] of this.logWatchers) {
      try {
        tail.unwatch();
      } catch (error) {
        logger.error(`Error stopping log watcher ${key}:`, error);
      }
    }

    this.logWatchers.clear();
    this.activeStreams.clear();

    logger.info("Log streaming handlers cleaned up successfully");
  }
}

module.exports = new LogStreamHandlers();
