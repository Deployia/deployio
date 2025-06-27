# DeployIO Unified Logging System - API Documentation

## Overview

The DeployIO platform now features a unified, scalable logging architecture that consolidates system logs, user deployment logs, and real-time metrics into a single, coherent system with WebSocket streaming and REST API access.

## Architecture

### Core Components

1. **LogCollectorService** - Unified log collection from multiple sources
2. **LogStreamingNamespace** - WebSocket namespace with room-based organization
3. **RemoteAgentLogBridge** - Real-time connection to remote EC2 agent
4. **Unified API Routes** - Consolidated REST endpoints for all logging operations

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Log Sources   │───▶│  LogCollector    │───▶│   WebSocket     │
│ • Backend       │    │    Service       │    │   Namespace     │
│ • AI Service    │    │ • File reading   │    │ • Room-based    │
│ • Agent (Remote)│    │ • Docker logs    │    │ • Real-time     │
│ • User Apps     │    │ • Remote bridge  │    │ • Authenticated │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   REST API       │    │  Client Apps    │
                       │ /api/v1/logs/*   │    │ • Admin Panel   │
                       │ • System logs    │    │ • User Dashboard│
                       │ • User logs      │    │ • Real-time UI  │
                       │ • Deployments    │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## REST API Endpoints

### Base URL: `/api/v1/logs`

All endpoints require authentication via JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### System Logs (Admin Only)

#### Get System Status

```http
GET /api/v1/logs/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "websocket": {
      "namespace": "/logs",
      "active": true,
      "connectedClients": 3
    },
    "collector": {
      "activeStreams": 2,
      "collectors": {
        "backend": { "type": "SystemLogCollector", "status": "active" },
        "ai-service": { "type": "SystemLogCollector", "status": "active" },
        "agent": { "type": "AgentLogCollector", "status": "active" }
      }
    },
    "user": {
      "id": "user123",
      "role": "admin",
      "permissions": {
        "systemLogs": true,
        "userLogs": true,
        "metrics": true
      }
    }
  }
}
```

#### Get All System Logs

```http
GET /api/v1/logs/system?lines=100&level=all
```

**Query Parameters:**

- `lines` (optional): Number of log lines to retrieve (default: 50)
- `level` (optional): Log level filter - `all`, `error`, `warn`, `info`, `debug` (default: all)
- `service` (optional): Specific service name to filter by

**Response:**

```json
{
  "success": true,
  "data": {
    "services": {
      "backend": {
        "logs": [
          {
            "id": "backend_1234567890_abc123",
            "timestamp": "2024-01-15T10:30:00.000Z",
            "level": "info",
            "message": "Server started successfully",
            "service": "backend",
            "source": "file-logs"
          }
        ],
        "totalLines": 1,
        "source": "file-logs"
      },
      "ai-service": {
        /* ... */
      },
      "agent": {
        /* ... */
      }
    },
    "totalServices": 3,
    "level": "all"
  }
}
```

#### Get Specific Service Logs

```http
GET /api/v1/logs/system/backend?lines=50&level=error
```

**Response:**

```json
{
  "success": true,
  "data": {
    "service": "backend",
    "logs": [
      {
        "id": "backend_1234567890_def456",
        "timestamp": "2024-01-15T10:25:00.000Z",
        "level": "error",
        "message": "Database connection failed",
        "service": "backend",
        "source": "docker-logs",
        "metadata": { "error": "Connection timeout" }
      }
    ],
    "totalLines": 1,
    "streamingEndpoint": "/logs (WebSocket)"
  }
}
```

### User & Deployment Logs

#### Get Project Logs

```http
GET /api/v1/logs/projects/project123?lines=50
```

**Response:**

```json
{
  "success": true,
  "data": {
    "projectId": "project123",
    "logs": [],
    "totalLines": 0,
    "message": "Project logs will be available in the next phase",
    "streamingEndpoint": "/logs (WebSocket)"
  }
}
```

#### Get Deployment Logs

```http
GET /api/v1/logs/deployments/deploy456?lines=100&container=frontend
```

**Query Parameters:**

- `lines` (optional): Number of log lines (default: 50)
- `level` (optional): Log level filter (default: all)
- `container` (optional): Specific container name

**Response:**

```json
{
  "success": true,
  "data": {
    "deploymentId": "deploy456",
    "container": "frontend",
    "logs": [],
    "totalLines": 0,
    "message": "Deployment logs will be available when agent integration is complete",
    "streamingEndpoint": "/logs (WebSocket)"
  }
}
```

### Metrics (Admin Only)

#### Get System Metrics

```http
GET /api/v1/logs/metrics
```

**Response:**

```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "system": {
      "uptime": 86400,
      "loadavg": [0.5, 0.3, 0.2],
      "memory": {
        "total": 8589934592,
        "free": 4294967296,
        "used": 4294967296,
        "usage": 50.0
      },
      "cpu": {
        "cores": 4,
        "architecture": "x64"
      }
    },
    "services": {
      "backend": { "status": "healthy", "connections": 12 },
      "ai-service": { "status": "healthy", "requests": 45 },
      "agent": { "status": "healthy", "deployments": 3 }
    }
  }
}
```

### Stream Management

#### Start Log Stream

```http
POST /api/v1/logs/streams
Content-Type: application/json

