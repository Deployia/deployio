# WebSocket Client Architecture Documentation

## Overview

This document describes the client-side WebSocket integration for the Deployio platform. The client architecture is designed to be modular, maintainable, and consistent with the server-side namespace structure.

## Client-Side Structure

```
client/src/
├── services/
│   ├── websocketService.js          # Main WebSocket service
│   ├── notificationWebSocket.js     # Notifications namespace
│   ├── logStreamWebSocket.js        # Log streaming namespace
│   └── chatWebSocket.js             # Chat namespace (future)
├── hooks/
│   ├── useWebSocket.js              # General WebSocket hook
│   ├── useNotifications.js          # Notifications hook
│   └── useLogStream.js              # Log streaming hook
└── components/
    ├── notifications/
    │   ├── NotificationCenter.jsx
    │   ├── NotificationToast.jsx
    │   └── NotificationBadge.jsx
    └── admin/
        └── LogStreamViewer.jsx
```

## Core WebSocket Service

### websocketService.js

```javascript
import { io } from "socket.io-client";

class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.baseURL = process.env.REACT_APP_WS_URL || window.location.origin;
    this.defaultOptions = {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    };
  }

  /**
   * Connect to a specific namespace
   * @param {string} namespace - Namespace path (e.g., '/notifications')
   * @param {object} options - Connection options
   * @returns {object} Socket instance
   */
  connect(namespace, options = {}) {
    if (this.connections.has(namespace)) {
      return this.connections.get(namespace);
    }

    const socket = io(`${this.baseURL}${namespace}`, {
      ...this.defaultOptions,
      ...options,
      withCredentials: true, // Include cookies for authentication
    });

    // Add connection event handlers
    socket.on("connect", () => {
      console.log(`Connected to ${namespace}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Disconnected from ${namespace}:`, reason);
    });

    socket.on("error", (error) => {
      console.error(`WebSocket error for ${namespace}:`, error);
      // Emit custom event for error handling
      window.dispatchEvent(
        new CustomEvent("websocket-error", {
          detail: { namespace, error },
        })
      );
    });

    socket.on("connect_error", (error) => {
      console.error(`Connection error for ${namespace}:`, error);
      window.dispatchEvent(
        new CustomEvent("websocket-connection-error", {
          detail: { namespace, error },
        })
      );
    });

    this.connections.set(namespace, socket);
    return socket;
  }

  /**
   * Disconnect from a namespace
   * @param {string} namespace - Namespace path
   */
  disconnect(namespace) {
    const socket = this.connections.get(namespace);
    if (socket) {
      socket.disconnect();
      this.connections.delete(namespace);
    }
  }

  /**
   * Get existing connection
   * @param {string} namespace - Namespace path
   * @returns {object|null} Socket instance or null
   */
  getConnection(namespace) {
    return this.connections.get(namespace) || null;
  }

  /**
   * Disconnect all namespaces
   */
  disconnectAll() {
    this.connections.forEach((socket, namespace) => {
      socket.disconnect();
    });
    this.connections.clear();
  }

  /**
   * Check if connected to namespace
   * @param {string} namespace - Namespace path
   * @returns {boolean} Connection status
   */
  isConnected(namespace) {
    const socket = this.connections.get(namespace);
    return socket ? socket.connected : false;
  }

  /**
   * Get all active connections
   * @returns {object} Connection status map
   */
  getConnectionStatus() {
    const status = {};
    this.connections.forEach((socket, namespace) => {
      status[namespace] = {
        connected: socket.connected,
        id: socket.id,
      };
    });
    return status;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
```

## Notification WebSocket Service

### notificationWebSocket.js

