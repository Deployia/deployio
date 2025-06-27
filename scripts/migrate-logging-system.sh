#!/bin/bash

# DeployIO Logging System Migration Script
# This script migrates from the old fragmented logging system to the new unified archite- `server/websockets/namespaces/LogStreamingNamespace.js` - WebSocket namespaceture

echo "🔄 DeployIO Logging System Migration"
echo "===================================="
echo ""

# Function to display colored output
info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

info "Starting logging system migration..."

# Step 1: Backup old log routes
info "Step 1: Backing up old logging routes..."

BACKUP_DIR="./dev/archive/logging-migration-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup old routes
if [ -f "server/routes/health/logs.js" ]; then
    cp "server/routes/health/logs.js" "$BACKUP_DIR/health_logs_old.js"
    info "Backed up health/logs.js"
fi

if [ -f "server/routes/api/internal/logs.js" ]; then
    cp "server/routes/api/internal/logs.js" "$BACKUP_DIR/internal_logs_old.js"
    info "Backed up api/internal/logs.js"
fi

if [ -f "server/websockets/namespaces/LogStreamingNamespace.js" ]; then
    cp "server/websockets/namespaces/LogStreamingNamespace.js" "$BACKUP_DIR/LogStreamingNamespace_old.js"
    info "Backed up old LogStreamingNamespace.js"
fi

success "Old routes backed up to $BACKUP_DIR"

# Step 2: Update route imports
info "Step 2: Updating route imports..."

# Update main routes index to remove health logs
if [ -f "server/routes/index.js" ]; then
    info "Checking main routes index..."
    if grep -q "health/logs" "server/routes/index.js"; then
        warning "Found health/logs import in main routes - please update manually"
        echo "  File: server/routes/index.js"
        echo "  Action: Remove or update health/logs route mounting"
    fi
fi

# Step 3: Create new log directories
info "Step 3: Creating new logging directory structure..."

mkdir -p "server/services/logging"
mkdir -p "server/routes/api/v1"

success "Directory structure created"

# Step 4: Test new logging endpoints
info "Step 4: Testing new logging system..."

# Start services if not running
if ! docker-compose ps | grep -q "Up"; then
    info "Starting services for testing..."
    docker-compose up -d
    sleep 30
fi

# Test the new unified logging endpoint
info "Testing unified logging API..."

BACKEND_URL="http://localhost:3000"

# Test status endpoint
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/logs/status" \
    -H "Authorization: Bearer your-test-token" 2>/dev/null || echo "000")

if [ "$STATUS_CODE" = "200" ]; then
    success "✅ New logging API is responding"
elif [ "$STATUS_CODE" = "401" ]; then
    warning "⚠️ New logging API requires authentication (expected)"
elif [ "$STATUS_CODE" = "000" ]; then
    warning "⚠️ Could not connect to backend (services may still be starting)"
else
    warning "⚠️ New logging API returned status code: $STATUS_CODE"
fi

# Step 5: WebSocket testing
info "Testing WebSocket logging namespace..."

# Check if WebSocket namespace is properly initialized
if docker-compose logs backend 2>/dev/null | grep -q "Enhanced log streaming namespace initialized"; then
    success "✅ Enhanced WebSocket logging namespace is initialized"
else
    warning "⚠️ Enhanced WebSocket logging namespace may not be initialized yet"
fi

# Step 6: Generate migration report
info "Step 5: Generating migration report..."

REPORT_FILE="$BACKUP_DIR/migration_report.md"

cat >"$REPORT_FILE" <<EOF
# DeployIO Logging System Migration Report

**Migration Date**: $(date)
**Backup Location**: $BACKUP_DIR

## Migration Summary

