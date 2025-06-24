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
    if (this.connections.has(namespace)) {
      const existingSocket = this.connections.get(namespace);
      if (existingSocket.connected) {
        return existingSocket;
      }
      // Clean up disconnected socket
      this.disconnect(namespace);
    }

    const socketUrl = `${this.baseUrl}${namespace}`;
    const socketOptions = { ...this.defaultOptions, ...options };

    const socket = io(socketUrl, socketOptions);
    this.connections.set(namespace, socket);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
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
        reject(error);
      });

      socket.on("disconnect", (reason) => {
        console.log(
          `Disconnected from WebSocket namespace ${namespace}:`,
          reason
        );
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
}

// Export singleton instance
export default new WebSocketService();
