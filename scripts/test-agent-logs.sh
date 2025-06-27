#!/bin/bash

# Test script for Agent Log Bridge Integration
# Tests that agent logs appear in the admin UI

set -e

echo "🧪 Testing Agent Log Bridge Integration"
echo "======================================="

# Test 1: Check if RemoteAgentLogBridge is correctly configured
echo "1. Checking RemoteAgentLogBridge configuration..."
if grep -q "RemoteAgentLogBridge" server/server.js; then
    echo "✓ RemoteAgentLogBridge found in server.js"
else
    echo "✗ RemoteAgentLogBridge not found in server.js"
    exit 1
fi

# Test 2: Check if AgentBridgeNamespace integrates with LogStreamingNamespace
echo "2. Checking AgentBridgeNamespace integration..."
if grep -q "integrateWithLogStreaming" server/websockets/namespaces/AgentBridgeNamespace.js; then
    echo "✓ AgentBridgeNamespace integrates with LogStreamingNamespace"
else
    echo "✗ AgentBridgeNamespace integration missing"
    exit 1
fi

# Test 3: Check if agent is included in valid services on client
echo "3. Checking client-side agent support..."
if grep -q '"agent"' client/src/pages/ServiceDetailPage.jsx; then
    echo "✓ Agent included in valid services"
else
    echo "✗ Agent not included in valid services"
    exit 1
fi

# Test 4: Check if LogBridgeHandler is properly set up
echo "4. Checking Python LogBridgeHandler..."
if grep -q "LogBridgeHandler" agent/services/log_bridge.py; then
    echo "✓ LogBridgeHandler found in log_bridge.py"
else
    echo "✗ LogBridgeHandler not found"
    exit 1
fi

# Test 5: Check if main.py sets up the log handler
echo "5. Checking main.py log handler setup..."
if grep -q "setup_log_bridge_handler" agent/main.py; then
    echo "✓ Log handler setup found in main.py"
else
    echo "✗ Log handler setup missing from main.py"
    exit 1
fi

# Test 6: Check if ServiceLogs.jsx supports agent logs
echo "6. Checking ServiceLogs agent support..."
if grep -q 'agent.*application' client/src/components/ServiceLogs.jsx; then
    echo "✓ ServiceLogs supports agent logs"
else
    echo "✗ ServiceLogs agent support missing"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Agent log integration is ready."
echo ""
echo "📋 Next Steps:"
echo "  1. Start the platform server (EC2-1)"
echo "  2. Start the agent service (EC2-2)"
echo "  3. Navigate to /admin/services/agent in the browser"
echo "  4. Click 'Start Live Logs' to see real-time FastAPI logs"
echo ""
echo "💡 Test logging by making requests to the agent or checking agent endpoints"
echo "   Agent logs should appear in real-time in the admin UI"
