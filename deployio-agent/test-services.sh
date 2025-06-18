#!/bin/bash

echo "🧪 Testing DeployIO Agent Setup"
echo "==============================="

echo "Waiting for services to start..."
sleep 5

echo ""
echo "🔍 Testing endpoints:"
echo "--------------------"

# Test Agent Health (should be fast now)
echo -n "Agent Health: "
start_time=$(date +%s%3N)
if curl -s -f -k https://agent.deployio.tech/agent/v1/health >/dev/null 2>&1; then
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    echo "✅ OK (${duration}ms)"
else
    echo "❌ Failed"
fi

# Test Root Domain
echo -n "Root Domain: "
if curl -s -f -k https://deployio.tech >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

# Test Wildcard Subdomain
echo -n "Wildcard Test: "
if curl -s -f -k https://test123.deployio.tech >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

# Test Traefik Dashboard
echo -n "Traefik Dashboard: "
if curl -s -f -k https://traefik.deployio.tech >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ Failed"
fi

echo ""
echo "📊 Service Status:"
echo "------------------"
docker compose ps

echo ""
echo "📝 Recent Logs:"
echo "---------------"
docker compose logs --tail=5 deployio-agent
