#!/bin/bash

# Remote Agent Log Bridge - Test Script
# Tests the log bridge implementation

echo "🚀 Testing Remote Agent Log Bridge Implementation"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"

    echo -n "Testing $test_name... "

    if eval "$test_command" >/dev/null 2>&1; then
        if [ "$expected_status" = "0" ]; then
            echo -e "${GREEN}PASS${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}FAIL${NC} (expected failure but passed)"
            ((TESTS_FAILED++))
        fi
    else
        if [ "$expected_status" = "1" ]; then
            echo -e "${GREEN}PASS${NC} (expected failure)"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}FAIL${NC}"
            ((TESTS_FAILED++))
        fi
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"

    echo -n "Checking $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $response)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}FAIL${NC} (HTTP $response, expected $expected_status)"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "🔍 Phase 1: File Structure Tests"
echo "================================"

# Check if key files exist
run_test "Agent log bridge service" "[ -f 'agent/services/log_bridge.py' ]" "0"
run_test "Agent log bridge starter" "[ -f 'agent/services/log_bridge_starter.py' ]" "0"
run_test "Server agent bridge namespace" "[ -f 'server/websockets/namespaces/AgentBridgeNamespace.js' ]" "0"
run_test "Enhanced log bridge service" "[ -f 'server/services/logging/EnhancedRemoteAgentLogBridge.js' ]" "0"
run_test "Implementation documentation" "[ -f 'dev/REMOTE_AGENT_LOG_BRIDGE_IMPLEMENTATION.md' ]" "0"

echo ""
echo "🔧 Phase 2: Configuration Tests"
echo "==============================="

# Check if dependencies are added
run_test "Socket.IO dependency added" "grep -q 'python-socketio' agent/requirements.txt" "0"
run_test "WebSocket integration" "grep -q 'AgentBridgeNamespace' server/websockets/index.js" "0"
run_test "Agent bridge feature enabled" "grep -q 'agentBridge.*true' server/websockets/index.js" "0"

echo ""
echo "🌐 Phase 3: Service Availability Tests"
echo "======================================"

# Test agent endpoints (if running)
if pgrep -f "python.*main.py" >/dev/null; then
    echo "Agent service detected, testing endpoints..."
    check_endpoint "Agent health check" "http://localhost:8000/agent/v1/health" "200"
    check_endpoint "Agent log bridge status" "http://localhost:8000/agent/v1/log-bridge/status" "200"
else
    echo -e "${YELLOW}Agent service not running, skipping endpoint tests${NC}"
fi

# Test server endpoints (if running)
if pgrep -f "node.*server" >/dev/null; then
    echo "Server service detected, testing endpoints..."
    check_endpoint "Server health check" "http://localhost:3000/health" "200"
    check_endpoint "Server WebSocket endpoint" "http://localhost:3000/socket.io/" "200"
else
    echo -e "${YELLOW}Server service not running, skipping endpoint tests${NC}"
fi

echo ""
echo "📊 Phase 4: Integration Tests"
echo "============================="

# Check if integration points are properly configured
run_test "Agent routes integration" "grep -q 'log_bridge_router' agent/routes/__init__.py" "0"
run_test "Server startup integration" "grep -q 'enhancedRemoteAgentLogBridge' server/server.js" "0"
run_test "Agent startup integration" "grep -q 'start_log_bridge' agent/main.py" "0"

echo ""
echo "🔍 Phase 5: Code Quality Tests"
echo "=============================="

# Check for basic code quality issues
run_test "No Python syntax errors in log bridge" "python -m py_compile agent/services/log_bridge.py" "0"
run_test "No Python syntax errors in starter" "python -m py_compile agent/services/log_bridge_starter.py" "0"
run_test "No obvious Node.js syntax errors" "node -c server/websockets/namespaces/AgentBridgeNamespace.js" "0"

echo ""
echo "📋 Test Summary"
echo "==============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! The Remote Agent Log Bridge implementation is ready.${NC}"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Start the agent service: cd agent && python main.py"
    echo "2. Start the server service: cd server && npm start"
    echo "3. Check connection status: curl http://localhost:8000/agent/v1/log-bridge/status"
    echo "4. Monitor logs: tail -f agent/logs/agent.log"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please review the implementation.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check file paths and permissions"
    echo "2. Verify dependencies are installed"
    echo "3. Review configuration files"
    echo "4. Check service logs for errors"
    echo ""
    exit 1
fi
