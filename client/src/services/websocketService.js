import { io } from "socket.io-client";

/**
 * Centralized WebSocket Service
 * Provides unified authentication and connection management for all WebSocket features
 * Uses cookie-based authentication for seamless integration
 */
class WebSocketService {
  constructor() {
    this.connections = new Map(); // namespace -> socket
    this.isInitialized = false;
    // Use the backend server URL from environment, fallback to development server
    // Note: VITE_APP_BACKEND_URL is for API endpoints, WebSocket is on the same server
    const backendUrl =
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    this.baseUrl = import.meta.env.VITE_WS_URL || backendUrl;
    this.defaultOptions = {
      withCredentials: true, // Ensure cookies are sent
      transports: ["websocket", "polling"],
      autoConnect: false, // We'll connect manually
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };
  }

  /**
   * Initialize the WebSocket service
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log("WebSocket service initialized");
    this.isInitialized = true;
  }

  /**
   * Connect to a specific namespace
   * @param {string} namespace - The namespace to connect to (e.g., '/logs', '/notifications')
   * @param {Object} options - Additional connection options
   * @returns {Promise<Socket>} Connected socket instance
   */
  async connect(namespace, options = {}) {
    // Check if we already have a connected socket
    if (this.connections.has(namespace)) {
      const existingSocket = this.connections.get(namespace);
      if (existingSocket.connected) {
        console.log(`Reusing existing connection to ${namespace}`);
        return existingSocket;
      }
      // Clean up disconnected socket
      this.disconnect(namespace);
    }

    console.log(`Creating new connection to ${namespace}`);
    const socketUrl = `${this.baseUrl}${namespace}`;
    const socketOptions = { ...this.defaultOptions, ...options };

    const socket = io(socketUrl, socketOptions);
    this.connections.set(namespace, socket);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.connections.delete(namespace);
        socket.disconnect();
        reject(new Error(`Connection timeout for namespace ${namespace}`));
      }, 10000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        console.log(`Connected to WebSocket namespace: ${namespace}`);
        resolve(socket);
      });

      socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        console.error(`WebSocket connection error for ${namespace}:`, error);
        this.connections.delete(namespace);

        // Check if it's an authentication error
        if (error.message && error.message.includes("Authentication")) {
          console.warn(
            `Authentication failed for ${namespace}. This is expected if user is not logged in.`
          );
          reject(new Error(`Authentication required for ${namespace}`));
        } else {
          reject(error);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log(
          `Disconnected from WebSocket namespace ${namespace}:`,
          reason
        );
        // Remove from connections map when disconnected
        this.connections.delete(namespace);
      });

      // Connect the socket
      socket.connect();
    });
  }

  /**
   * Disconnect from a specific namespace
   * @param {string} namespace - The namespace to disconnect from
   */
  disconnect(namespace) {
    const socket = this.connections.get(namespace);
    if (socket) {
      socket.disconnect();
      this.connections.delete(namespace);
      console.log(`Disconnected from WebSocket namespace: ${namespace}`);
    }
  }

  /**
   * Disconnect from all namespaces
   */
  disconnectAll() {
    for (const [namespace, socket] of this.connections) {
      socket.disconnect();
      console.log(`Disconnected from WebSocket namespace: ${namespace}`);
    }
    this.connections.clear();
  }

  /**
   * Get socket for a specific namespace
   * @param {string} namespace - The namespace
   * @returns {Socket|null} Socket instance or null
   */
  getSocket(namespace) {
    return this.connections.get(namespace) || null;
  }

  /**
   * Check if connected to a namespace
   * @param {string} namespace - The namespace
   * @returns {boolean} Connection status
   */
  isConnected(namespace) {
    const socket = this.connections.get(namespace);
    return socket ? socket.connected : false;
  }

  /**
   * Get connection status for all namespaces
   * @returns {Object} Status object
   */
  getStatus() {
    const status = {};
    for (const [namespace, socket] of this.connections) {
      status[namespace] = {
        connected: socket.connected,
        id: socket.id,
      };
    }
    return status;
  }

  /**
   * Emit event to a specific namespace
   * @param {string} namespace - The namespace
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(namespace, event, data) {
    const socket = this.connections.get(namespace);
    if (socket && socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event} to ${namespace}: not connected`);
    }
  }

  /**
   * Listen to events from a specific namespace
   * @param {string} namespace - The namespace
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(namespace, event, handler) {
    const socket = this.connections.get(namespace);
    if (socket) {
      socket.on(event, handler);
    } else {
      console.warn(`Cannot listen to ${event} on ${namespace}: not connected`);
    }
  }

  /**
   * Remove event listener from a specific namespace
   * @param {string} namespace - The namespace
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(namespace, event, handler) {
    const socket = this.connections.get(namespace);
    if (socket) {
      socket.off(event, handler);
    }
  }

  /**
   * Refresh all WebSocket connections (useful after token refresh)
   * This disconnects and reconnects all active connections
   */
  async refreshConnections() {
    console.log("Refreshing all WebSocket connections...");
    const activeNamespaces = Array.from(this.connections.keys());

    // Disconnect all existing connections
    this.disconnectAll();

    // Reconnect to previously active namespaces
    const reconnectionPromises = activeNamespaces.map(async (namespace) => {
      try {
        await this.connect(namespace);
        console.log(`Successfully reconnected to ${namespace}`);
      } catch (error) {
        console.error(`Failed to reconnect to ${namespace}:`, error);
      }
    });

    await Promise.allSettled(reconnectionPromises);
    console.log("WebSocket connection refresh completed");
  }
}

// Export singleton instance
export default new WebSocketService();