```javascript
import webSocketService from "./websocketService";

class NotificationWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.unreadCount = 0;
  }

  /**
   * Initialize notification WebSocket connection
   */
  initialize() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = webSocketService.connect("/notifications");
    this.setupEventHandlers();
    return this.socket;
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Handle new notifications
    this.socket.on("new_notification", (notification) => {
      this.handleNewNotification(notification);
    });

    // Handle unread count updates
    this.socket.on("unread_count", ({ count }) => {
      this.unreadCount = count;
      this.emitToListeners("unread_count_changed", count);
    });

    this.socket.on("unread_count_update", () => {
      // Request updated count
      this.socket.emit("get_unread_count");
    });

    // Handle notification marked as read
    this.socket.on("notification_marked_read", (data) => {
      this.emitToListeners("notification_read", data);
    });

    // Handle all notifications marked as read
    this.socket.on("all_notifications_marked_read", (data) => {
      this.unreadCount = 0;
      this.emitToListeners("all_notifications_read", data);
      this.emitToListeners("unread_count_changed", 0);
    });

    // Handle subscription confirmation
    this.socket.on("subscribed_to_notifications", (data) => {
      console.log("Subscribed to notifications:", data);
    });

    // Handle errors
    this.socket.on("error", (error) => {
      console.error("Notification WebSocket error:", error);
      this.emitToListeners("error", error);
    });

    // Subscribe to notifications on connection
    this.socket.on("connect", () => {
      this.socket.emit("subscribe_to_notifications");
      this.socket.emit("get_unread_count");
    });
  }

  /**
   * Handle new notification
   * @param {object} notification - Notification data
   */
  handleNewNotification(notification) {
    // Show toast notification
    this.showNotificationToast(notification);

    // Update unread count
    this.unreadCount++;

    // Emit to listeners
    this.emitToListeners("new_notification", notification);
    this.emitToListeners("unread_count_changed", this.unreadCount);
  }

  /**
   * Show toast notification
   * @param {object} notification - Notification data
   */
  showNotificationToast(notification) {
    // Create and dispatch custom event for toast
    window.dispatchEvent(
      new CustomEvent("show-notification-toast", {
        detail: notification,
      })
    );
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("mark_read", { notificationId });
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    if (this.socket && this.socket.connected) {
      this.socket.emit("mark_all_read");
    }
  }

  /**
   * Get current unread count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return this.unreadCount;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in notification listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from notifications
   */
  disconnect() {
    if (this.socket) {
      webSocketService.disconnect("/notifications");
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.socket ? this.socket.connected : false;
  }
}

// Create singleton instance
const notificationWebSocket = new NotificationWebSocketService();

export default notificationWebSocket;
```

## React Hooks

### useNotifications.js

```javascript
import { useState, useEffect, useCallback } from "react";
import notificationWebSocket from "../services/notificationWebSocket";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    notificationWebSocket.initialize();

    // Set up event listeners
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    const handleUnreadCountChanged = (count) => {
      setUnreadCount(count);
    };

    const handleNotificationRead = (data) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === data.notificationId
            ? { ...notif, status: "read", readAt: data.readAt }
            : notif
        )
      );
    };

    const handleAllNotificationsRead = () => {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, status: "read", readAt: new Date() }))
      );
    };

    const handleError = (error) => {
      setError(error);
    };

    // Check connection status
    const checkConnection = () => {
      setIsConnected(notificationWebSocket.isConnected());
    };

    // Add listeners
    notificationWebSocket.addEventListener(
      "new_notification",
      handleNewNotification
    );
    notificationWebSocket.addEventListener(
      "unread_count_changed",
      handleUnreadCountChanged
    );
    notificationWebSocket.addEventListener(
      "notification_read",
      handleNotificationRead
    );
    notificationWebSocket.addEventListener(
      "all_notifications_read",
      handleAllNotificationsRead
    );
    notificationWebSocket.addEventListener("error", handleError);

    // Check connection periodically
    const connectionInterval = setInterval(checkConnection, 1000);
    checkConnection();

    // Initial unread count
    setUnreadCount(notificationWebSocket.getUnreadCount());

    // Cleanup
    return () => {
      clearInterval(connectionInterval);
      notificationWebSocket.removeEventListener(
        "new_notification",
        handleNewNotification
      );
      notificationWebSocket.removeEventListener(
        "unread_count_changed",
        handleUnreadCountChanged
      );
      notificationWebSocket.removeEventListener(
        "notification_read",
        handleNotificationRead
      );
      notificationWebSocket.removeEventListener(
        "all_notifications_read",
        handleAllNotificationsRead
      );
      notificationWebSocket.removeEventListener("error", handleError);
    };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    notificationWebSocket.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationWebSocket.markAllAsRead();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    clearError,
  };
}
```

### useLogStream.js

