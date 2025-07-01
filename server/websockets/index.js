const webSocketManager = require("../config/webSocketManager");
const webSocketRegistry = require("./core/WebSocketRegistry");
const logger = require("../config/logger");

// Import namespace classes
const NotificationsNamespace = require("./namespaces/NotificationsNamespace");
const LogStreamingNamespace = require("./namespaces/LogStreamingNamespace");
const MetricsNamespace = require("./namespaces/MetricsNamespace");
const ChatNamespace = require("./namespaces/ChatNamespace");
const BuildLogsNamespace = require("./namespaces/BuildLogsNamespace");
const AINamespace = require("./namespaces/AINamespace");

/**
 * WebSocket Initialization Module
 * Centralized WebSocket setup with modular namespace architecture
 * @param {Object} server - HTTP server instance
 * @param {Object} options - Configuration options
 */
function initializeWebSockets(server, options = {}) {
  logger.info("Initializing centralized WebSocket services...");

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

    // Feature flags for enabling/disabling namespaces
    features: {
      notifications: true,
      logStreaming: true,
      metrics: true, // New metrics streaming
      agentBridge: true, // NEW: Agent bridge for remote log streaming - ENABLED
      ai: true, // NEW: AI analysis and generation - ENABLED
      chat: false, // Future: Real-time chat
      buildLogs: false, // Future: Build log streaming
    },

    // Global WebSocket options
    auth: {
      required: true,
    },
  };

  const config = { ...defaultConfig, ...options };

  try {
    // Initialize WebSocket manager
    const io = webSocketManager.initialize(server, config.socketIO);

    // Initialize the registry with the WebSocket manager
    webSocketRegistry.initialize(webSocketManager);

    // Add global authentication middleware to WebSocket manager
    if (config.auth.required) {
      webSocketManager.addAuthMiddleware();
    }

    // Initialize enabled namespaces
    setupNamespaces(config.features);

    // Add global connection handlers
    setupGlobalHandlers();

    // Log successful initialization
    const enabledFeatures = Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);

    const registryStats = webSocketRegistry.getStats();

    logger.info("Centralized WebSocket services initialized successfully", {
      enabledFeatures,
      totalNamespaces: registryStats.totalNamespaces,
      namespaces: Object.keys(registryStats.namespaces),
      architecture: "modular",
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
 * @param {Object} features - Feature flags
 */
function setupNamespaces(features) {
  logger.info("Setting up WebSocket namespaces...", { features });

  // Notifications namespace - Always initialize if enabled
  if (features.notifications) {
    try {
      NotificationsNamespace.initialize();
      logger.info("✓ Notifications namespace initialized", {
        namespace: "/notifications",
        requireAuth: true,
        requireAdmin: false,
      });
    } catch (error) {
      logger.error("✗ Failed to initialize notifications namespace", {
        error: error.message,
      });
    }
  }

  // Log streaming namespace - Unified version
  if (features.logStreaming) {
    try {
      // Use unified log streaming namespace
      LogStreamingNamespace.initialize();
      logger.info("✓ Log streaming namespace initialized", {
        namespace: "/logs",
        requireAuth: true,
        features: ["system-logs", "user-logs", "metrics", "room-based"],
      });
    } catch (error) {
      logger.error("✗ Failed to initialize log streaming namespace", {
        error: error.message,
      });
    }
  }

  // Metrics streaming namespace - Admin only
  if (features.metrics) {
    try {
      MetricsNamespace.initialize();
      logger.info("✓ Metrics streaming namespace initialized", {
        namespace: "/metrics",
        requireAuth: true,
        requireAdmin: true,
      });
    } catch (error) {
      logger.error("✗ Failed to initialize metrics streaming namespace", {
        error: error.message,
      });
    }
  }

  // AI namespace - AI analysis and configuration generation
  if (features.ai) {
    try {
      AINamespace.initialize();
      logger.info("✓ AI namespace initialized", {
        namespace: "/ai",
        requireAuth: true,
        requireVerified: true,
        features: [
          "repository-analysis",
          "config-generation",
          "real-time-progress",
        ],
      });
    } catch (error) {
      logger.error("✗ Failed to initialize AI namespace", {
        error: error.message,
      });
    }
  } else {
    logger.debug("AI namespace disabled", {
      namespace: "/ai",
      status: "disabled_in_config",
    });
  }

  // Agent bridge namespace - NEW IMPLEMENTATION
  if (features.agentBridge) {
    try {
      const agentBridgeService = require("../services/bridge/AgentBridgeService");

      // Initialize agent bridge service
      agentBridgeService.initialize().then((success) => {
        if (success) {
          // Integrate with log collector service
          try {
            const {
              logCollectorService,
            } = require("../services/logging/LogCollectorService");
            if (logCollectorService.integrateBridgeService) {
              logCollectorService.integrateBridgeService(agentBridgeService);
              logger.info(
                "✓ Agent bridge integrated with log collector service"
              );
            }
          } catch (integrationError) {
            logger.error("✗ Failed to integrate bridge with log collector", {
              error: integrationError.message,
            });
          }

          logger.info("✓ Agent bridge service initialized", {
            namespace: "/agent-bridge",
            status: "active",
            features: [
              "agent-authentication",
              "stream-routing",
              "ai-integration",
              "log-collection-bridge",
            ],
          });
        } else {
          logger.error("✗ Failed to initialize agent bridge service");
        }
      });
    } catch (error) {
      logger.error("✗ Failed to load agent bridge service", {
        error: error.message,
      });
    }
  } else {
    logger.debug("Agent bridge service disabled", {
      namespace: "/agent-bridge",
      status: "disabled_in_config",
    });
  }

  // AI Service bridge - NEW IMPLEMENTATION
  if (features.ai) {
    logger.info("🤖 Initializing AI Service bridge...", {
      enabled: features.ai,
    });
    try {
      const aiServiceBridgeService = require("../services/bridge/AIServiceBridgeService");

      // Initialize AI service bridge
      aiServiceBridgeService.initialize().then((success) => {
        if (success) {
          logger.info("✓ AI Service bridge initialized", {
            namespace: "/ai-service",
            status: "active",
            features: [
              "analysis-routing",
              "generation-routing",
              "progress-forwarding",
              "error-handling",
            ],
          });
        } else {
          logger.error("✗ Failed to initialize AI service bridge");
        }
      });
    } catch (error) {
      logger.error("✗ Failed to load AI service bridge", {
        error: error.message,
      });
    }
  } else {
    logger.debug("AI Service bridge disabled", {
      namespace: "/ai-service",
      status: "disabled_in_config",
      aiFeature: features.ai,
    });
  }

  // Chat namespace - Future feature
  if (features.chat) {
    try {
      ChatNamespace.initialize();
      logger.info("✓ Chat namespace initialized", {
        namespace: "/chat",
        requireAuth: true,
        requireAdmin: false,
        status: "ready_for_implementation",
      });
    } catch (error) {
      logger.error("✗ Failed to initialize chat namespace", {
        error: error.message,
      });
    }
  } else {
    logger.debug("Chat namespace disabled", {
      namespace: "/chat",
      status: "available_for_future_use",
    });
  }

  // Build logs namespace - Future feature
  if (features.buildLogs) {
    try {
      BuildLogsNamespace.initialize();
      logger.info("✓ Build logs namespace initialized", {
        namespace: "/build-logs",
        requireAuth: true,
        requireAdmin: false,
        status: "ready_for_implementation",
      });
    } catch (error) {
      logger.error("✗ Failed to initialize build logs namespace", {
        error: error.message,
      });
    }
  } else {
    logger.debug("Build logs namespace disabled", {
      namespace: "/build-logs",
      status: "available_for_future_use",
    });
  }

  logger.info("Namespace setup completed");
}

/**
 * Set up global connection handlers
 */
function setupGlobalHandlers() {
  // Add global connection analytics
  webSocketManager.addConnectionHandler((socket) => {
    logger.debug("WebSocket connection established", {
      userId: socket.userId,
      userEmail: socket.userEmail,
      userRole: socket.userRole,
      userAgent: socket.handshake.headers["user-agent"],
      ip: socket.handshake.address,
      timestamp: new Date().toISOString(),
    });

    // Track connection metrics
    if (socket.userId) {
      // Could add connection metrics here
      logger.info("Authenticated user connected", {
        userId: socket.userId,
        email: socket.userEmail,
        role: socket.userRole,
      });
    }
  });

  // Add global error handling
  webSocketManager.addConnectionHandler((socket) => {
    socket.on("error", (error) => {
      logger.error("WebSocket client error", {
        userId: socket.userId,
        userEmail: socket.userEmail,
        socketId: socket.id,
        error: error.message,
      });
    });

    socket.on("disconnect", (reason) => {
      logger.debug("WebSocket client disconnected", {
        userId: socket.userId,
        userEmail: socket.userEmail,
        socketId: socket.id,
        reason,
        timestamp: new Date().toISOString(),
      });
    });
  });

  logger.debug("Global WebSocket handlers configured");
}

/**
 * Get WebSocket manager instance
 * @returns {Object} WebSocket manager instance
 */
function getWebSocketManager() {
  return webSocketManager;
}

/**
 * Get WebSocket registry instance
 * @returns {Object} WebSocket registry instance
 */
function getWebSocketRegistry() {
  return webSocketRegistry;
}

/**
 * Get WebSocket statistics
 * @returns {Object} WebSocket statistics
 */
function getWebSocketStats() {
  return webSocketRegistry.getStats();
}

/**
 * Broadcast message to all users across all namespaces
 * @param {String} event - Event name
 * @param {Object} data - Data to broadcast
 */
function broadcastToAll(event, data) {
  webSocketRegistry.broadcastToAll(event, data);
}

/**
 * Broadcast message to specific user across all namespaces
 * @param {String} userId - User ID
 * @param {String} event - Event name
 * @param {Object} data - Data to broadcast
 */
function broadcastToUser(userId, event, data) {
  webSocketRegistry.broadcastToUser(userId, event, data);
}

/**
 * Broadcast message to users with specific role across all namespaces
 * @param {String} role - User role
 * @param {String} event - Event name
 * @param {Object} data - Data to broadcast
 */
function broadcastToRole(role, event, data) {
  webSocketRegistry.broadcastToRole(role, event, data);
}

/**
 * Graceful shutdown for WebSocket connections
 */
function shutdownWebSockets() {
  logger.info("Shutting down centralized WebSocket services...");

  try {
    if (webSocketManager.getIO()) {
      // Notify all clients about shutdown
      webSocketRegistry.broadcastToAll("server_shutdown", {
        message: "Server is shutting down",
        timestamp: new Date().toISOString(),
      });

      // Cleanup all namespaces
      webSocketRegistry.cleanup();

      // Cleanup log stream handlers specifically
      try {
        LogStreamingNamespace.cleanup();
      } catch (error) {
        logger.error("Error cleaning up log stream handlers:", error);
      }

      // Close all connections
      webSocketManager.getIO().close();
      logger.info("✓ Centralized WebSocket services shut down successfully");
    }
  } catch (error) {
    logger.error("Error during WebSocket shutdown:", {
      error: error.message,
      stack: error.stack,
    });
  }
}

// Export helper functions for external use
const WebSocketHelpers = {
  // Notification helpers
  sendNotificationToUser: NotificationsNamespace.sendNotificationToUser,
  broadcastNotificationToRole: NotificationsNamespace.broadcastToRole,
  broadcastNotificationToAll: NotificationsNamespace.broadcastToAll,

  // Build log helpers (when implemented)
  broadcastBuildLog: BuildLogsNamespace.broadcastBuildLog,
  broadcastBuildStatus: BuildLogsNamespace.broadcastBuildStatus,

  // General helpers
  broadcastToAll,
  broadcastToUser,
  broadcastToRole,
  getWebSocketStats,
};

module.exports = {
  initializeWebSockets,
  getWebSocketManager,
  getWebSocketRegistry,
  shutdownWebSockets,

  // Export helpers for use in other parts of the application
  ...WebSocketHelpers,

  // Re-export manager for backward compatibility
  webSocketManager,
};
