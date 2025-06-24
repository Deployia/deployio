const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./logger");

/**
 * WebSocket Configuration Module
 * Provides a modular, reusable WebSocket infrastructure for multiple use cases
 */
class WebSocketManager {
  constructor() {
    this.io = null;
    this.middlewares = [];
    this.eventHandlers = new Map();
    this.namespaces = new Map();
    this.connectionHandlers = [];
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   * @param {Object} options - Socket.IO configuration options
   */
  initialize(server, options = {}) {
    const defaultOptions = {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
    };

    this.io = new Server(server, { ...defaultOptions, ...options });

    // Make available globally for backward compatibility
    global.io = this.io;

    // Apply middleware
    this.middlewares.forEach((middleware) => {
      this.io.use(middleware);
    });

    // Set up connection handling
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
    });

    logger.info("WebSocket server initialized successfully");
    return this.io;
  }

  /**
   * Add authentication middleware
   * @param {Object} options - Authentication options
   */
  addAuthMiddleware(options = {}) {
    const { tokenExtractor, userProvider } = options;

    const authMiddleware = async (socket, next) => {
      try {
        let token;

        // Extract token using custom extractor or default method
        if (tokenExtractor) {
          token = tokenExtractor(socket);
        } else {
          token =
            socket.handshake.auth.token ||
            socket.handshake.query.token ||
            socket.handshake.headers.authorization?.replace("Bearer ", "");
        }

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user info using custom provider or default
        let user = decoded;
        if (userProvider) {
          user = await userProvider(decoded.id);
        }

        // Add user info to socket
        socket.userId = decoded.id;
        socket.userRole = decoded.role || user?.role;
        socket.user = user;

        logger.debug("WebSocket user authenticated", {
          userId: decoded.id,
          role: socket.userRole,
        });

        next();
      } catch (error) {
        logger.error("WebSocket authentication failed", {
          error: error.message,
          socketId: socket.id,
        });
        next(new Error("Authentication failed"));
      }
    };

    this.middlewares.push(authMiddleware);
    return this;
  }

  /**
   * Add custom middleware
   * @param {Function} middleware - Socket.IO middleware function
   */
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Register a namespace with its handlers
   * @param {String} namespace - Namespace path (e.g., '/notifications', '/chat')
   * @param {Object} handlers - Event handlers for this namespace
   */
  registerNamespace(namespace, handlers) {
    this.namespaces.set(namespace, handlers);

    if (this.io) {
      const nsp = this.io.of(namespace);
      this.setupNamespace(nsp, handlers);
    }

    return this;
  }

  /**
   * Set up namespace with handlers
   * @param {Object} namespace - Socket.IO namespace
   * @param {Object} handlers - Event handlers
   */
  setupNamespace(namespace, handlers) {
    namespace.on("connection", (socket) => {
      logger.info(`Client connected to namespace ${namespace.name}`, {
        userId: socket.userId,
        socketId: socket.id,
      });

      // Join user to their personal room
      if (socket.userId) {
        socket.join(`user_${socket.userId}`);
      }

      // Set up event handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.on(event, (...args) => {
          try {
            handler(socket, ...args);
          } catch (error) {
            logger.error(
              `Error in ${event} handler for namespace ${namespace.name}`,
              {
                error: error.message,
                userId: socket.userId,
                socketId: socket.id,
              }
            );
            socket.emit("error", {
              event,
              message: "Internal server error",
              code: "HANDLER_ERROR",
            });
          }
        });
      });

      // Common disconnect handler
      socket.on("disconnect", (reason) => {
        logger.info(`Client disconnected from namespace ${namespace.name}`, {
          userId: socket.userId,
          socketId: socket.id,
          reason,
        });
      });
    });
  }

  /**
   * Add a global connection handler
   * @param {Function} handler - Connection handler function
   */
  addConnectionHandler(handler) {
    this.connectionHandlers.push(handler);
    return this;
  }

  /**
   * Handle new connections
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    logger.info("WebSocket client connected", {
      userId: socket.userId,
      socketId: socket.id,
      userAgent: socket.handshake.headers["user-agent"],
    });

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Send connection confirmation
    socket.emit("connected", {
      message: "Connected to WebSocket server",
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });

    // Set up common event handlers
    this.setupCommonHandlers(socket);

    // Apply custom connection handlers
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(socket);
      } catch (error) {
        logger.error("Error in connection handler", {
          error: error.message,
          userId: socket.userId,
          socketId: socket.id,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      logger.info("WebSocket client disconnected", {
        userId: socket.userId,
        socketId: socket.id,
        reason,
      });
    });
  }

  /**
   * Set up common event handlers for all connections
   * @param {Object} socket - Socket instance
   */
  setupCommonHandlers(socket) {
    // Health check ping-pong
    socket.on("ping", () => {
      socket.emit("pong", {
        timestamp: new Date().toISOString(),
      });
    });

    // Join room
    socket.on("join_room", (roomName) => {
      if (typeof roomName === "string" && roomName.length < 100) {
        socket.join(roomName);
        socket.emit("joined_room", { room: roomName });
        logger.debug("Socket joined room", {
          userId: socket.userId,
          socketId: socket.id,
          room: roomName,
        });
      } else {
        socket.emit("error", {
          message: "Invalid room name",
          code: "INVALID_ROOM",
        });
      }
    });

    // Leave room
    socket.on("leave_room", (roomName) => {
      socket.leave(roomName);
      socket.emit("left_room", { room: roomName });
      logger.debug("Socket left room", {
        userId: socket.userId,
        socketId: socket.id,
        room: roomName,
      });
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error("WebSocket socket error", {
        userId: socket.userId,
        socketId: socket.id,
        error: error.message,
      });
    });
  }

  /**
   * Get Socket.IO instance
   */
  getIO() {
    return this.io;
  }

  /**
   * Emit to specific user
   * @param {String} userId - User ID
   * @param {String} event - Event name
   * @param {Object} data - Data to send
   */
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Emit to specific room
   * @param {String} room - Room name
   * @param {String} event - Event name
   * @param {Object} data - Data to send
   */
  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  /**
   * Broadcast to all connected clients
   * @param {String} event - Event name
   * @param {Object} data - Data to send
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Get connected clients count
   */
  async getConnectedCount() {
    if (!this.io) return 0;
    const sockets = await this.io.fetchSockets();
    return sockets.length;
  }

  /**
   * Get user's connected sockets
   * @param {String} userId - User ID
   */
  async getUserSockets(userId) {
    if (!this.io) return [];
    const room = `user_${userId}`;
    const sockets = await this.io.in(room).fetchSockets();
    return sockets;
  }
}

// Export singleton instance
const webSocketManager = new WebSocketManager();

module.exports = webSocketManager;