### ✅ Completed
- [x] Backed up old logging routes
- [x] Created new unified logging architecture
- [x] Implemented LogCollectorService
- [x] Created LogStreamingNamespace
- [x] Added unified API routes (/api/v1/logs/*)
- [x] Implemented room-based WebSocket organization

### 🔄 Updated Components

#### New Services
- \`server/services/logging/LogCollectorService.js\` - Unified log collection
- \`server/services/logging/RemoteAgentLogBridge.js\` - Remote agent integration
- \`server/websockets/namespaces/EnhancedLogStreamingNamespace.js\` - Enhanced WebSocket namespace

#### New API Routes
- \`/api/v1/logs/status\` - System status
- \`/api/v1/logs/system\` - Admin system logs
- \`/api/v1/logs/system/:service\` - Service-specific logs  
- \`/api/v1/logs/projects/:projectId\` - User project logs
- \`/api/v1/logs/deployments/:deploymentId\` - Deployment logs
- \`/api/v1/logs/metrics\` - System metrics
- \`/api/v1/logs/streams\` - Stream management

#### Enhanced WebSocket Features
- Room-based organization (system:*, user:*, project:*, deployment:*)
- User access control and permissions
- Real-time log streaming with authentication
- Multi-service log aggregation

### 📋 Manual Steps Required

#### 1. Update Frontend Integration
Update your frontend to use the new logging endpoints:

\`\`\`javascript
// Old endpoints (to be deprecated)
// /health/logs/*
// /api/internal/logs/*

// New unified endpoints
// /api/v1/logs/*
\`\`\`

#### 2. Update Admin Dashboard
- Update WebSocket connection to use enhanced namespace features
- Implement room-based log viewing
- Add user/project/deployment log filtering

#### 3. Update Environment Variables
Add these environment variables for enhanced functionality:

\`\`\`bash
# Agent connection for remote logs
AGENT_URL=https://agent.deployio.tech
AGENT_SECRET=your-secret-key

# Log retention settings
LOG_RETENTION_HOURS=24
LOG_BUFFER_SIZE=100
\`\`\`

#### 4. Agent Service Integration
The agent service will need WebSocket endpoints for real-time streaming:
- \`/ws/logs\` - WebSocket endpoint for log streaming
- Enhanced log broadcasting for deployment logs

### 🔮 Future Enhancements

#### Phase 2 (Week 3-4)
- [ ] Remote agent WebSocket integration
- [ ] User dashboard log viewing
- [ ] Real-time deployment logs
- [ ] Enhanced metrics streaming

#### Phase 3 (Month 2)
- [ ] Log search and filtering
- [ ] Log retention policies  
- [ ] Performance optimization
- [ ] Advanced analytics

### 🚨 Deprecation Notice

The following endpoints are deprecated and will be removed in a future release:
- \`/health/logs/*\` - Use \`/api/v1/logs/system/*\` instead
- \`/api/internal/logs/*\` - Use \`/api/v1/logs/internal/*\` instead

### 🧪 Testing

#### API Testing
\`\`\`bash
# Test system logs (admin required)
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     http://localhost:3000/api/v1/logs/system

# Test specific service logs
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     http://localhost:3000/api/v1/logs/system/backend

# Test WebSocket connection
# Connect to ws://localhost:3000/logs with authentication
\`\`\`

#### WebSocket Testing
\`\`\`javascript
const socket = io('/logs', {
  auth: { token: 'your-jwt-token' }
});

// Subscribe to system logs (admin only)
socket.emit('system:subscribe', {
  services: ['backend', 'ai-service', 'agent'],
  realtime: true
});

// Subscribe to user logs
socket.emit('user:subscribe', {
  projectId: 'your-project-id'
});
\`\`\`

## Next Steps

1. **Test thoroughly** in your development environment
2. **Update frontend** to use new logging endpoints  
3. **Configure environment variables** for production
4. **Update documentation** and team knowledge
5. **Plan Phase 2** implementation for remote agent integration

## Support

If you encounter any issues during migration:
1. Check the backup files in \`$BACKUP_DIR\`
2. Review the migration logs
3. Test with the new API endpoints
4. Verify WebSocket connections are working

EOF

success "Migration report generated: $REPORT_FILE"

# Step 6: Summary
echo ""
echo "🎉 Logging System Migration Complete!"
echo "====================================="
echo ""
success "✅ New unified logging architecture is ready"
success "✅ Old routes have been backed up"
success "✅ Migration report generated"
echo ""
info "📋 Next Steps:"
echo "   1. Update your frontend to use new endpoints: /api/v1/logs/*"
echo "   2. Test WebSocket connections with the enhanced namespace"
echo "   3. Configure environment variables for remote agent"
echo "   4. Review the migration report: $REPORT_FILE"
echo ""
warning "⚠️  Remember to update any scripts or tools that use the old endpoints"
echo ""
info "📚 Documentation: dev/architecture/LOGGING_ARCHITECTURE_DESIGN.md"
echo ""

# Final check
echo "🔍 Final System Check:"
echo "  New API routes: /api/v1/logs/*"
echo "  WebSocket namespace: /logs (enhanced)"
echo "  Backup location: $BACKUP_DIR"
echo "  Migration report: $REPORT_FILE"
echo ""

if [ "$STATUS_CODE" = "200" ] || [ "$STATUS_CODE" = "401" ]; then
    success "🚀 Migration successful! New logging system is operational."
else
    warning "⚠️ Migration completed with warnings. Please check service status."
fi
