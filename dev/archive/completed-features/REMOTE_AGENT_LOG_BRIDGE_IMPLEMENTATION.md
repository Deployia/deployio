# Remote Agent Log Bridge - Implementation Documentation

## 🎯 **Overview**

This document describes the implementation of the Remote Agent Log Bridge system that enables real-time log streaming between the deployment agent (EC2-2) and the platform server (EC2-1).

## 🏗️ **Architecture Components**

### **Agent Side (EC2-2)**

- **`AgentLogBridge`** (`services/log_bridge.py`): Main WebSocket client for streaming logs
- **`LogBridgeHandler`** (`services/log_bridge.py`): Custom Python logging handler for FastAPI logs
- **`LogBridgeStarter`** (`services/log_bridge_starter.py`): Startup/shutdown management
- **Route Integration**: Integrated into FastAPI routes for management endpoints

### **Server Side (EC2-1)**

- **`AgentBridgeNamespace`** (`websockets/namespaces/AgentBridgeNamespace.js`): WebSocket namespace handler
- **`RemoteAgentLogBridge`** (`services/logging/RemoteAgentLogBridge.js`): Log processing and distribution
- **`LogStreamingNamespace`** (`websockets/namespaces/LogStreamingNamespace.js`): Unified log streaming
- **WebSocket Integration**: Integrated into existing WebSocket infrastructure

### **Client Side (Frontend)**

- **`useLogStream.js`**: React hook for consuming real-time logs
- **`ServiceLogs.jsx`**: Log display component for any service (backend, ai-service, agent)
- **`ServiceDetailPage.jsx`**: Admin UI for viewing agent logs at `/admin/services/agent`

## 📊 **Data Flow**

```
Agent EC2-2                    Server EC2-1                    Client Browser
     │                              │                              │
     ├─ Docker Logs ──┐              │                              │
     ├─ System Logs ──┼─► [Buffer] ──┼─► AgentBridgeNamespace ──┐   │
     ├─ Deploy Logs ──┘              │                          │   │
     │                              │                          ▼   │
     ├─ WebSocket ═══════════════════┼═► Log Processing ─────► Rooms ═══► Client
     │   Connection                  │   & Enrichment          │   │
     │                              │                          │   │
     ├─ Health Status ══════════════►│                          │   │
     │                              │                          │   │
     └─ Authentication ═════════════►│                          └──►│
                                    │                              │
                                    ▼                              │
                              AI Service ◄─────────────────────────┘
                           (Log Analysis)
```

## 🔧 **Implementation Details**

### **1. Agent-Side WebSocket Client**

**File**: `agent/services/log_bridge.py`

**Key Features**:

- Socket.IO client for real-time connection
- Multiple log source support (Docker, system, deployment)
- Log buffering and batch sending
- Automatic reconnection with exponential backoff
- Health monitoring and status reporting

**Configuration**:

```python
WEBSOCKET_CONFIG = {
    "server_url": "wss://deployio.tech/agent-bridge",
    "agent_secret": env.AGENT_SECRET,
    "agent_id": "agent-ec2-2",
    "log_sources": ["docker", "system", "deployments"],
    "batch_size": 50,
    "flush_interval": 5
}
```

### **2. Server-Side Namespace Handler**

**File**: `server/websockets/namespaces/AgentBridgeNamespace.js`

**Key Features**:

- Custom agent authentication
- Room-based log distribution
- Real-time agent status monitoring
- Stream management and routing

**Authentication Flow**:

```javascript
// Agent identifies with secret
agent:identify → validate_credentials → agent_authenticated

// Agent sends logs
agent:logs_batch → process_logs → distribute_to_rooms
```

### **3. Enhanced Log Processing**

**File**: `server/services/logging/EnhancedRemoteAgentLogBridge.js`

**Key Features**:

- Log enrichment and categorization
- Severity scoring
- User subscription management
- AI service integration

**Log Processing Pipeline**:

```javascript
Raw Log → Normalize → Categorize → Score → Route → Distribute
```

## 🚀 **Deployment Instructions**

