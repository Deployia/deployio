import { io } from "socket.io-client";
import { getAuthToken } from "@utils/auth";

/**
 * Log Streaming WebSocket Service
 * Provides real-time log streaming from backend services
 */
class LogStreamWebSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.streams = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Connect to log streaming WebSocket
   * @param {Object} options - Connection options
   */
  async connect(options = {}) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token required for log streaming");
      }

      const socketUrl = `${
        import.meta.env.VITE_WS_URL || window.location.origin
      }/logs`;

      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        ...options,
      });

      this.setupEventHandlers();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000);

        this.socket.on("connect", () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log("Connected to log streaming service");
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          clearTimeout(timeout);
          console.error("Log streaming connection error:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Failed to connect to log streaming service:", error);
      throw error;
    }
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.emit("connected");
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("Disconnected from log streaming service:", reason);
      this.emit("disconnected", { reason });
    });

    this.socket.on("reconnect", (attemptNumber) => {
      this.isConnected = true;
      console.log(
        `Reconnected to log streaming service (attempt ${attemptNumber})`
      );
      this.emit("reconnected", { attemptNumber });
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Log streaming reconnection error:", error);
      this.emit("reconnect_error", { error });
    });

    // Stream-specific events
    this.socket.on("stream:available", (data) => {
      this.emit("streams_available", data);
    });

    this.socket.on("stream:started", (data) => {
      this.streams.set(data.streamId, {
        ...data,
        status: "active",
        startTime: new Date(),
      });
      this.emit("stream_started", data);
    });

    this.socket.on("stream:stopped", (data) => {
      this.streams.delete(data.streamId);
      this.emit("stream_stopped", data);
    });

    this.socket.on("stream:data", (data) => {
      this.emit("stream_data", data);
      this.emit(`stream_data_${data.streamId}`, data);
    });

    this.socket.on("stream:history-complete", (data) => {
      this.emit("stream_history_complete", data);
    });

    this.socket.on("stream:error", (data) => {
      console.error("Stream error:", data);
      this.emit("stream_error", data);
    });
  }

  /**
   * Start streaming logs for a specific service
   * @param {string} streamId - Unique identifier for the stream
   * @param {string} logType - Type of logs to stream
   * @param {number} lines - Number of recent lines to fetch initially
   */
  startStream(streamId, logType, lines = 50) {
    if (!this.isConnected) {
      throw new Error("Not connected to log streaming service");
    }

    this.socket.emit("stream:start", {
      streamId,
      logType,
      lines,
    });
  }

  /**
   * Stop streaming logs for a specific stream
   * @param {string} streamId - Stream identifier to stop
   */
  stopStream(streamId) {
    if (!this.isConnected) {
      throw new Error("Not connected to log streaming service");
    }

    this.socket.emit("stream:stop", { streamId });
  }

  /**
   * List available log streams
   */
  listStreams() {
    if (!this.isConnected) {
      throw new Error("Not connected to log streaming service");
    }

    this.socket.emit("stream:list");
  }

  /**
   * Get active streams
   */
  getActiveStreams() {
    return Array.from(this.streams.values());
  }

  /**
   * Subscribe to events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  /**
   * Unsubscribe from events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  /**
   * Emit events to registered handlers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from log streaming service
   */
  disconnect() {
    if (this.socket) {
      // Stop all active streams
      this.streams.forEach((stream, streamId) => {
        this.stopStream(streamId);
      });

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.streams.clear();
      this.eventHandlers.clear();

      console.log("Disconnected from log streaming service");
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      activeStreams: this.streams.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export default new LogStreamWebSocket();
