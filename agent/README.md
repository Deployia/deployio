# DeployIO Agent - Modular Architecture

## 📁 Directory Structure

```
agent/
├── app/                          # Main application package
│   ├── __init__.py
│   ├── main.py                   # FastAPI application factory
│   ├── core/                     # Core configuration and utilities
│   │   ├── __init__.py
│   │   ├── config.py            # Settings with Pydantic validation
│   │   ├── logging.py           # Logging configuration
│   │   └── events.py            # Startup/shutdown event handlers
│   ├── services/                 # Business logic services
│   │   ├── __init__.py
│   │   ├── log_bridge.py        # WebSocket log bridge service
│   │   └── health_monitor.py    # Health monitoring service
│   ├── middleware/              # FastAPI middleware
│   │   ├── __init__.py
│   │   ├── auth.py              # Authentication middleware
│   │   └── exception_handlers.py # Global exception handlers
│   └── routes/                  # API route handlers
│       ├── __init__.py
│       ├── health.py            # Health check endpoints
│       ├── logs.py              # Log management endpoints
│       └── system.py            # System information endpoints
├── main_new.py                  # Application entry point
├── requirements-new.txt         # Updated dependencies
├── deploy_new.sh               # Deployment script
└── README-new.md               # This documentation
```

## 🚀 Features

### ✅ Working Features

1. **Modular Architecture**

   - Clean separation of concerns
   - Follows FastAPI best practices
   - Easy to test and maintain

2. **WebSocket Log Bridge**

   - Real-time log streaming to platform
   - Automatic reconnection with exponential backoff
   - System and Docker log monitoring
   - Heartbeat and health checks

3. **Health Monitoring**

   - System metrics collection (CPU, Memory, Disk, Network)
   - Process monitoring
   - Docker container status
   - Health status reporting

4. **Authentication**

   - Agent secret-based authentication
   - Token validation with platform backend
   - Middleware-based security

5. **API Endpoints**
   - RESTful API design
   - Comprehensive health checks
   - Log retrieval and status
   - System information and monitoring

### 🔧 Configuration

The agent uses Pydantic settings for configuration management:

```python
# Environment variables (or .env file)
DEBUG=false
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
AGENT_SECRET=your-secret-here
PLATFORM_URL=https://deployio.tech
AGENT_ID=agent-ec2-2
LOG_BRIDGE_ENABLED=true
```

### 🌐 WebSocket Connection

The agent connects to the platform via WebSocket:

- **Local**: `ws://127.0.0.1:3000/agent-bridge`
- **Production**: `wss://deployio.tech/agent-bridge`

**Authentication Headers**:

- `x-agent-secret`: Agent authentication secret
- `x-agent-id`: Unique agent identifier
- `x-agent-domain`: Platform domain

### 📊 API Endpoints

#### Health Endpoints

- `GET /` - Service information
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with system metrics

#### Log Management

- `GET /agent/v1/logs` - Get recent logs with filtering
- `GET /agent/v1/logs/status` - Log bridge connection status
- `POST /agent/v1/logs/test` - Test log bridge connection

#### System Information

- `GET /agent/v1/system` - Current system information
- `GET /agent/v1/containers` - Docker containers status
- `GET /agent/v1/processes` - Top processes by CPU usage

### 🔄 Log Processing Flow

1. **Application Logs** → Custom LogHandler → Buffer → WebSocket Batch
2. **System Metrics** → Background Monitor → WebSocket Stream
3. **Docker Logs** → Container Monitor → WebSocket Stream
4. **Platform** ← Real-time Distribution ← Log Processing

### 🐳 Production Deployment

The agent automatically connects to the production platform when:

1. **Traefik Configuration** routes `/agent-bridge` to backend service
2. **SSL/TLS** terminates properly for WebSocket upgrades
3. **Environment Variables** are set correctly for production

### 🛠️ Key Improvements Over Legacy Code

1. **Modular Design**: Each component has a single responsibility
2. **Type Safety**: Pydantic models for configuration and API
3. **Error Handling**: Comprehensive exception handling and logging
4. **Testing Ready**: Clean architecture makes testing easier
5. **Documentation**: Auto-generated API docs via FastAPI
6. **Performance**: Async/await throughout for better concurrency
7. **Security**: Middleware-based authentication and validation

### 🔍 Monitoring and Debugging

**Health Checks**:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/detailed
```

**Log Bridge Status**:

```bash
curl http://localhost:8000/agent/v1/logs/status
```

**System Information**:

```bash
curl http://localhost:8000/agent/v1/system
curl http://localhost:8000/agent/v1/containers
```

**API Documentation** (Debug Mode):

- http://localhost:8000/agent/docs
- http://localhost:8000/agent/redoc

### 🚀 Getting Started

1. **Install Dependencies**:

   ```bash
   pip install -r requirements-new.txt
   ```

2. **Configure Environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run Agent**:

   ```bash
   python main_new.py
   ```

4. **Deploy to Production**:
   ```bash
   chmod +x deploy_new.sh
   ./deploy_new.sh
   ```

### 🎯 Next Steps

1. **Migration**: Replace old agent with modular version
2. **Testing**: Add comprehensive test suite
3. **Monitoring**: Integrate with platform monitoring
4. **Features**: Add deployment management capabilities
5. **Security**: Implement additional security measures

---

## 🚧 Migration Notes

- **Backup**: Old agent files are automatically backed up
- **Compatibility**: API endpoints maintain backward compatibility
- **Configuration**: Environment variables remain the same
- **Deployment**: Zero-downtime deployment possible
