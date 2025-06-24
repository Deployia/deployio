# WebSocket Architecture Documentation

## Overview

This document describes the centralized, modular WebSocket architecture for the Deployio platform. The architecture is designed to be scalable, maintainable, and easy to extend with new features.

## Architecture Principles

### 1. Centralized Registry

- All WebSocket namespaces are managed through a central registry
- Consistent authentication and error handling across all namespaces
- Easy monitoring and statistics collection

### 2. Modular Namespaces

- Each feature has its own namespace class
- Namespaces are self-contained and can be enabled/disabled independently
- Common functionality is abstracted into base classes

### 3. Consistent Authentication

- Centralized authentication using the same JWT system as Express routes
- OAuth auto-verification for Google/GitHub users
- Role-based access control (admin, user, etc.)

### 4. Future-Ready

- Template namespaces for future features
- Easy to add new namespaces without modifying existing code
- Scalable event handling system

## Directory Structure

```
server/websockets/
├── index.js                     # Main entry point and initialization
├── core/
│   ├── WebSocketNamespace.js    # Base namespace class
│   └── WebSocketRegistry.js     # Central registry manager
├── namespaces/
│   ├── NotificationsNamespace.js    # User notifications
│   ├── LogStreamingNamespace.js     # Admin log streaming
│   ├── ChatNamespace.js             # Real-time chat (template)
│   └── BuildLogsNamespace.js        # Build log streaming (template)
└── legacy/                      # Old files (to be removed)
    ├── notificationHandlers.js
    └── logStreamHandlers.js
```

## Core Components

### WebSocketNamespace (Base Class)

The base class for all WebSocket namespaces provides:

- **Authentication**: Centralized token extraction and user verification
- **Authorization**: Role-based access control
- **Event Handling**: Consistent error handling and logging
- **Room Management**: User-specific and role-specific rooms
- **Connection Management**: Connection and disconnection handlers

```javascript
// Example usage
const namespace = new WebSocketNamespace("/example", {
  requireAuth: true,
  requireAdmin: false,
  requireVerified: false,
});

namespace
  .on("event_name", handlerFunction)
  .onConnection(connectionHandler)
  .onDisconnection(disconnectionHandler);
```

### WebSocketRegistry

The central registry manages all namespaces and provides:

- **Namespace Registration**: Register and initialize namespaces
- **Broadcasting**: Send messages across all namespaces
- **Statistics**: Monitor connections and performance
- **Lifecycle Management**: Initialization and cleanup

## Current Namespaces

### 1. Notifications (`/notifications`)

**Purpose**: Real-time user notifications
**Access**: Authenticated users (all roles)
**Features**:

- Mark notifications as read
- Real-time notification delivery
- Unread count tracking
- User-specific notification rooms

**Events**:

- `mark_read` - Mark a notification as read
- `mark_all_read` - Mark all notifications as read
- `get_unread_count` - Get current unread count
- `subscribe_to_notifications` - Explicit subscription

**Emitted Events**:

- `new_notification` - New notification received
- `notification_marked_read` - Notification marked as read
- `unread_count` - Current unread count
- `unread_count_update` - Unread count changed

### 2. Log Streaming (`/logs`)

**Purpose**: Real-time log streaming for administrators
**Access**: Admin users only
**Features**:

- Application log streaming
- Docker container log streaming
- System log streaming
- Multiple concurrent streams

**Events**:

- `stream:start` - Start log streaming
- `stream:stop` - Stop log streaming
- `stream:list` - List available streams
- `stream:docker_logs` - Stream Docker logs
- `stream:system_logs` - Stream system logs

**Emitted Events**:

- `log:data` - Log data chunk
- `log:started` - Stream started
- `log:stopped` - Stream stopped
- `log:error` - Stream error
- `streams:available` - Available streams list

## Template Namespaces (Future Implementation)

### 3. Chat (`/chat`)

**Purpose**: Real-time chat functionality
**Access**: Verified users
**Features**:

- Multiple chat rooms
- Typing indicators
- Message history
- User presence

### 4. Build Logs (`/build-logs`)

**Purpose**: Real-time build and deployment log streaming
**Access**: Project members and admins
**Features**:

- Build-specific log streaming
- Build status updates
- Build history
- Build cancellation

## Usage Examples

### Server-Side Integration

```javascript
// Initialize WebSocket services
const {
  initializeWebSockets,
  sendNotificationToUser,
} = require("./websockets");

// In your Express app
const io = initializeWebSockets(server, {
  features: {
    notifications: true,
    logStreaming: true,
    chat: false,
    buildLogs: false,
  },
});

// Send notification from anywhere in your app
sendNotificationToUser(userId, {
  type: "info",
  title: "Deployment Complete",
  message: "Your application has been deployed successfully",
});
```

### Client-Side Integration

