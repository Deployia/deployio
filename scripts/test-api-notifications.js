#!/usr/bin/env node

/**
 * Quick script to create notifications via API
 * Use this if you want to test the API endpoints directly
 */

const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:5000";

async function createAPINotification(authToken, notificationData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/notifications/create`,
      notificationData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
}

async function testAPINotifications() {
  // You'll need to get a valid JWT token first
  const authToken = process.env.TEST_JWT_TOKEN || "your_jwt_token_here";

  if (authToken === "your_jwt_token_here") {
    console.log(
      "❌ Please set TEST_JWT_TOKEN environment variable with a valid JWT token"
    );
    console.log(
      "💡 You can get a token by logging into the dashboard and checking localStorage"
    );
    return;
  }

  const testNotifications = [
    {
      type: "deployment.success",
      title: "🎉 API Test - Deployment Success",
      message: "This notification was created via API to test the system.",
      priority: "normal",
    },
    {
      type: "security.alert",
      title: "🚨 API Test - Security Alert",
      message: "This is a test security notification created via API.",
      priority: "urgent",
    },
  ];

  for (const notification of testNotifications) {
    try {
      const result = await createAPINotification(authToken, notification);
      console.log("✅ Created notification:", result.data?.title);
    } catch (error) {
      console.error("❌ Failed to create notification:", notification.title);
    }
  }
}

if (require.main === module) {
  console.log("🚀 Testing API notification creation...\n");
  testAPINotifications();
}

module.exports = { createAPINotification, testAPINotifications };
