#!/bin/bash

# DeployIO Agent Setup Script
# This script sets up the complete subdomain management system

set -e

echo "🚀 Setting up DeployIO Agent with Subdomain Management..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p letsencrypt logs

# Set permissions for LetsEncrypt
echo "🔐 Setting up SSL certificate storage..."
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration before starting!"
fi

# Build the landing page
echo "🏗️  Building landing page..."
cd landing-page
docker build -t deployio-landing-page .
cd ..

# Build the agent
echo "🏗️  Building DeployIO Agent..."
docker build -t deployio-agent .

# Create Docker network
echo "🌐 Creating Docker network..."
docker network create deployio-network 2>/dev/null || echo "Network already exists"

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Update traefik/dynamic.yml if needed"
echo "3. Run: docker-compose up -d"
echo ""
echo "🌍 Your subdomains will be:"
echo "  • agent.deployio.tech - Agent API"
echo "  • app.deployio.tech - App management"
echo "  • *.deployio.tech - Default landing page → user apps"
echo ""
echo "📖 API Documentation will be available at:"
echo "  • https://agent.deployio.tech/docs"
