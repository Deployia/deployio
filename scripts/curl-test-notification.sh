#!/bin/bash

# Simple curl script to trigger health test notification
# Make sure your server is running on localhost:5000

API_URL="http://localhost:5000"

echo "🚀 Triggering health test notification..."

# You'll need to replace YOUR_JWT_TOKEN with a real token
# Get it from browser localStorage after logging in
JWT_TOKEN="YOUR_JWT_TOKEN"

if [ "$JWT_TOKEN" = "YOUR_JWT_TOKEN" ]; then
    echo "❌ Please edit this script and replace YOUR_JWT_TOKEN with a real JWT token"
    echo "💡 Get it from browser localStorage after logging into DeployIO"
    exit 1
fi

curl -X POST "$API_URL/api/internal/notifications/test" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
    "message": "🧪 Test notification from curl script!",
    "type": "success"
  }' \
    -w "\nHTTP Status: %{http_code}\n"

echo "✅ Test notification sent!"
echo "📱 Check your browser for the notification"
