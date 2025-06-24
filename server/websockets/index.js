const webSocketManager = require("../config/webSocketManager");
const notificationHandlers = require("./notificationHandlers");
const logStreamHandlers = require("./logStreamHandlers");
const logger = require("../config/logger");

/**
 * WebSocket Initialization Module
 * Sets up all WebSocket namespaces and handlers following the modular architecture pattern
 * @param {Object} server - HTTP server instance
 * @param {Object} options - Configuration options
 */
function initializeWebSockets(server, options = {}) {
  logger.info("Initializing WebSocket services...");

  // Default WebSocket configuration
  const defaultConfig = {
    // Socket.IO server options
    socketIO: {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
    },

    // Authentication options
    auth: {
      required: true,
      tokenExtractor: null, // Custom token extractor function
      userProvider: null, // Custom user provider function
    }, // Feature flags
    features: {
      notifications: true,
      chat: false, // Future: Real-time chat
      logStreaming: true, // System log streaming
      deploymentLogs: false, // Future: Real-time deployment logs
      systemMonitoring: false, // Future: Real-time system monitoring
    },

    // Namespace configurations
    namespaces: {
      notifications: "/notifications",
      chat: "/chat",
      logs: "/logs",
      monitoring: "/monitoring",
    },
  };

  const config = { ...defaultConfig, ...options };

  try {
    // Initialize WebSocket manager
    const io = webSocketManager.initialize(server, config.socketIO);

    // Add authentication middleware if required
    if (config.auth.required) {
      webSocketManager.addAuthMiddleware({
        tokenExtractor: config.auth.tokenExtractor,
        userProvider: config.auth.userProvider,
      });
    }

    // Set up namespaces based on enabled features
    setupEnabledNamespaces(config);

    // Add global connection handlers
    setupGlobalHandlers();

    logger.info("WebSocket services initialized successfully", {
      enabledFeatures: Object.entries(config.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature),
      namespaces: Object.entries(config.namespaces)
        .filter(([feature]) => config.features[feature])
        .map(([, namespace]) => namespace),
    });

    return io;
  } catch (error) {
    logger.error("Failed to initialize WebSocket services", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Set up namespaces based on enabled features
 * @param {Object} config - Configuration object
 */
function setupEnabledNamespaces(config) {
  // Notifications namespace
  if (config.features.notifications) {
    webSocketManager.registerNamespace(
      config.namespaces.notifications,
      notificationHandlers
    );
    logger.info("Notifications WebSocket namespace registered", {
      namespace: config.namespaces.notifications,
    });
  }

  // Chat namespace (future feature)
  if (config.features.chat) {
    // const chatHandlers = require("./chatHandlers");
    // webSocketManager.registerNamespace(config.namespaces.chat, chatHandlers);
    logger.info("Chat WebSocket namespace would be registered", {
      namespace: config.namespaces.chat,
      status: "not_implemented",
    });
  }
  // System log streaming namespace
  if (config.features.logStreaming) {
    logStreamHandlers.register(webSocketManager);
    logger.info("System log streaming WebSocket namespace registered", {
      namespace: "/logs",
      status: "active",
    });
  }

  // System monitoring namespace (future feature)
  if (config.features.systemMonitoring) {
    // const monitoringHandlers = require("./monitoringHandlers");
    // webSocketManager.registerNamespace(config.namespaces.monitoring, monitoringHandlers);
    logger.info("System monitoring WebSocket namespace would be registered", {
      namespace: config.namespaces.monitoring,
      status: "not_implemented",
    });
  }
}

/**
 * Set up global connection handlers
 */
function setupGlobalHandlers() {
  // Add connection analytics
  webSocketManager.addConnectionHandler((socket) => {
    // Track connection metrics
    logger.debug("WebSocket connection established", {
      userId: socket.userId,
      userAgent: socket.handshake.headers["user-agent"],
      ip: socket.handshake.address,
      timestamp: new Date().toISOString(),
    });
  });

  // Add error handling
  webSocketManager.addConnectionHandler((socket) => {
    socket.on("error", (error) => {
      logger.error("WebSocket client error", {
        userId: socket.userId,
        socketId: socket.id,
        error: error.message,
      });
    });
  });

  // Add rate limiting (future feature)
  // webSocketManager.addConnectionHandler(setupRateLimiting);
}

/**
 * Get WebSocket manager instance
 * @returns {Object} WebSocket manager instance
 */
function getWebSocketManager() {
  return webSocketManager;
}

/**
 * Graceful shutdown for WebSocket connections
 */
function shutdownWebSockets() {
  logger.info("Shutting down WebSocket services...");

  if (webSocketManager.getIO()) {
    // Notify all clients about shutdown
    webSocketManager.broadcast("server_shutdown", {
      message: "Server is shutting down",
      timestamp: new Date().toISOString(),
    });

    // Cleanup log stream handlers
    try {
      logStreamHandlers.cleanup();
    } catch (error) {
      logger.error("Error cleaning up log stream handlers:", error);
    }

    // Close all connections
    webSocketManager.getIO().close();
    logger.info("WebSocket services shut down successfully");
  }
}

module.exports = {
  initializeWebSockets,
  getWebSocketManager,
  shutdownWebSockets,

  // Re-export manager for direct access
  webSocketManager,
};