### **Phase 1: Agent Setup**

1. **Install Dependencies**:

   ```bash
   cd agent/
   pip install python-socketio>=5.10.0
   ```

2. **Configure Environment**:

   ```bash
   # .env.production
   AGENT_SECRET=your-secure-agent-secret
   PLATFORM_URL=https://deployio.tech
   AGENT_ID=agent-ec2-2
   ```

3. **Start Agent**:
   ```bash
   python main.py
   ```

### **Phase 2: Server Setup**

1. **Enable Agent Bridge**:

   ```javascript
   // server.js
   features: {
     agentBridge: true,  // Enable
     logStreaming: true,
     // ... other features
   }
   ```

2. **Restart Server**:
   ```bash
   npm restart
   ```

## 🔐 **Security Implementation**

### **Authentication**

- Agent secret validation
- Header-based authentication
- Connection timeout protection

### **Authorization**

- Room-based access control
- User-specific log filtering
- Admin-only system logs

### **Network Security**

- WSS (Secure WebSocket) connections
- Rate limiting per agent
- Connection monitoring

## 📈 **Monitoring & Health Checks**

### **Agent Health**

- Connection status monitoring
- Automatic reconnection
- Heartbeat mechanism
- Performance metrics

### **Server Monitoring**

- Connected agents tracking
- Log processing metrics
- Room subscription stats
- Error rate monitoring

## 🎛️ **Management APIs**

### **Agent Management**

```bash
# Start log bridge
POST /agent/v1/log-bridge/start

# Stop log bridge
POST /agent/v1/log-bridge/stop

# Get status
GET /agent/v1/log-bridge/status
```

### **Server Management**

```javascript
// Get connected agents
const agents = enhancedRemoteAgentLogBridge.getConnectedAgents();

// Request specific log stream
const streamId = await bridge.requestLogStream("agent-ec2-2", "docker");

// Get statistics
const stats = bridge.getStatistics();
```

## 🔮 **Future Enhancements**

### **Phase 2 Features**

- Multiple agent support
- Log persistence to MongoDB
- Advanced filtering and search
- Real-time log analytics dashboard

### **Phase 3 Features**

- Build log integration
- Deployment log streaming
- Cross-service log correlation
- Machine learning-based anomaly detection

### **Phase 4 Features**

- Multi-region agent support
- Custom log parsers
- Log retention policies
- Advanced visualization

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Agent Connection Failed**

   - Check `AGENT_SECRET` configuration
   - Verify server WebSocket namespace is enabled
   - Check network connectivity

2. **Logs Not Appearing**

   - Verify log sources are enabled
   - Check user permissions for log rooms
   - Confirm WebSocket client connection

3. **High Memory Usage**
   - Adjust `buffer_size` and `batch_size`
   - Check log processing backlog
   - Monitor memory usage patterns

### **Debug Commands**

```bash
# Agent logs
tail -f agent/logs/agent.log

# Server logs
tail -f server/logs/combined.log

# WebSocket connections
curl https://deployio.tech/health/websocket

# Agent status
curl https://agent.deployio.tech/agent/v1/log-bridge/status
```

## 📊 **Performance Metrics**

### **Expected Performance**

- **Latency**: < 1 second for log delivery
- **Throughput**: 1000+ logs/second
- **Memory**: < 100MB per agent
- **CPU**: < 5% overhead

### **Scaling Limits**

- **Single Agent**: 10,000 logs/minute
- **Concurrent Users**: 50+ simultaneous log viewers
- **Buffer Size**: 1000 logs maximum
- **Reconnection**: 10 attempts with exponential backoff

---

## 🎉 **Implementation Status**

- ✅ **Phase 1**: Agent WebSocket client
- ✅ **Phase 1**: Server namespace handler
- ✅ **Phase 1**: Authentication system
- ✅ **Phase 1**: Basic log streaming
- 🔄 **Phase 2**: Testing and optimization
- 📋 **Phase 3**: AI service integration
- 📋 **Phase 4**: Production deployment

**Ready for testing and integration!**
