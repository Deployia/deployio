# DeployIO Agent-Server Bridge Architecture - Strategic Plan

**Date**: June 29, 2025  
**Status**: Cleanup Complete - Ready for Redesign  
**Phase**: Architecture Planning & Implementation

## 📋 **Cleanup Summary - COMPLETED** ✅

### **Server-Side Cleanup**

- ✅ **AgentLogCollector**: Simplified to HTTP polling only, removed WebSocket dependencies
- ✅ **AgentBridgeNamespace**: Moved to backup, removed from initialization
- ✅ **RemoteAgentLogBridge**: Moved to backup, removed from server.js
- ✅ **WebSocket Registry**: Removed agent bridge namespace registration

### **Agent-Side Cleanup**

- ✅ **LogBridgeService**: Moved to backup (log_bridge_old.py)
- ✅ **Events Handler**: Removed log bridge startup/shutdown
- ✅ **Services Module**: Removed log bridge export
- ✅ **Configurations**: Log bridge configs remain for future use

### **Current State - Post Cleanup**

```
Server: HTTP Polling → AgentLogCollector → UnifiedLogCollector → LogStreamingNamespace → Client
Agent: Standard HTTP API → Server (no WebSocket bridge)
```

---

## 🏗️ **New Architecture Design**

### **Core Principles**

1. **AI-First**: All traffic routes through server for AI analysis
2. **User Isolation**: Room-based access control for container/deployment logs
3. **Unified Namespaces**: Consistent namespace structure across agent and server
4. **Server-Routed**: Authentication and authorization centralized in Express backend

### **Target Architecture**

```
Agent WebSocketManager (Namespaces: /agent-logs, /agent-metrics, /agent-builds, /agent-deployments)
         ↓ (Authenticated Server Connection)
Server Bridge Service (Routes & AI Analysis)
         ↓ (Room-based Distribution)
Client WebSocketManager (Namespaces: /logs, /metrics, /notifications)
```

---

## 🔧 **Implementation Phases**

### **Phase 1: Agent WebSocket Infrastructure** 🚀

**Goal**: Build agent-side WebSocket architecture

#### **Agent Components to Build**

```python
# Agent WebSocket Manager
agent/app/websockets/
├── manager.py              # WebSocketManager (similar to server)
├── namespaces/
│   ├── logs_namespace.py   # System logs (admin only)
│   ├── metrics_namespace.py # System + container metrics
│   ├── builds_namespace.py # Build logs (user-specific)
│   └── deployments_namespace.py # Deployment status
└── core/
    ├── registry.py         # Namespace registry
    └── auth.py            # Server authentication
```

#### **Namespace Responsibilities**

- **`/agent-logs`**: System logs, Docker logs → Admin only
- **`/agent-metrics`**: System metrics → Admin, Container metrics → Users
- **`/agent-builds`**: Build logs → Specific users only
- **`/agent-deployments`**: Deployment status → Specific users only

#### **Room Structure**

```
/agent-logs:
  - admin-system-logs     # All system logs

/agent-metrics:
  - admin-system-metrics  # System-wide metrics
  - user-{userId}-metrics # User container metrics

/agent-builds:
  - user-{userId}-builds  # User build logs

/agent-deployments:
  - user-{userId}-deployments # User deployment status
```

---

### **Phase 2: Server Bridge Service** 🌉

**Goal**: Build intelligent routing layer between agent and clients

#### **Server Components to Build**

```javascript
server/services/bridge/
├── AgentBridgeService.js    # Main bridge coordinator
├── AgentConnectionManager.js # Manage agent connections
├── StreamRouter.js          # Route agent streams to client namespaces
├── AIAnalysisMiddleware.js  # Send logs to AI service
└── UserAccessControl.js    # Validate user permissions
```

#### **Bridge Responsibilities**

1. **Agent Authentication**: Validate agent connections
2. **Stream Routing**: Route agent streams to appropriate client rooms
3. **AI Integration**: Send all logs/metrics to AI service for analysis
4. **Access Control**: Ensure users only see their data
5. **Load Balancing**: Handle multiple agents (future)

#### **Data Flow**

