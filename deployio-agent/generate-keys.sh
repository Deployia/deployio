#!/bin/bash

# Generate Secure Keys for DeployIO Agent

echo "🔐 Generating Secure Keys for DeployIO Agent"
echo "=============================================="

# Generate SECRET_KEY (32 bytes, base64 encoded)
echo "🔑 Generating SECRET_KEY..."
SECRET_KEY=$(openssl rand -base64 32)
echo "SECRET_KEY=$SECRET_KEY"

echo ""

# Generate AGENT_SECRET (32 bytes, hex encoded)
echo "🔑 Generating AGENT_SECRET..."
AGENT_SECRET=$(openssl rand -hex 32)
echo "AGENT_SECRET=$AGENT_SECRET"

echo ""
echo "📝 Copy these values to your .env.production file:"
echo "=================================================="
echo "SECRET_KEY=$SECRET_KEY"
echo "AGENT_SECRET=$AGENT_SECRET"

echo ""
echo "💡 You can also run this to update .env.production automatically:"
echo "sed -i 's/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/' .env.production"
echo "sed -i 's/AGENT_SECRET=.*/AGENT_SECRET=$AGENT_SECRET/' .env.production"
