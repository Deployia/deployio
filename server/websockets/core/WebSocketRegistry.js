const logger = require("../../config/logger");
const WebSocketNamespace = require("./WebSocketNamespace");

/**
 * WebSocket Registry
 * Centralized registry for managing all WebSocket namespaces
 */
class WebSocketRegistry {
  constructor() {
    this.namespaces = new Map();
    this.webSocketManager = null;
  }

  /**
   * Initialize the registry with WebSocket manager
   * @param {Object} webSocketManager - WebSocket manager instance
   */
  initialize(webSocketManager) {
    this.webSocketManager = webSocketManager;
    logger.info("WebSocket registry initialized");
  }

  /**
   * Register a namespace
   * @param {String} namespacePath - Namespace path (e.g., '/notifications')
   * @param {Object} options - Namespace options
   * @returns {WebSocketNamespace} The created namespace instance
   */
  register(namespacePath, options = {}) {
    if (this.namespaces.has(namespacePath)) {
      throw new Error(`Namespace ${namespacePath} is already registered`);
    }

    const namespace = new WebSocketNamespace(namespacePath, options);
    this.namespaces.set(namespacePath, namespace);

    // Initialize immediately if WebSocket manager is available
    if (this.webSocketManager) {
      namespace.initialize(this.webSocketManager);
    }

    logger.info(`Namespace registered: ${namespacePath}`, options);
    return namespace;
  }

  /**
   * Get a registered namespace
   * @param {String} namespacePath - Namespace path
   * @returns {WebSocketNamespace} The namespace instance
   */
  get(namespacePath) {
    return this.namespaces.get(namespacePath);
  }

  /**
   * Initialize all registered namespaces
   */
  initializeAll() {
    if (!this.webSocketManager) {
      throw new Error("WebSocket manager not initialized");
    }

    this.namespaces.forEach((namespace) => {
      namespace.initialize(this.webSocketManager);
    });

    logger.info("All namespaces initialized", {
      count: this.namespaces.size,
      namespaces: Array.from(this.namespaces.keys()),
    });
  }

  /**
   * Get all registered namespaces
   * @returns {Array} Array of namespace info objects
   */
  getAll() {
    return Array.from(this.namespaces.values()).map((namespace) =>
      namespace.getInfo()
    );
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const stats = {
      totalNamespaces: this.namespaces.size,
      totalConnections: 0,
      namespaces: {},
    };

    this.namespaces.forEach((namespace, path) => {
      const connectedCount = namespace.getConnectedCount();
      stats.totalConnections += connectedCount;
      stats.namespaces[path] = {
        connectedClients: connectedCount,
        options: namespace.options,
        handlers: Array.from(namespace.handlers.keys()),
      };
    });

    return stats;
  }

  /**
   * Broadcast to all namespaces
   * @param {String} event - Event name
   * @param {*} data - Data to broadcast
   */
  broadcastToAll(event, data) {
    this.namespaces.forEach((namespace) => {
      namespace.emit(event, data);
    });
  }

  /**
   * Broadcast to specific user across all namespaces
   * @param {String} userId - User ID
   * @param {String} event - Event name
   * @param {*} data - Data to broadcast
   */
  broadcastToUser(userId, event, data) {
    this.namespaces.forEach((namespace) => {
      namespace.emitToUser(userId, event, data);
    });
  }

  /**
   * Broadcast to users with specific role across all namespaces
   * @param {String} role - User role
   * @param {String} event - Event name
   * @param {*} data - Data to broadcast
   */
  broadcastToRole(role, event, data) {
    this.namespaces.forEach((namespace) => {
      namespace.emitToRole(role, event, data);
    });
  }

  /**
   * Cleanup all namespaces
   */
  cleanup() {
    this.namespaces.forEach((namespace, path) => {
      try {
        // Run any cleanup handlers
        if (typeof namespace.cleanup === "function") {
          namespace.cleanup();
        }
        logger.info(`Cleaned up namespace: ${path}`);
      } catch (error) {
        logger.error(`Error cleaning up namespace ${path}:`, error);
      }
    });

    this.namespaces.clear();
    logger.info("WebSocket registry cleaned up");
  }
}

// Create singleton instance
const webSocketRegistry = new WebSocketRegistry();

module.exports = webSocketRegistry;
