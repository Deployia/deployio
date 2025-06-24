import WebSocketService from "./websocketService";

/**
 * Log Streaming WebSocket Service
 * Provides real-time log streaming from backend services
 * Uses centralized WebSocket service with cookie-based authentication
 */
class LogStreamWebSocket {
  constructor() {
    this.namespace = "/logs";
    this.streams = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Connect to log streaming WebSocket
   * @param {Object} options - Connection options
   */
  async connect(options = {}) {
    try {
      await WebSocketService.connect(this.namespace, options);
      this.setupEventHandlers();
      console.log("Connected to log streaming service");
    } catch (error) {
      console.error("Failed to connect to log streaming service:", error);
      throw error;
    }
  }
  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    const socket = WebSocketService.getSocket(this.namespace);
    if (!socket) return;

    // Clear existing handlers
    socket.off("connect");
    socket.off("disconnect");
    socket.off("reconnect");
    socket.off("reconnect_error");
    socket.off("stream:available");
    socket.off("stream:started");
    socket.off("stream:stopped");
    socket.off("stream:data");
    socket.off("stream:history-complete");
    socket.off("stream:error");

    socket.on("connect", () => {
      this.emit("connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from log streaming service:", reason);
      this.emit("disconnected", { reason });
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(
        `Reconnected to log streaming service (attempt ${attemptNumber})`
      );
      this.emit("reconnected", { attemptNumber });
    });

    socket.on("reconnect_error", (error) => {
      console.error("Log streaming reconnection error:", error);
      this.emit("reconnect_error", { error });
    });

    // Stream-specific events
    socket.on("stream:available", (data) => {
      this.emit("streams_available", data);
    });

    socket.on("stream:started", (data) => {
      this.streams.set(data.streamId, {
        ...data,
        status: "active",
        startTime: new Date(),
      });
      this.emit("stream_started", data);
    });

    socket.on("stream:stopped", (data) => {
      this.streams.delete(data.streamId);
      this.emit("stream_stopped", data);
    });

    socket.on("stream:data", (data) => {
      this.emit("stream_data", data);
      this.emit(`stream_data_${data.streamId}`, data);
    });

    socket.on("stream:history-complete", (data) => {
      this.emit("stream_history_complete", data);
    });

    socket.on("stream:error", (data) => {
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
    if (!this.isConnected()) {
      throw new Error("Not connected to log streaming service");
    }

    WebSocketService.emit(this.namespace, "stream:start", {
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
    if (!this.isConnected()) {
      throw new Error("Not connected to log streaming service");
    }

    WebSocketService.emit(this.namespace, "stream:stop", { streamId });
  }

  /**
   * List available log streams
   */
  listStreams() {
    if (!this.isConnected()) {
      throw new Error("Not connected to log streaming service");
    }

    WebSocketService.emit(this.namespace, "stream:list");
  }

  /**
   * Get active streams
   */
  getActiveStreams() {
    return Array.from(this.streams.values());
  }

  /**
   * Check if connected
   */
  isConnected() {
    return WebSocketService.isConnected(this.namespace);
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
    // Stop all active streams
    this.streams.forEach((stream, streamId) => {
      this.stopStream(streamId);
    });

    WebSocketService.disconnect(this.namespace);
    this.streams.clear();
    this.eventHandlers.clear();

    console.log("Disconnected from log streaming service");
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected(),
      activeStreams: this.streams.size,
      namespace: this.namespace,
    };
  }
}

// Export singleton instance
export default new LogStreamWebSocket();
