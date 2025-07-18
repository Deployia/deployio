const logger = require("../../config/logger");
const { authenticateUser } = require("../../middleware/authMiddleware");

/**
 * Base WebSocket Namespace Class
 * Provides centralized authentication, error handling, and common functionality
 * for all WebSocket namespaces
 */
class WebSocketNamespace {
  constructor(namespacePath, options = {}) {
    this.namespacePath = namespacePath;
    this.options = {
      requireAuth: true,
      requireAdmin: false,
      requireVerified: false,
      ...options,
    };
    this.namespace = null;
    this.handlers = new Map();
    this.middleware = [];
    this.connectionHandlers = [];
    this.disconnectionHandlers = [];
  }

  /**
   * Initialize the namespace with the WebSocket manager
   * @param {Object} webSocketManager - WebSocket manager instance
   */
  initialize(webSocketManager) {
    this.namespace = webSocketManager.getIO().of(this.namespacePath);
    this.setupMiddleware();
    this.setupConnectionHandler();
    logger.info(`WebSocket namespace initialized: ${this.namespacePath}`, {
      requireAuth: this.options.requireAuth,
      requireAdmin: this.options.requireAdmin,
      requireVerified: this.options.requireVerified,
    });
  }

  /**
   * Set up authentication and custom middleware
   */
  setupMiddleware() {
    // Add authentication middleware if required
    if (this.options.requireAuth) {
      this.namespace.use(this.createAuthMiddleware());
    }

    // Add custom middleware
    this.middleware.forEach((middleware) => {
      this.namespace.use(middleware);
    });
  }

  /**
   * Create centralized authentication middleware
   */
  createAuthMiddleware() {
    return async (socket, next) => {
      try {
        const token = this.extractToken(socket);

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        // Use centralized authentication
        const { user, sessionId } = await authenticateUser(token);

        // Check admin requirement
        if (this.options.requireAdmin && user.role !== "admin") {
          return next(new Error("Admin privileges required"));
        }

        // Check verification requirement (if explicitly required)
        if (this.options.requireVerified && !user.isVerified) {
          return next(new Error("Account verification required"));
        }

        // Set socket user context
        this.setSocketUserContext(socket, user, sessionId);

        logger.debug(`User authenticated for ${this.namespacePath}`, {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          namespace: this.namespacePath,
        });

        next();
      } catch (error) {
        logger.error(`Authentication failed for ${this.namespacePath}`, {
          error: error.message,
          namespace: this.namespacePath,
        });
        next(new Error(error.message || "Authentication failed"));
      }
    };
  }

  /**
   * Extract authentication token from socket
   */
  extractToken(socket) {
    let token;

    // Try cookies first
    if (socket.handshake.headers.cookie) {
      const cookies = this.parseCookies(socket.handshake.headers.cookie);
      token = cookies.token;

      if (token) {
        logger.debug(`Token found in cookies for ${this.namespacePath}`, {
          namespace: this.namespacePath,
          tokenLength: token.length,
        });
      }
    }

    // Fallback to other methods
    if (!token) {
      token =
        socket.handshake.auth.token ||
        socket.handshake.query.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (token) {
        logger.debug(
          `Token found in fallback methods for ${this.namespacePath}`,
          {
            namespace: this.namespacePath,
            source: socket.handshake.auth.token
              ? "auth"
              : socket.handshake.query.token
              ? "query"
              : "authorization",
            tokenLength: token.length,
          }
        );
      }
    }

    // Validate token format (basic JWT structure check)
    if (token && typeof token === "string") {
      // JWT should have 3 parts separated by dots
      const parts = token.split(".");
      if (parts.length === 3) {
        return token;
      } else {
        logger.warn(`Invalid token format detected for ${this.namespacePath}`, {
          tokenParts: parts.length,
          namespace: this.namespacePath,
          tokenPrefix: token.substring(0, 10) + "...",
        });
        return null;
      }
    }

    logger.debug(`No token found for ${this.namespacePath}`, {
      namespace: this.namespacePath,
      hasCookies: !!socket.handshake.headers.cookie,
      hasAuth: !!socket.handshake.auth.token,
      hasQuery: !!socket.handshake.query.token,
      hasAuthorization: !!socket.handshake.headers.authorization,
    });

    return null;
  }

