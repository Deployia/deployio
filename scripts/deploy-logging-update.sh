#!/bin/bash

# DeployIO Services Update Script
# This script updates the services with the new standardized logging and metrics

set -e

echo "🚀 Starting DeployIO services update..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Create logs directories if they don't exist
echo "📁 Creating logs directories..."
mkdir -p server/logs
mkdir -p ai-service/logs
mkdir -p agent/logs

# Set proper permissions for logs directories
echo "🔐 Setting permissions for logs directories..."
chmod 755 server/logs ai-service/logs agent/logs

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose down --remove-orphans

# Remove any existing log volumes to ensure clean start
echo "🧹 Cleaning up old volumes..."
docker volume prune -f

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose pull

# Start services with new configuration
echo "🆙 Starting services with updated configuration..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Test the services
echo "🧪 Testing services..."

# Function to test service health
test_service() {
    local url=$1
    local name=$2
    echo "Testing $name at $url..."

    for i in {1..5}; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            echo "✅ $name is responding"
            return 0
        else
            echo "⏳ $name not ready yet, retrying in 10s... (attempt $i/5)"
            sleep 10
        fi
    done

    echo "❌ $name failed to respond after 5 attempts"
    return 1
}

# Test each service
if command -v curl &>/dev/null; then
    test_service "http://localhost:5000/health" "Backend"
    test_service "http://localhost:8000/service/v1/health" "AI Service"
    test_service "http://localhost:8001/agent/v1/health" "Agent"
else
    echo "⚠️ curl not found, skipping health checks"
fi

# Check log files are being created
echo "📋 Checking log file creation..."
sleep 10

check_logs() {
    local service=$1
    local container=$2

    echo "Checking $service logs..."

    # Check if container is running
    if docker ps --format "table {{.Names}}" | grep -q "$container"; then
        echo "✅ $service container is running"

        # Check for log files inside container
        if docker exec "$container" ls -la /app/logs/ 2>/dev/null; then
            echo "✅ $service log directory exists"
        else
            echo "⚠️ $service log directory not found or not accessible"
        fi
    else
        echo "❌ $service container not running"
    fi
}

# Check logs for each service
check_logs "Backend" "deployio-backend-1"
check_logs "AI Service" "deployio-ai-service-1"
check_logs "Agent" "deployio-agent-1"

# Show service status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Update completed!"
echo ""
echo "📝 Next steps:"
echo "1. Check the logs: docker-compose logs -f [service-name]"
echo "2. Monitor metrics at your frontend dashboard"
echo "3. Test log streaming in the admin panel"
echo ""
echo "🔧 If you encounter issues:"
echo "- Check container logs: docker-compose logs [service-name]"
echo "- Restart individual service: docker-compose restart [service-name]"
echo "- Check disk space: df -h"
echo "- Check permissions: ls -la */logs/"
