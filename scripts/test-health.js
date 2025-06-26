#!/usr/bin/env node

/**
 * Test the health endpoint to verify the fixes
 */

const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:3000";

async function testHealthEndpoint() {
  try {
    console.log("🔍 Testing health endpoint...");
    console.log(`📡 URL: ${BASE_URL}/health\n`);

    const response = await axios.get(`${BASE_URL}/health`);

    console.log("✅ Health check successful!");
    console.log(`📊 Status Code: ${response.status}`);
    console.log(`🏥 Overall Status: ${response.data.status}`);
    console.log(`⏱️  Response Time: ${response.data.responseTime}ms`);

    console.log("\n📋 Health Summary:");
    console.log(
      `   Core Services Healthy: ${
        response.data.summary?.coreServicesHealthy ? "✅" : "❌"
      }`
    );
    console.log(
      `   Optional Services Down: ${
        response.data.summary?.optionalServicesDown || 0
      }`
    );
    console.log(
      `   Total Services: ${response.data.summary?.totalServices || "unknown"}`
    );

    console.log("\n🗄️  Database Status:");
    console.log(
      `   MongoDB: ${response.data.mongodb.status} (Ready State: ${response.data.mongodb.readyState})`
    );
    console.log(
      `   Redis: ${response.data.redis.status} (Connected: ${response.data.redis.connected})`
    );

    console.log("\n🔗 External Services:");
    if (response.data.services.aiService) {
      console.log(`   AI Service: ${response.data.services.aiService.status}`);
      if (response.data.services.aiService.error) {
        console.log(`      Error: ${response.data.services.aiService.error}`);
      }
    }

    if (response.data.services.deploymentAgent) {
      console.log(
        `   Deployment Agent: ${response.data.services.deploymentAgent.status}`
      );
      if (response.data.services.deploymentAgent.error) {
        console.log(
          `      Error: ${response.data.services.deploymentAgent.error}`
        );
      }
    }

    console.log("\n💾 System Info:");
    console.log(`   Service: ${response.data.service}`);
    console.log(`   Version: ${response.data.version}`);
    console.log(`   Environment: ${response.data.environment}`);
    console.log(`   Uptime: ${Math.floor(response.data.uptime)}s`);
    console.log(`   Memory Used: ${response.data.memory.used}MB`);

    console.log("\n🎯 Expected Frontend Behavior:");
    if (response.data.status === "healthy") {
      console.log('   🟢 Should show: "All Systems Operational" (Green)');
    } else if (response.data.status === "degraded") {
      console.log(
        '   🟡 Should show: "Core Systems Operational - X Optional Service(s) Down" (Yellow)'
      );
    } else {
      console.log(
        '   🔴 Should show: "System Unhealthy - Core Services Down" (Red)'
      );
    }
  } catch (error) {
    console.error("❌ Health check failed!");
    if (error.response) {
      console.error(`📊 Status Code: ${error.response.status}`);
      console.error(
        `💬 Response: ${JSON.stringify(error.response.data, null, 2)}`
      );
    } else {
      console.error(`🔌 Connection Error: ${error.message}`);
      console.error(
        "💡 Make sure the backend server is running on http://localhost:5000"
      );
    }
  }
}

// Run the test
if (require.main === module) {
  testHealthEndpoint();
}

module.exports = { testHealthEndpoint };
