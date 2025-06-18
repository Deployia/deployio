#!/bin/bash

echo "🏥 Testing Health Endpoints"
echo "=========================="

echo "Testing fast health endpoint..."
echo -n "Fast Health (/agent/v1/health): "
start_time=$(date +%s%N)
if curl -s -f -k https://agent.deployio.tech/agent/v1/health >/dev/null 2>&1; then
    end_time=$(date +%s%N)
    duration=$(((end_time - start_time) / 1000000))
    echo "✅ OK (${duration}ms)"
else
    echo "❌ Failed"
fi

echo -n "Detailed Health (/agent/v1/health/detailed): "
start_time=$(date +%s%N)
if curl -s -f -k https://agent.deployio.tech/agent/v1/health/detailed >/dev/null 2>&1; then
    end_time=$(date +%s%N)
    duration=$(((end_time - start_time) / 1000000))
    echo "✅ OK (${duration}ms)"
else
    echo "❌ Failed"
fi

echo ""
echo "📊 Fast Health Response:"
curl -s -k https://agent.deployio.tech/agent/v1/health | jq '.' 2>/dev/null || curl -s -k https://agent.deployio.tech/agent/v1/health

echo ""
echo "📊 Detailed Health Response:"
curl -s -k https://agent.deployio.tech/agent/v1/health/detailed | jq '.' 2>/dev/null || curl -s -k https://agent.deployio.tech/agent/v1/health/detailed