```javascript
import { useState, useEffect, useCallback, useRef } from "react";
import webSocketService from "../services/websocketService";

export function useLogStream() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeStreams, setActiveStreams] = useState(new Map());
  const [availableStreams, setAvailableStreams] = useState([]);
  const [error, setError] = useState(null);
  const logBuffersRef = useRef(new Map());

  useEffect(() => {
    // Initialize WebSocket connection for admin users
    const initializeConnection = () => {
      try {
        const logSocket = webSocketService.connect("/logs");
        setSocket(logSocket);

        // Set up event handlers
        logSocket.on("connect", () => {
          setIsConnected(true);
          setError(null);
          // Request available streams
          logSocket.emit("stream:list");
        });

        logSocket.on("disconnect", () => {
          setIsConnected(false);
        });

        logSocket.on("streams:available", (streams) => {
          setAvailableStreams(streams);
        });

        logSocket.on("log:data", (data) => {
          handleLogData(data);
        });

        logSocket.on("log:started", (data) => {
          setActiveStreams((prev) =>
            new Map(prev).set(data.streamId, {
              ...data,
              status: "active",
            })
          );
        });

        logSocket.on("log:stopped", (data) => {
          setActiveStreams((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.streamId);
            return newMap;
          });
        });

        logSocket.on("log:error", (data) => {
          console.error("Log stream error:", data);
          setError(data.error);
        });

        logSocket.on("error", (error) => {
          console.error("Log WebSocket error:", error);
          setError(error.message);
        });
      } catch (error) {
        console.error("Failed to initialize log stream:", error);
        setError(error.message);
      }
    };

    initializeConnection();

    // Cleanup
    return () => {
      if (socket) {
        // Stop all active streams
        activeStreams.forEach((stream, streamId) => {
          socket.emit("stream:stop", { streamId });
        });
        webSocketService.disconnect("/logs");
      }
    };
  }, []);

  const handleLogData = useCallback((data) => {
    const { streamId, data: logLine } = data;

    // Update log buffer
    if (!logBuffersRef.current.has(streamId)) {
      logBuffersRef.current.set(streamId, []);
    }

    const buffer = logBuffersRef.current.get(streamId);
    buffer.push({
      ...data,
      timestamp: new Date(data.timestamp),
      id: `${streamId}_${Date.now()}_${Math.random()}`,
    });

    // Keep only last 1000 lines per stream
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000);
    }

    // Trigger re-render by updating state
    setActiveStreams((prev) => new Map(prev));
  }, []);

  const startStream = useCallback(
    (streamConfig) => {
      if (socket && socket.connected) {
        const streamId = `stream_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        socket.emit("stream:start", {
          streamId,
          ...streamConfig,
        });
        return streamId;
      }
      return null;
    },
    [socket]
  );

  const stopStream = useCallback(
    (streamId) => {
      if (socket && socket.connected) {
        socket.emit("stream:stop", { streamId });
        // Clear log buffer
        logBuffersRef.current.delete(streamId);
      }
    },
    [socket]
  );

  const getStreamLogs = useCallback((streamId) => {
    return logBuffersRef.current.get(streamId) || [];
  }, []);

  const clearStreamLogs = useCallback((streamId) => {
    logBuffersRef.current.set(streamId, []);
    // Trigger re-render
    setActiveStreams((prev) => new Map(prev));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    activeStreams: Array.from(activeStreams.entries()),
    availableStreams,
    error,
    startStream,
    stopStream,
    getStreamLogs,
    clearStreamLogs,
    clearError,
  };
}
```

## React Components

### NotificationCenter.jsx

```javascript
import React from "react";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationBadge from "./NotificationBadge";
import "./NotificationCenter.css";

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    clearError,
  } = useNotifications();

  const handleNotificationClick = (notification) => {
    if (notification.status === "unread") {
      markAsRead(notification._id);
    }
  };

  if (error) {
    return (
      <div className="notification-center error">
        <div className="error-message">
          Failed to connect to notifications: {error}
          <button onClick={clearError}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications</h3>
        <NotificationBadge count={unreadCount} />
        {!isConnected && (
          <span className="connection-status">Disconnected</span>
        )}
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read">
            Mark All Read
          </button>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${notification.status}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">
                {new Date(notification.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### LogStreamViewer.jsx

```javascript
import React, { useState, useRef, useEffect } from "react";
import { useLogStream } from "../../hooks/useLogStream";
import "./LogStreamViewer.css";

export default function LogStreamViewer() {
  const {
    isConnected,
    activeStreams,
    availableStreams,
    error,
    startStream,
    stopStream,
    getStreamLogs,
    clearStreamLogs,
    clearError,
  } = useLogStream();

  const [selectedTab, setSelectedTab] = useState(null);
  const logContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activeStreams, autoScroll]);

  const handleStartStream = (streamType, streamName) => {
    const streamConfig = {
      logType: streamType,
      containerName: streamType === "docker" ? streamName : undefined,
      systemLogType: streamType === "system" ? streamName : undefined,
    };

    const streamId = startStream(streamConfig);
    if (streamId) {
      setSelectedTab(streamId);
    }
  };

  const handleStopStream = (streamId) => {
    stopStream(streamId);
    if (selectedTab === streamId) {
      const remainingStreams = activeStreams.filter(([id]) => id !== streamId);
      setSelectedTab(
        remainingStreams.length > 0 ? remainingStreams[0][0] : null
      );
    }
  };

  const formatLogLine = (logEntry) => {
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const level = logEntry.isError ? "ERROR" : "INFO";
    return `[${timestamp}] [${level}] ${logEntry.data}`;
  };

  if (error) {
    return (
      <div className="log-stream-viewer error">
        <div className="error-message">
          Log streaming error: {error}
          <button onClick={clearError}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="log-stream-viewer">
      <div className="log-stream-header">
        <h3>Log Streaming</h3>
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">Connected</span>
          ) : (
            <span className="disconnected">Disconnected</span>
          )}
        </div>
      </div>

      <div className="log-stream-controls">
        <div className="stream-selection">
          <h4>Available Streams</h4>

          {/* Application Logs */}
          <div className="stream-group">
            <h5>Application Logs</h5>
            {availableStreams.application?.map((stream) => (
              <button
                key={stream.name}
                onClick={() => handleStartStream("application", stream.name)}
                className="start-stream-btn"
              >
                Start {stream.name}
              </button>
            ))}
          </div>

          {/* Docker Logs */}
          <div className="stream-group">
            <h5>Docker Containers</h5>
            {availableStreams.docker?.map((stream) => (
              <button
                key={stream.name}
                onClick={() => handleStartStream("docker", stream.name)}
                className="start-stream-btn"
              >
                Start {stream.name}
              </button>
            ))}
          </div>

          {/* System Logs */}
          <div className="stream-group">
            <h5>System Logs</h5>
            {availableStreams.system?.map((stream) => (
              <button
                key={stream.name}
                onClick={() => handleStartStream("system", stream.name)}
                className="start-stream-btn"
              >
                Start {stream.name}
              </button>
            ))}
          </div>
        </div>

        <div className="stream-options">
          <label>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Active Stream Tabs */}
      {activeStreams.length > 0 && (
        <div className="stream-tabs">
          {activeStreams.map(([streamId, streamInfo]) => (
            <div
              key={streamId}
              className={`stream-tab ${
                selectedTab === streamId ? "active" : ""
              }`}
              onClick={() => setSelectedTab(streamId)}
            >
              <span>{streamInfo.logType}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopStream(streamId);
                }}
                className="close-tab"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Log Display */}
      {selectedTab && (
        <div className="log-display">
          <div className="log-header">
            <span>Stream: {selectedTab}</span>
            <div className="log-actions">
              <button onClick={() => clearStreamLogs(selectedTab)}>
                Clear
              </button>
              <button onClick={() => handleStopStream(selectedTab)}>
                Stop Stream
              </button>
            </div>
          </div>

          <div className="log-container" ref={logContainerRef}>
            {getStreamLogs(selectedTab).map((logEntry) => (
              <div
                key={logEntry.id}
                className={`log-line ${logEntry.isError ? "error" : ""}`}
              >
                {formatLogLine(logEntry)}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStreams.length === 0 && (
        <div className="no-streams">
          No active log streams. Select a stream from the available options
          above.
        </div>
      )}
    </div>
  );
}
```

## Usage in Main App

### App.js Integration

```javascript
import React, { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import notificationWebSocket from "./services/notificationWebSocket";
import NotificationToast from "./components/notifications/NotificationToast";

function App() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize WebSocket connections when user is authenticated
    if (isAuthenticated) {
      notificationWebSocket.initialize();
    }

    // Cleanup on unmount or logout
    return () => {
      if (!isAuthenticated) {
        notificationWebSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  // Global error handler for WebSocket errors
  useEffect(() => {
    const handleWebSocketError = (event) => {
      const { namespace, error } = event.detail;
      console.error(`WebSocket error in ${namespace}:`, error);

      // Handle specific error types
      if (error.message.includes("Account is not active")) {
        // Redirect to account activation page
        window.location.href = "/account/activate";
      } else if (error.message.includes("Authentication failed")) {
        // Redirect to login
        window.location.href = "/login";
      }
    };

    window.addEventListener("websocket-error", handleWebSocketError);
    window.addEventListener("websocket-connection-error", handleWebSocketError);

    return () => {
      window.removeEventListener("websocket-error", handleWebSocketError);
      window.removeEventListener(
        "websocket-connection-error",
        handleWebSocketError
      );
    };
  }, []);

  return (
    <div className="App">
      {/* Your app content */}

      {/* Global notification toast */}
      <NotificationToast />
    </div>
  );
}

export default App;
```

This client-side architecture provides:

1. **Modular Services**: Separate services for each WebSocket namespace
2. **React Hooks**: Easy-to-use hooks for React components
3. **Error Handling**: Comprehensive error handling and recovery
4. **Real-time Updates**: Seamless real-time data updates
5. **Connection Management**: Automatic connection/disconnection handling
6. **Scalable Structure**: Easy to add new namespaces and features

The architecture maintains consistency with the server-side structure and provides a solid foundation for building real-time features in the client application.
