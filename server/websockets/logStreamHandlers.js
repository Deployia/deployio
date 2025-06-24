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
    // Create a namespace with proper middleware and handler structure
    const namespace = "/logs";

    // First register the namespace with the handlers
    webSocketManager.registerNamespace(namespace, {
      connection: (socket) => this.handleConnection(socket),
      disconnect: (socket) => this.handleDisconnection(socket),
      "stream:start": (socket, data) => this.startLogStream(socket, data),
      "stream:stop": (socket, data) => this.stopLogStream(socket, data),
      "stream:list": (socket) => this.listAvailableStreams(socket),
    });

    // Get the actual namespace object to add middleware
    const logsNamespace = webSocketManager.getIO().of(namespace);

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

        logger.debug("WebSocket log streaming user authenticated", {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          sessionId: sessionId,
        });

        next();
      } catch (error) {
        logger.error("WebSocket log streaming authentication failed", {
          error: error.message,
          socketId: socket.id,
        });
        const errorMessage =
          error.name === "JsonWebTokenError"
            ? "Invalid authentication token"
            : error.message;
        next(new Error(errorMessage));
      }
    });

    logger.info("Log streaming WebSocket namespace registered successfully", {
      namespace,
      features: ["real-time streaming", "historical logs", "admin-only access"],
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
   * Send recent lines from log file with platform-agnostic reading
   */
  async sendRecentLines(socket, streamId, logPath, lines) {
    try {
      const fs = require("fs");
      const execPromise = util.promisify(exec);

      // Check if file exists
      if (!fs.existsSync(logPath)) {
        socket.emit("stream:error", {
          streamId,
          error: `Log file not found: ${logPath}`,
        });
        return;
      }

      // Platform-agnostic log reading
      const readRecentLines = async (filePath, numLines) => {
        let command;
        let useNodeFallback = false;

        // Try platform-specific commands first
        if (process.platform === "win32") {
          // Windows PowerShell with error handling
          command = `powershell -Command "try { Get-Content -Path '${filePath.replace(
            /'/g,
            "''"
          )}' -Tail ${numLines} -ErrorAction Stop } catch { exit 1 }"`;
        } else {
          // Unix-like systems (Linux, macOS)
          command = `tail -n ${numLines} "${filePath}"`;
        }

        try {
          const { stdout, stderr } = await execPromise(command);
          if (stderr && stderr.trim()) {
            logger.warn(`Command stderr for ${streamId}: ${stderr}`);
          }
          return stdout;
        } catch (cmdError) {
          logger.warn(
            `Platform command failed for ${streamId}, using Node.js fallback: ${cmdError.message}`
          );
          useNodeFallback = true;
        }

        if (useNodeFallback) {
          // Node.js fallback for cross-platform compatibility
          const fileContent = await fs.promises.readFile(filePath, "utf8");
          const allLines = fileContent.split(/\r?\n/);
          const recentLines = allLines.slice(-numLines);
          return recentLines.join("\n");
        }

        throw new Error("All log reading methods failed");
      };

      const stdout = await readRecentLines(logPath, lines);
      const recentLines = stdout
        .trim()
        .split(/\r?\n/)
        .filter((line) => line.trim());

      // Send recent lines
      recentLines.forEach((line, index) => {
        const parsedLine = this.parseLogLine(
          line,
          this.getLogConfig(streamId.split("-")[0])?.format || "text"
        );

        socket.emit("stream:data", {
          streamId,
          timestamp: new Date().toISOString(),
          data: parsedLine,
          raw: line,
          historical: true,
          index,
        });
      });

      socket.emit("stream:history-complete", {
        streamId,
        count: recentLines.length,
        method: "platform-agnostic",
      });
    } catch (error) {
      logger.error(`Error reading recent lines for ${streamId}:`, error);
      socket.emit("stream:error", {
        streamId,
        error: `Failed to read recent log lines: ${error.message}`,
        logPath,
      });
    }
  }

  /**
   * Parse log line based on format
   */
  parseLogLine(line, format) {
    try {
      switch (format) {
        case "json":
          return JSON.parse(line);

        case "winston":
          // Parse Winston format: timestamp [level]: message
          const winstonMatch = line.match(
            /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+\[(\w+)\]:\s+(.+)$/
          );
          if (winstonMatch) {
            return {
              timestamp: winstonMatch[1],
              level: winstonMatch[2],
              message: winstonMatch[3],
              parsed: true,
            };
          }
          break;

        case "uvicorn":
          // Parse Uvicorn format: INFO:     message
          const uvicornMatch = line.match(/^(\w+):\s+(.+)$/);
          if (uvicornMatch) {
            return {
              level: uvicornMatch[1],
              message: uvicornMatch[2],
              parsed: true,
            };
          }
          break;

        default:
          // Return as plain text
          return {
            message: line,
            parsed: false,
          };
      }
    } catch (error) {
      // Return raw line if parsing fails
      return {
        message: line,
        parsed: false,
        parseError: error.message,
      };
    }

    // Fallback for unmatched patterns
    return {
      message: line,
      parsed: false,
    };
  }
  /**
   * Get log configuration for a specific log type with platform-agnostic paths
   */
  getLogConfig(logType) {
    const fs = require("fs");

    // Platform-agnostic path detection
    const findLogFile = (possiblePaths) => {
      for (const logPath of possiblePaths) {
        if (fs.existsSync(logPath)) {
          return logPath;
        }
      }
      return possiblePaths[0]; // Return first path as fallback
    };

    const logConfigs = {
      backend: {
        name: "Express Server",
        description: "Main Express.js server logs",
        paths: [
          // Development paths
          path.join(process.cwd(), "logs", "combined.log"),
          path.join(process.cwd(), "server", "logs", "combined.log"),
          // Docker paths
          "/app/logs/combined.log",
          "/usr/src/app/logs/combined.log",
          // EC2 Ubuntu paths
          "/home/ubuntu/deployio/server/logs/combined.log",
          "/opt/deployio/server/logs/combined.log",
        ],
        format: "winston",
      },
      "backend-error": {
        name: "Express Server Errors",
        description: "Express.js server error logs",
        paths: [
          // Development paths
          path.join(process.cwd(), "logs", "error.log"),
          path.join(process.cwd(), "server", "logs", "error.log"),
          // Docker paths
          "/app/logs/error.log",
          "/usr/src/app/logs/error.log",
          // EC2 Ubuntu paths
          "/home/ubuntu/deployio/server/logs/error.log",
          "/opt/deployio/server/logs/error.log",
        ],
        format: "winston",
      },
      agent: {
        name: "DeployIO Agent",
        description: "FastAPI agent service logs",
        paths: [
          // Development paths
          path.join(process.cwd(), "..", "agent", "logs", "agent.log"),
          path.join(process.cwd(), "agent", "logs", "agent.log"),
          // Docker paths
          "/app/logs/agent.log",
          "/usr/src/app/logs/agent.log",
          // EC2 Ubuntu paths (may be on different instance)
          "/home/ubuntu/deployio/agent/logs/agent.log",
          "/opt/deployio/agent/logs/agent.log",
        ],
        format: "uvicorn",
      },
      "ai-service": {
        name: "AI Service",
        description: "FastAPI AI service logs",
        paths: [
          // Development paths
          path.join(
            process.cwd(),
            "..",
            "ai-service",
            "logs",
            "ai-service.log"
          ),
          path.join(process.cwd(), "ai-service", "logs", "ai-service.log"),
          // Docker paths
          "/app/logs/ai-service.log",
          "/usr/src/app/logs/ai-service.log",
          // EC2 Ubuntu paths
          "/home/ubuntu/deployio/ai-service/logs/ai-service.log",
          "/opt/deployio/ai-service/logs/ai-service.log",
        ],
        format: "uvicorn",
      },
      access: {
        name: "Access Logs",
        description: "HTTP access logs",
        paths: [
          // Development paths
          path.join(process.cwd(), "logs", "access.log"),
          path.join(process.cwd(), "server", "logs", "access.log"),
          // Docker paths
          "/app/logs/access.log",
          "/usr/src/app/logs/access.log",
          // EC2 Ubuntu paths
          "/home/ubuntu/deployio/server/logs/access.log",
          "/opt/deployio/server/logs/access.log",
        ],
        format: "text",
      },
    };

    const config = logConfigs[logType];
    if (!config) {
      return null;
    }

    // Find the actual log file path
    const actualPath = findLogFile(config.paths);

    return {
      name: config.name,
      description: config.description,
      path: actualPath,
      format: config.format,
      availablePaths: config.paths,
      exists: fs.existsSync(actualPath),
    };
  }

  /**
   * Get available log types
   */ getAvailableLogTypes() {
    return ["backend", "backend-error", "agent", "ai-service", "access"];
  }

  /**
   * Cleanup method for graceful shutdown
   */
  cleanup() {
    // Stop all active tail watchers
    this.logWatchers.forEach((tail, key) => {
      try {
        tail.unwatch();
      } catch (error) {
        logger.error(`Error stopping tail watcher ${key}:`, error);
      }
    });

    this.logWatchers.clear();
    this.activeStreams.clear();

    logger.info("Log streaming handlers cleaned up");
  }

  /**
   * Parse cookies from cookie header string (helper method)
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
}

module.exports = new LogStreamHandlers();
