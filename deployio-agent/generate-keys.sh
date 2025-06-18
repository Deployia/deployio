#!/bin/bash

echo "🔐 Generating Secure Keys"
echo "========================"

# Generate keys
SECRET_KEY=$(openssl rand -base64 32 | tr -d '\n')
AGENT_SECRET=$(openssl rand -hex 32)

echo "Generated keys:"
echo "SECRET_KEY=$SECRET_KEY"
echo "AGENT_SECRET=$AGENT_SECRET"

# Update .env file
if [ -f ".env" ]; then
    echo ""
    echo "Updating .env file..."
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    sed -i "s/AGENT_SECRET=.*/AGENT_SECRET=$AGENT_SECRET/" .env
    echo "✅ .env file updated!"
else
    echo "❌ .env file not found!"
fi