  /**
   * Parse cookies from cookie header
   */
  parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      if (name && valueParts.length > 0) {
        const value = valueParts.join("="); // Handle values with = in them
        try {
          cookies[name] = decodeURIComponent(value);
        } catch (e) {
          // If decoding fails, use the raw value
          cookies[name] = value;
        }
      }
    });
    return cookies;
  }

  /**
   * Set socket user context
   */
  setSocketUserContext(socket, user, sessionId) {
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
  }

  /**
   * Set up connection and disconnection handlers
   */
  setupConnectionHandler() {
    this.namespace.on("connection", (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    logger.info(`Client connected to ${this.namespacePath}`, {
      userId: socket.userId,
      userEmail: socket.userEmail,
      socketId: socket.id,
      namespace: this.namespacePath,
      userAgent: socket.handshake.headers["user-agent"],
      agentHeaders: {
        "x-agent-secret": socket.handshake.headers["x-agent-secret"]
          ? "***PRESENT***"
          : "MISSING",
        "x-agent-id": socket.handshake.headers["x-agent-id"],
        "x-agent-domain": socket.handshake.headers["x-agent-domain"],
      },
      customAuth: this.options.customAuth,
    });

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
      socket.join(`role_${socket.userRole}`);
    }

    // Set up event handlers
    this.handlers.forEach((handler, event) => {
      socket.on(event, async (...args) => {
        try {
          await handler.call(this, socket, ...args);
        } catch (error) {
          logger.error(`Handler error for ${event} in ${this.namespacePath}`, {
            error: error.message,
            userId: socket.userId,
            event,
            namespace: this.namespacePath,
          });
          socket.emit("error", {
            message: error.message,
            event,
            code: "HANDLER_ERROR",
          });
        }
      });
    });

    // Set up error handling
    socket.on("error", (error) => {
      logger.error(`Socket error in ${this.namespacePath}`, {
        error: error.message,
        userId: socket.userId,
        socketId: socket.id,
        namespace: this.namespacePath,
      });
    });

    // Set up disconnection handling
    socket.on("disconnect", (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Run custom connection handlers
    this.connectionHandlers.forEach((handler) => {
      try {
        handler.call(this, socket);
      } catch (error) {
        logger.error(`Connection handler error in ${this.namespacePath}`, {
          error: error.message,
          userId: socket.userId,
        });
      }
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket, reason) {
    logger.info(`Client disconnected from ${this.namespacePath}`, {
      userId: socket.userId,
      socketId: socket.id,
      reason,
      namespace: this.namespacePath,
    });

    // Run custom disconnection handlers
    this.disconnectionHandlers.forEach((handler) => {
      try {
        handler.call(this, socket, reason);
      } catch (error) {
        logger.error(`Disconnection handler error in ${this.namespacePath}`, {
          error: error.message,
          userId: socket.userId,
        });
      }
    });
  }

  /**
   * Register an event handler
   * @param {String} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    this.handlers.set(event, handler);
    return this;
  }

  /**
   * Add custom middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Add connection handler
   * @param {Function} handler - Connection handler function
   */
  onConnection(handler) {
    this.connectionHandlers.push(handler);
    return this;
  }

  /**
   * Add disconnection handler
   * @param {Function} handler - Disconnection handler function
   */
  onDisconnection(handler) {
    this.disconnectionHandlers.push(handler);
    return this;
  }

  /**
   * Emit to all clients in namespace
   * @param {String} event - Event name
   * @param {*} data - Data to emit
   */
  emit(event, data) {
    if (this.namespace) {
      this.namespace.emit(event, data);
    }
  }

  /**
   * Emit to specific user
   * @param {String} userId - User ID
   * @param {String} event - Event name
   * @param {*} data - Data to emit
   */
  emitToUser(userId, event, data) {
    if (this.namespace) {
      this.namespace.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Emit to users with specific role
   * @param {String} role - User role
   * @param {String} event - Event name
   * @param {*} data - Data to emit
   */
  emitToRole(role, event, data) {
    if (this.namespace) {
      this.namespace.to(`role_${role}`).emit(event, data);
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedCount() {
    return this.namespace ? this.namespace.sockets.size : 0;
  }

  /**
   * Get namespace info
   */
  getInfo() {
    return {
      namespacePath: this.namespacePath,
      connectedClients: this.getConnectedCount(),
      options: this.options,
      handlers: Array.from(this.handlers.keys()),
    };
  }
}

module.exports = WebSocketNamespace;
