#!/bin/bash

# WebSocket and Notification Test Script
# Tests the WebSocket connections and notification system

echo "=== DeployIO WebSocket & Notification Test ==="
echo "Date: $(date)"
echo

# Configuration
BACKEND_URL="https://api.deployio.tech"
FRONTEND_URL="https://deployio.tech"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "1. Testing Backend Health..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$response" = "200" ]; then
    print_status 0 "Backend health check passed"
else
    print_status 1 "Backend health check failed (HTTP $response)"
fi

echo
echo "2. Testing WebSocket Endpoints..."

# Test if the WebSocket endpoints are accessible
print_info "Testing WebSocket namespace availability..."

# Check logs namespace
logs_status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/internal/logs/status")
if [ "$logs_status" = "200" ]; then
    print_status 0 "Logs WebSocket namespace available"
else
    print_status 1 "Logs WebSocket namespace not available (HTTP $logs_status)"
fi

# Check notifications namespace
notifications_status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/internal/notifications/status")
if [ "$notifications_status" = "200" ]; then
    print_status 0 "Notifications WebSocket namespace available"
else
    print_status 1 "Notifications WebSocket namespace not available (HTTP $notifications_status)"
fi

echo
echo "3. Docker Services Status..."
if command -v docker-compose &>/dev/null; then
    docker-compose ps --format table
else
    print_warning "docker-compose not available - cannot check service status"
fi

echo
echo "4. Log Files Check..."
for service in "server" "ai-service"; do
    log_dir="./${service}/logs"
    if [ -d "$log_dir" ]; then
        log_count=$(find "$log_dir" -name "*.log" 2>/dev/null | wc -l)
        print_info "${service}: $log_count log files found"

        if [ $log_count -gt 0 ]; then
            recent_log=$(find "$log_dir" -name "*.log" -type f -exec ls -t {} + | head -1)
            if [ -f "$recent_log" ]; then
                size=$(du -h "$recent_log" | cut -f1)
                modified=$(stat -c %y "$recent_log" 2>/dev/null || stat -f %Sm "$recent_log" 2>/dev/null)
                print_info "Most recent: $(basename "$recent_log") - Size: $size, Modified: $modified"
            fi
        fi
    else
        print_status 1 "${service} logs directory not found"
    fi
done

echo
echo "5. Manual Testing Instructions:"
echo
print_info "To test WebSocket connections manually:"
echo "   1. Open browser to: $FRONTEND_URL/health"
echo "   2. Login as admin user"
echo "   3. Click 'Send Test Notification' button"
echo "   4. Check for notification popup/toast"
echo
print_info "To test log streaming:"
echo "   1. Go to: $FRONTEND_URL/health/backend (or /ai-service, /agent)"
echo "   2. Click 'Start Live Streaming' button"
echo "   3. Watch for real-time log updates"
echo "   4. Generate test logs using 'Generate Test Logs' button"
echo
print_info "To test in browser console:"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Network tab"
echo "   3. Filter by 'WS' (WebSocket)"
echo "   4. Look for connections to /socket.io/?EIO=4&transport=websocket"
echo "   5. Check connection status and message flow"

echo
echo "6. Troubleshooting Commands:"
echo
print_info "Check container logs:"
echo "   docker-compose logs backend"
echo "   docker-compose logs ai-service"
echo
print_info "Restart services:"
echo "   docker-compose restart backend ai-service"
echo
print_info "Check log permissions:"
echo "   ls -la ./server/logs/"
echo "   ls -la ./ai-service/logs/"
echo
print_info "Test WebSocket directly:"
echo "   wscat -c 'wss://api.deployio.tech/socket.io/?EIO=4&transport=websocket'"

echo
echo "=== Test Complete ==="
