#!/bin/bash

# DeployIO Agent Deployment Script
# Supports local development and ECR production deployment

set -e

echo "🚀 DeployIO Agent Deployment Helper"
echo "==================================="

# Check if ECR_IMAGE environment variable is set
if [ -n "$ECR_IMAGE" ]; then
    echo "📦 Using ECR Image: $ECR_IMAGE"
    echo "🔧 Production Mode - pulling from ECR"

    # Pull the image first
    echo "⬇️  Pulling ECR image..."
    docker pull $ECR_IMAGE

    # Start services
    echo "🚀 Starting services with ECR image..."
    docker-compose up -d

else
    echo "🏗️  Local Development Mode"
    echo "Building image locally..."

    # Build and start services
    echo "🔨 Building and starting services..."
    docker-compose up --build -d
fi

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Service URLs:"
echo "- Agent API: http://agent.deployio.tech"
echo "- Traefik Dashboard: http://traefik.deployio.tech"
echo "- Landing Page: http://test.deployio.tech (or any unassigned subdomain)"
echo ""
echo "📊 Check status:"
echo "docker-compose ps"
echo ""
echo "📋 View logs:"
echo "docker-compose logs -f deployio-agent"