{
  "serviceId": "backend",
  "type": "system",
  "options": {
    "realtime": true,
    "level": "all"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "streamId": "stream_1234567890_xyz789",
    "serviceId": "backend",
    "type": "system",
    "userId": "user123",
    "message": "Log stream started successfully",
    "websocketEndpoint": "/logs"
  }
}
```

#### Stop Log Stream

```http
DELETE /api/v1/logs/streams/stream_1234567890_xyz789
```

**Response:**

```json
{
  "success": true,
  "data": {
    "streamId": "stream_1234567890_xyz789",
    "message": "Log stream stopped successfully"
  }
}
```

### Internal Endpoints

#### Receive Logs from Services

```http
POST /api/v1/logs/internal/stream
Content-Type: application/json

{
  "service": "ai-service",
  "level": "info",
  "message": "Processing AI request",
  "timestamp": 1642248600,
  "logger": "ai.processor",
  "metadata": { "requestId": "req123" }
}
```

### Testing Endpoints

#### Generate Test Logs (Admin Only)

```http
POST /api/v1/logs/test
```

**Response:**

```json
{
  "success": true,
  "message": "4 test logs will be sent over the next 4 seconds",
  "data": {
    "testLogs": 4,
    "websocketEndpoint": "/logs"
  }
}
```

#### Cleanup Old Data (Admin Only)

```http
POST /api/v1/logs/cleanup
```

## WebSocket API

### Connection

Connect to the WebSocket namespace with authentication:

```javascript
const socket = io("/logs", {
  auth: {
    token: "your-jwt-token",
  },
});
```

### Events

#### Connection Events

**connection:status** - Sent upon successful connection

```javascript
socket.on("connection:status", (data) => {
  console.log("Connected:", data);
  // {
  //   type: "connected",
  //   userId: "user123",
  //   permissions: {
  //     systemLogs: true,
  //     userLogs: true,
  //     metrics: true
  //   },
  //   availableRooms: ["system:all", "user:user123"],
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
});
```

#### System Log Events (Admin Only)

**Subscribe to System Logs:**

```javascript
socket.emit("system:subscribe", {
  services: ["backend", "ai-service", "agent"],
  realtime: true,
  level: "all",
});
```

**Receive System Logs:**

```javascript
socket.on("system:logs", (data) => {
  console.log("System logs:", data);
});

socket.on("system:log", (logEntry) => {
  console.log("Real-time log:", logEntry);
});
```

**Subscription Confirmation:**

```javascript
socket.on("system:subscribed", (data) => {
  console.log("Subscribed to system logs:", data);
  // {
  //   services: ['backend', 'ai-service', 'agent'],
  //   realtime: true,
  //   room: "system:all",
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
});
```

#### User Log Events

**Subscribe to User Logs:**

```javascript
socket.emit("user:subscribe", {
  projectId: "project123",
  deploymentId: "deploy456", // optional
});
```

**Receive User Logs:**

```javascript
socket.on("user:logs", (data) => {
  console.log("User logs:", data);
});

socket.on("user:subscribed", (data) => {
  console.log("Subscribed to user logs:", data);
});
```

#### Deployment Log Events

**Subscribe to Deployment Logs:**

```javascript
socket.emit("deployment:subscribe", {
  deploymentId: "deploy456",
  realtime: true,
});
```

**Receive Deployment Logs:**

```javascript
socket.on("deployment:logs", (data) => {
  console.log("Deployment logs:", data);
});

socket.on("deployment:subscribed", (data) => {
  console.log("Subscribed to deployment logs:", data);
});
```

#### Metrics Events (Admin Only)

**Subscribe to Metrics:**

```javascript
socket.emit("metrics:subscribe", {
  realtime: true,
});
```

**Receive Metrics:**

```javascript
socket.on("metrics:data", (data) => {
  console.log("Metrics:", data);
});