```
Agent Room (user-123-builds) → Bridge → Client Room (user-123-logs) → User 123
Agent Room (admin-system-logs) → Bridge → Client Room (admin-logs) → Admin Users
```

---

### **Phase 3: Client Integration** 👥

**Goal**: Seamless client experience with existing namespaces

#### **Client-Side Changes (Minimal)**

- **LogStreamingNamespace**: Add agent log sources
- **MetricsNamespace**: Add agent metrics sources
- **Rooms**: Support user-specific agent data

#### **Unified Experience**

```javascript
// Client connects to existing namespaces
/logs     - Now includes agent logs (routed from agent-logs)
/metrics  - Now includes agent metrics (routed from agent-metrics)
/notifications - Status updates about agent connectivity
```

---

## 🔐 **Security & Access Control**

### **Agent-Server Authentication**

```python
# Agent connects with secret + agent ID
headers = {
    "x-agent-secret": settings.agent_secret,
    "x-agent-id": settings.agent_id,
    "x-platform-domain": settings.platform_url
}
```

### **User Isolation**

```javascript
// Bridge validates user permissions before routing
if (isUserAuthorized(userId, containerLogs)) {
  routeToUserRoom(`user-${userId}-logs`, logData);
}
```

### **Admin Access**

```javascript
// Admin gets all system logs
if (user.role === "admin") {
  joinRoom("admin-system-logs");
  joinRoom("admin-system-metrics");
}
```

---

## 🎯 **Benefits of New Architecture**

### **For Users**

- ✅ Real-time container logs and metrics
- ✅ Build progress and deployment status
- ✅ Secure isolation (only see own data)

### **For Admins**

- ✅ System-wide visibility
- ✅ Agent health monitoring
- ✅ Unified log management

### **For AI Service**

- ✅ All data flows through analysis pipeline
- ✅ Real-time insights and anomaly detection
- ✅ Historical data for model training

### **For Development**

- ✅ Clean separation of concerns
- ✅ Scalable to multiple agents
- ✅ Consistent with existing patterns

---

## 🚀 **Implementation Priority**

### **Immediate Next Steps** (This Week)

1. **Agent WebSocketManager**: Build core infrastructure
2. **Basic Namespaces**: Start with `/agent-logs` namespace
3. **Server Bridge**: Basic routing proof-of-concept
4. **Testing**: Agent-server connection

### **Week 2**

1. **Complete Agent Namespaces**: All 4 namespaces
2. **Advanced Bridge**: AI integration, access control
3. **Client Integration**: Update existing namespaces

### **Week 3**

1. **Production Testing**: Full end-to-end testing
2. **Performance Optimization**: Connection pooling, buffering
3. **Documentation**: API docs, troubleshooting guides

---

## ❓ **Technical Decisions Made**

### **1. Agent WebSocket Architecture**: ✅ YES

- Separate agent WebSocketManager with dedicated namespaces
- Organized, scalable approach for different data types

### **2. Direct vs Server-Routed**: ✅ SERVER-ROUTED

- AI-first approach requires server analysis
- Centralized auth/user management in Express
- Better security and control

### **3. Namespace Strategy**: ✅ UNIFIED

- Agent: `/agent-*` namespaces
- Server: Bridge to existing `/logs`, `/metrics`
- Consistent with UnifiedLogCollector pattern

### **4. Room Structure**: ✅ USER-ISOLATED

- `user-{userId}-*` for user-specific data
- `admin-*` for system-wide admin data
- Secure, scalable access control

---

## 📝 **Next Action Items**

### **Before Implementation**

- [ ] Review and approve this strategic plan
- [ ] Confirm technical decisions
- [ ] Set implementation timeline

### **Ready to Start**

- [ ] Build Agent WebSocketManager base infrastructure
- [ ] Create `/agent-logs` namespace for system logs
- [ ] Build basic Server Bridge for routing
- [ ] Test agent-server WebSocket connection

---

**Status**: 📋 **STRATEGIC PLAN COMPLETE - READY FOR IMPLEMENTATION**

Would you like me to proceed with **Phase 1: Agent WebSocket Infrastructure** implementation?
