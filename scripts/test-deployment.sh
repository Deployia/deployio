#!/bin/bash

# Test script to validate deployment readiness
echo "🔍 Testing deployment readiness for DeployIO..."

# Check if required files exist
echo "✅ Checking required files..."
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

if [ ! -d "client" ]; then
    echo "❌ client directory not found"
    exit 1
fi

if [ ! -d "ai_service" ]; then
    echo "❌ ai_service directory not found"
    exit 1
fi

echo "✅ All required files and directories found"

# Test docker-compose configuration
echo "✅ Testing docker-compose configuration..."
docker-compose config --quiet
if [ $? -eq 0 ]; then
    echo "✅ Docker compose configuration is valid"
else
    echo "❌ Docker compose configuration has errors"
    exit 1
fi

# Check if services are defined correctly
echo "✅ Checking service definitions..."
services=$(docker-compose config --services)
required_services=("traefik" "frontend" "backend" "fastapi" "mongodb")

for service in "${required_services[@]}"; do
    if echo "$services" | grep -q "^$service$"; then
        echo "✅ Service $service is defined"
    else
        echo "❌ Service $service is missing"
        exit 1
    fi
done

# Test health check endpoints (if services are running)
echo "✅ Testing health check endpoints..."
if curl -s http://localhost:3000/api/v1/health >/dev/null 2>&1; then
    echo "✅ Backend health check endpoint is accessible"
else
    echo "⚠️  Backend health check endpoint not accessible (service may not be running)"
fi

if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ FastAPI health check endpoint is accessible"
else
    echo "⚠️  FastAPI health check endpoint not accessible (service may not be running)"
fi

echo "🎉 Deployment readiness test completed!"
echo "🚀 Your CI/CD pipeline is ready to use"