socket.on("metrics:update", (data) => {
  console.log("Real-time metrics update:", data);
});
```

#### Stream Management Events

**Start Stream:**

```javascript
socket.emit("stream:start", {
  serviceId: "backend",
  type: "system",
  options: { realtime: true },
});
```

**Stop Stream:**

```javascript
socket.emit("stream:stop", {
  streamId: "stream_1234567890_xyz789",
});
```

**Stream Status:**

```javascript
socket.on("stream:started", (data) => {
  console.log("Stream started:", data);
});

socket.on("stream:stopped", (data) => {
  console.log("Stream stopped:", data);
});
```

#### Room Management Events

**Join Room:**

```javascript
socket.emit("room:join", {
  roomId: "project:project123",
});
```

**Leave Room:**

```javascript
socket.emit("room:leave", {
  roomId: "project:project123",
});
```

**Room Events:**

```javascript
socket.on("room:joined", (data) => {
  console.log("Joined room:", data);
});

socket.on("room:left", (data) => {
  console.log("Left room:", data);
});
```

#### Error Handling

```javascript
socket.on("error", (error) => {
  console.error("WebSocket error:", error);
  // {
  //   message: "Access denied to system logs",
  //   code: "PERMISSION_DENIED"
  // }
});
```

## Room Structure

The WebSocket namespace uses a room-based organization for efficient log distribution:

### Room Types

- **system:all** - All system logs (admin only)
- **metrics:system** - System metrics (admin only)
- **admin:all** - Combined admin view (admin only)
- **user:{userId}** - User-specific logs
- **project:{projectId}** - Project-specific logs
- **deployment:{deploymentId}** - Deployment-specific logs

### Access Control

- **Admin users** can join any room
- **Regular users** can only join rooms for their own projects and deployments
- **System and metrics rooms** are restricted to admin users only

## Authentication & Authorization

### JWT Token Requirements

All API endpoints and WebSocket connections require a valid JWT token with:

- **User ID** - For user-specific access control
- **Role** - `admin` for system access, `user` for limited access
- **Valid expiration** - Non-expired token

### Permission Levels

1. **Admin Access**

   - Full system logs and metrics
   - All user logs and deployments
   - Stream management
   - System administration

2. **User Access**
   - Own project and deployment logs
   - Limited metrics (if enabled)
   - Own stream management

## Error Responses

### Common Error Codes

- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Insufficient permissions for the requested resource
- **404 Not Found** - Resource (stream, deployment, project) not found
- **500 Internal Server Error** - Server-side error during processing
- **503 Service Unavailable** - WebSocket namespace or service unavailable

### Error Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **API Endpoints**: 100 requests per minute per user
- **WebSocket Events**: 50 events per minute per connection
- **Stream Management**: 10 stream operations per minute per user

## Best Practices

### For Frontend Integration

1. **Use WebSocket for real-time logs**, REST API for historical data
2. **Implement reconnection logic** for WebSocket connections
3. **Handle authentication errors** gracefully with token refresh
4. **Limit log buffer size** to prevent memory issues
5. **Implement log level filtering** for better performance

### For Service Integration

1. **Use internal streaming endpoints** for service-to-service communication
2. **Include proper metadata** in log entries for better debugging
3. **Implement structured logging** with consistent formats
4. **Handle connection failures** with appropriate fallbacks

### For Performance

1. **Use appropriate log levels** to reduce noise
2. **Limit log line requests** to reasonable numbers
3. **Implement client-side caching** for historical logs
4. **Use room-based subscriptions** to reduce unnecessary data transfer

## Migration from Old System

### Deprecated Endpoints

The following endpoints are deprecated and will be removed:

- `/health/logs/*` → Use `/api/v1/logs/system/*`
- `/api/internal/logs/*` → Use `/api/v1/logs/internal/*`

### Migration Steps

1. Update frontend to use new API endpoints
2. Update WebSocket connections to use enhanced namespace
3. Configure environment variables for remote agent
4. Test thoroughly before removing old endpoint dependencies

## Support

For issues or questions about the logging system:

1. Check the migration report in `dev/archive/logging-migration-*/`
2. Review the architecture documentation in `dev/architecture/LOGGING_ARCHITECTURE_DESIGN.md`
3. Test with the provided API examples
4. Verify WebSocket connections and authentication
