#!/bin/bash

# Test MongoDB Atlas connection and deployment service
# This script verifies that the Atlas migration is working correctly

echo "🔍 Testing MongoDB Atlas Integration for DeployIO Agent"
echo "======================================================"

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your MongoDB Atlas connection string:"
    echo "export DATABASE_URL='mongodb+srv://username:password@cluster.mongodb.net/deployio_agent?retryWrites=true&w=majority'"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo "Database URL: ${DATABASE_URL}"

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if agent service is running
if docker-compose ps | grep -q "deployio-agent.*Up"; then
    echo "✅ DeployIO Agent is running"
else
    echo "⚠️  DeployIO Agent is not running. Starting services..."
    docker-compose up -d
    sleep 10
fi

# Test health endpoint
echo ""
echo "🏥 Testing Health Endpoints..."
echo "------------------------------"

# Basic health check
health_response=$(curl -s http://localhost:8000/agent/v1/health || echo "failed")
if echo "$health_response" | grep -q "DeployIO Agent"; then
    echo "✅ Basic health check passed"
else
    echo "❌ Basic health check failed"
    echo "Response: $health_response"
fi

# Detailed health check (includes MongoDB Atlas)
detailed_health=$(curl -s http://localhost:8000/agent/v1/health/detailed || echo "failed")
if echo "$detailed_health" | grep -q "mongodb"; then
    echo "✅ Detailed health check includes MongoDB status"

    # Check if MongoDB status is 'ok'
    if echo "$detailed_health" | grep -q '"mongodb":"ok"'; then
        echo "✅ MongoDB Atlas connection successful"
    else
        echo "❌ MongoDB Atlas connection failed"
        echo "Response: $detailed_health"
    fi
else
    echo "❌ Detailed health check failed"
    echo "Response: $detailed_health"
fi

echo ""
echo "📋 Current Service Status:"
echo "-------------------------"
docker-compose ps

echo ""
echo "📊 Container Resource Usage:"
echo "----------------------------"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🔗 Service URLs:"
echo "----------------"
echo "Agent API: http://agent.deployio.tech"
echo "Traefik Dashboard: http://traefik.deployio.tech"
echo "Landing Page: http://test.deployio.tech (for unassigned subdomains)"

echo ""
echo "✅ MongoDB Atlas Integration Test Complete!"
echo ""
echo "📝 Next Steps:"
echo "- All local MongoDB initialization has been removed ✅"
echo "- Test deploying a sample application"
echo "- Check that deployed apps receive unique Atlas database connections"