```javascript
// Connect to notifications
const notificationSocket = io("/notifications");

notificationSocket.on("connect", () => {
  console.log("Connected to notifications");
});

notificationSocket.on("new_notification", (notification) => {
  // Handle new notification
  showNotificationToast(notification);
});

notificationSocket.on("unread_count", ({ count }) => {
  // Update unread count in UI
  updateNotificationBadge(count);
});

// Mark notification as read
notificationSocket.emit("mark_read", { notificationId: "notification_id" });
```

## Authentication Flow

1. **Token Extraction**: Extract JWT token from cookies, headers, or query parameters
2. **Token Verification**: Verify JWT using the same secret as Express routes
3. **User Lookup**: Find user in database using token payload
4. **Auto-Verification**: Auto-verify OAuth users (Google/GitHub)
5. **Authorization Check**: Check role requirements for namespace
6. **Context Setting**: Set socket user context for event handlers

## Error Handling

All namespaces provide consistent error handling:

```javascript
// Client receives errors in this format
socket.on("error", (error) => {
  console.error("WebSocket error:", {
    message: error.message,
    code: error.code,
    event: error.event, // The event that caused the error
  });
});
```

Common error codes:

- `AUTHENTICATION_FAILED` - Authentication failed
- `ACCESS_DENIED` - Insufficient permissions
- `INVALID_DATA` - Invalid request data
- `HANDLER_ERROR` - Event handler error

## Monitoring and Statistics

Get real-time WebSocket statistics:

```javascript
const { getWebSocketStats } = require("./websockets");

const stats = getWebSocketStats();
console.log("WebSocket Stats:", {
  totalNamespaces: stats.totalNamespaces,
  totalConnections: stats.totalConnections,
  namespaces: stats.namespaces,
});
```

## Adding New Namespaces

To add a new namespace:

1. **Create Namespace Class**: Extend or follow the pattern of existing namespaces
2. **Register in Index**: Add initialization in `setupNamespaces()`
3. **Add Feature Flag**: Add to default config features
4. **Update Documentation**: Document events and usage

Example new namespace:

```javascript
// namespaces/MonitoringNamespace.js
const webSocketRegistry = require("../core/WebSocketRegistry");

class MonitoringNamespace {
  static initialize() {
    const namespace = webSocketRegistry.register("/monitoring", {
      requireAuth: true,
      requireAdmin: true,
    });

    namespace
      .on("subscribe_to_metrics", this.subscribeToMetrics)
      .on("get_system_status", this.getSystemStatus);

    return namespace;
  }

  static subscribeToMetrics(socket, data) {
    // Implementation
  }

  static getSystemStatus(socket, data) {
    // Implementation
  }
}

module.exports = MonitoringNamespace;
```

## Best Practices

### 1. Event Naming

- Use descriptive event names with colons for grouping (`stream:start`, `user:typing`)
- Prefix namespace-specific events when needed
- Use consistent naming patterns across namespaces

### 2. Error Handling

- Always emit errors in the standard format
- Log errors with sufficient context
- Provide meaningful error codes

### 3. Room Management

- Use consistent room naming patterns
- Clean up rooms on disconnection
- Join users to appropriate rooms on connection

### 4. Performance

- Limit the amount of data sent in each message
- Use rooms to target specific users/groups
- Implement rate limiting for high-frequency events

### 5. Security

- Always verify user permissions before processing events
- Sanitize input data
- Use the centralized authentication system

## Migration from Legacy Code

The new architecture maintains backward compatibility while providing a path for migration:

1. **Old handlers remain functional** until fully migrated
2. **New namespaces can be added** without affecting existing code
3. **Client code can be migrated** namespace by namespace
4. **Feature flags allow** gradual rollout

## Testing

Test WebSocket functionality:

```javascript
// Example test structure
describe("WebSocket Namespaces", () => {
  let server, io, clientSocket;

  beforeEach(() => {
    // Setup test server and client
  });

  describe("Notifications Namespace", () => {
    it("should authenticate user", (done) => {
      // Test authentication
    });

    it("should handle mark_read event", (done) => {
      // Test event handling
    });
  });
});
```

## Future Enhancements

Planned improvements:

1. **Rate Limiting**: Implement per-user rate limiting
2. **Message Queuing**: Queue messages for offline users
3. **Horizontal Scaling**: Redis adapter for multi-server support
4. **Metrics Dashboard**: Real-time WebSocket metrics visualization
5. **Auto-Reconnection**: Enhanced client-side reconnection logic

## Troubleshooting

Common issues and solutions:

1. **Authentication Errors**: Check JWT token and user verification status
2. **Connection Issues**: Verify CORS settings and client URL
3. **Missing Events**: Ensure namespace is registered and feature flag is enabled
4. **Performance Issues**: Check room usage and message frequency

## Support

For questions or issues with the WebSocket architecture:

1. Check the logs for detailed error information
2. Verify authentication and authorization settings
3. Test with the provided examples
4. Check feature flags and namespace registration

This architecture provides a solid foundation for real-time features in the Deployio platform while maintaining flexibility for future enhancements.
