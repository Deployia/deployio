#!/bin/bash

# DeployIO Agent - Quick Deploy Script

echo "🚀 DeployIO Agent Deployment"
echo "================================"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your configuration."
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking environment configuration..."

# Source the .env file to check variables
set -a
source .env.production
set +a

# Check required variables
REQUIRED_VARS=("CLOUDFLARE_EMAIL" "CLOUDFLARE_DNS_API_TOKEN" "SECRET_KEY" "AGENT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your-"* ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing or incomplete environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please update your .env.production file with proper values."
    exit 1
fi

echo "✅ Environment configuration looks good!"

# Create required directories
echo "📁 Creating required directories..."
mkdir -p letsencrypt
chmod 600 letsencrypt

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Pull latest images
echo "📥 Pulling latest images..."
docker compose pull

# Start services
echo "🚀 Starting services..."
docker compose up -d

# Wait a moment for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎯 Testing endpoints:"
echo "================================"

# Test health endpoint
echo -n "Agent Health: "
if curl -s -f -k https://agent.deployio.tech/agent/v1/health >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

echo -n "Wildcard Page: "
if curl -s -f -k https://test.deployio.tech >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

echo ""
echo "📝 Useful Commands:"
echo "================================"
echo "View logs:         docker compose logs -f"
echo "View specific:     docker compose logs -f deployio-agent"
echo "Restart services:  docker compose restart"
echo "Stop services:     docker compose down"
echo ""
echo "🌐 Access Points:"
echo "================================"
echo "Agent API:         https://agent.deployio.tech"
echo "Traefik Dashboard: https://traefik.deployio.tech"
echo "Wildcard Test:     https://anything.deployio.tech"
echo ""
echo "✅ Deployment complete!"
