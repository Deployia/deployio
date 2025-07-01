# AI Service WebSocket Architecture Documentation

## Overview

The AI Service has been migrated from HTTP polling to a fully WebSocket-based architecture for real-time processing and streaming. This provides better performance, real-time updates, and efficient resource utilization.

## Architecture Components

### 1. AI Service WebSocket Manager (`websockets/manager.py`)

**Purpose**: Manages WebSocket connection to the DeployIO server
**Key Features**:

- Automatic reconnection with exponential backoff
- Bridge handshake system (similar to agent bridge)
- Health checks and heartbeat monitoring
- Namespace management for different AI operations

**Connection Flow**:

1. Connect to server's `/ai-service` namespace
2. Register service capabilities
3. Perform bridge handshake
4. Send connection ACK
5. Initialize operation namespaces

### 2. AI Service Namespaces

#### Analysis Namespace (`websockets/namespaces/analysis_namespace.py`)

**Purpose**: Handles repository analysis requests with real-time progress streaming

**Capabilities**:

- Repository analysis processing
- Real-time progress updates
- Multi-stack detection (Docker, Kubernetes, CI/CD, etc.)
- Quality analysis and recommendations

**Events**:

- `analysis_request` - Incoming analysis request from server
- `analysis_progress` - Progress updates sent to server
- `analysis_complete` - Results sent to server
- `analysis_error` - Error notifications

#### Generation Namespace (`websockets/namespaces/generation_namespace.py`)

**Purpose**: Handles configuration generation requests with streaming

**Capabilities**:

- Configuration file generation
- Individual config generation (Dockerfile, docker-compose, k8s, etc.)
- Real-time progress tracking
- Template-based generation

**Events**:

- `generation_request` - Incoming generation request
- `individual_generation_request` - Single config generation
- `generation_progress` - Progress updates
- `generation_complete` - Generated configurations
- `generation_error` - Error handling

### 3. Server-Side AI Service Bridge (`server/services/bridge/AIServiceBridgeService.js`)

**Purpose**: Manages AI service connections on the server side
**Key Features**:

- Single AI service connection enforcement
- Bridge handshake and ACK system
- Health monitoring and periodic pings
- Stream routing to appropriate client namespaces

**Connection Management**:

- Validates AI service connections
- Handles registration and capabilities
- Routes AI responses to correct client sessions
- Manages disconnection cleanup

## Migration from HTTP to WebSocket

### Before (HTTP Polling):

```
Client → Server → HTTP Request → AI Service
                ← HTTP Response ←
```

### After (WebSocket Streaming):

```
Client ↔ Server ↔ WebSocket Bridge ↔ AI Service
      Real-time bidirectional communication
```

## Benefits of WebSocket Architecture

### 1. **Real-time Processing**

- Instant progress updates during analysis/generation
- No polling delays or overhead
- Better user experience with live feedback

### 2. **Resource Efficiency**

- Persistent connections reduce overhead
- No repeated HTTP handshakes
- Lower latency for operations

### 3. **Scalable Streaming**

- Handle multiple concurrent sessions
- Stream large analysis results efficiently
- Real-time error handling and recovery

### 4. **Reliability**

- Automatic reconnection on disconnection
- Health checks and heartbeat monitoring
- Bridge handshake for connection verification

## Event Flow Examples

### Repository Analysis Flow:

```
1. Client → Server: "analyze_repository" request
2. Server → AI Service: "analysis_request" via bridge
3. AI Service → Server: "analysis_progress" updates (real-time)
4. Server → Client: Progress forwarded to client session
5. AI Service → Server: "analysis_complete" with results
6. Server → Client: Final results delivered
```

### Configuration Generation Flow:

```
1. Client → Server: "generate_configs" request
2. Server → AI Service: "generation_request" via bridge
3. AI Service → Server: "generation_progress" (real-time)
4. Server → Client: Progress streamed to client
5. AI Service → Server: "generation_complete" with configs
6. Server → Client: Generated configurations delivered
```

## Connection Management

### AI Service Connection:

- **Single Connection**: Only one AI service can connect at a time
- **Health Monitoring**: Periodic ping/pong for connection health
- **Auto-Reconnection**: Automatic reconnection with exponential backoff
- **Bridge Handshake**: Verification system similar to agent bridge

### Session Management:

- Each client request gets a unique session ID
- Sessions are tracked across all namespaces
- Progress updates are routed to correct client sessions
- Automatic cleanup on completion or timeout

## Configuration

### AI Service WebSocket Settings (`.env`):

```env
SERVER_WEBSOCKET_URL=http://localhost:3000
WEBSOCKET_ENABLED=true
WEBSOCKET_RECONNECT_ATTEMPTS=5
WEBSOCKET_RECONNECT_DELAY=5
```

### Server Features Configuration:

```javascript
features: {
  ai: true, // Enable AI service bridge
  // ... other features
}
```

## Error Handling

### Connection Errors:

- Automatic retry with exponential backoff
- Fallback to HTTP if WebSocket fails (future enhancement)
- Detailed error logging and monitoring

### Processing Errors:

- Real-time error notifications to clients
- Session cleanup on errors
- Error context preservation and logging

## Future Enhancements

### 1. **Metrics Streaming**

- Real-time performance metrics
- Resource usage monitoring
- Processing time analytics

### 2. **Multi-AI Service Support**

- Load balancing across multiple AI services
- Failover mechanisms
- Distributed processing

### 3. **Advanced Streaming**

- File upload/download streaming
- Binary data handling
- Compressed data streams

## Development Guidelines

### Adding New AI Operations:

1. Create new namespace class extending `BaseAINamespace`
2. Register namespace in AI service manager
3. Add corresponding handlers in server bridge
4. Implement client-side event handlers
5. Add progress tracking and error handling

### Testing WebSocket Connections:

1. Use WebSocket testing tools for connection validation
2. Test reconnection scenarios
3. Validate progress streaming accuracy
4. Test error handling and recovery

## Monitoring and Debugging

### Connection Status:

- AI service connection status available via health endpoint
- Bridge handshake completion tracking
- Real-time connection statistics

### Performance Metrics:

- Message processing times
- Connection stability metrics
- Error rates and types

### Logging:

- Structured logging for all WebSocket events
- Debug levels for detailed troubleshooting
- Connection lifecycle tracking

---

This WebSocket-based architecture provides a robust, scalable foundation for real-time AI processing in the DeployIO platform.
