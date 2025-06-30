# Agent Log Bridge - Testing Guide

## 🚀 Quick Setup for Testing

### 1. Agent Configuration (.env file)

Make sure your `agent/.env` file includes these settings:

```bash
# Agent Log Bridge Configuration
AGENT_ID=agent-ec2-2
LOG_BRIDGE_ENABLED=true
LOG_BRIDGE_RECONNECT_ATTEMPTS=10
LOG_BRIDGE_RECONNECT_DELAY=5
LOG_BRIDGE_BUFFER_SIZE=1000
LOG_BRIDGE_BATCH_SIZE=50
LOG_BRIDGE_FLUSH_INTERVAL=5

# Platform Communication
PLATFORM_URL=https://deployio.tech  # Or your server URL
AGENT_SECRET=your-secure-agent-secret-change-this
```

### 2. Start Services

**Terminal 1 - Start Platform (EC2-1 simulation):**

```bash
cd server
npm run dev
```

**Terminal 2 - Start Agent (EC2-2 simulation):**

```bash
cd agent
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Test Log Integration

1. **Open Admin UI**: Navigate to `http://localhost:3000/admin/services/agent`
2. **Start Live Logs**: Click the "Start Live" button
3. **Generate Logs**: Make requests to the agent to generate logs:
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/api/deployments
   ```

### 4. What You Should See

✅ **Agent logs appearing in real-time in the admin UI**
✅ **FastAPI logs (uvicorn, fastapi, custom loggers)**
✅ **Auto-scroll to bottom with new logs**
✅ **Log filtering and level selection**
✅ **Real-time indicator showing live stream status**

### 5. Log Sources Captured

- **FastAPI Application Logs**: All Python logger output
- **Uvicorn Server Logs**: Web server logs
- **Custom Logger Output**: Your application logs
- **System Integration**: Ready for Docker & system logs

### 6. Troubleshooting

**If logs don't appear:**

1. Check browser console for WebSocket connection errors
2. Verify agent .env configuration
3. Check server logs for agent authentication
4. Ensure ports 3000 (frontend), 5000 (backend), 8000 (agent) are available

**Log Bridge Status:**

- Agent: `http://localhost:8000/log-bridge/status`
- Server: Check WebSocket connection in browser dev tools

### 7. Features Available

- **Real-time streaming** with auto-scroll
- **Log level filtering** (Error, Warn, Info, Debug)
- **Text search** across log content
- **Export logs** to file
- **Copy logs** to clipboard
- **Manual scroll control** with scroll-to-bottom button

The system is now ready for production deployment with comprehensive log streaming! 🎉
