#!/usr/bin/env node

/**
 * Test script to verify logging and metrics are working correctly
 * This script can be run to test both development and production logging setups
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Configure test URLs based on environment
const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.deployio.tech"
    : "http://localhost:5000";

const AI_SERVICE_URL =
  process.env.NODE_ENV === "production"
    ? "https://service.deployio.tech"
    : "http://localhost:8000";

const AGENT_URL =
  process.env.NODE_ENV === "production"
    ? "https://agent.deployio.tech"
    : "http://localhost:8001";

async function testServiceHealth(url, serviceName) {
  try {
    console.log(`🔍 Testing ${serviceName} health at ${url}...`);
    const response = await axios.get(`${url}/health`, { timeout: 10000 });
    console.log(`✅ ${serviceName} is healthy:`, {
      status: response.data.status,
      uptime: response.data.uptime || "N/A",
    });
    return true;
  } catch (error) {
    console.log(`❌ ${serviceName} health check failed:`, error.message);
    return false;
  }
}

async function testServiceMetrics(url, serviceName, endpoint) {
  try {
    console.log(`📊 Testing ${serviceName} metrics at ${url}${endpoint}...`);
    const response = await axios.get(`${url}${endpoint}`, { timeout: 10000 });
    console.log(`✅ ${serviceName} metrics retrieved:`, {
      service: response.data.service || serviceName,
      memory: response.data.memory || "N/A",
      cpu: response.data.cpu || "N/A",
    });
    return true;
  } catch (error) {
    console.log(`❌ ${serviceName} metrics failed:`, error.message);
    return false;
  }
}

function checkLogFiles() {
  console.log("\n📁 Checking log file existence...");

  const logPaths = [
    // Local development paths
    path.join(__dirname, "..", "server", "logs", "combined.log"),
    path.join(__dirname, "..", "server", "logs", "backend.log"),
    path.join(__dirname, "..", "ai-service", "logs", "ai-service.log"),
    path.join(__dirname, "..", "agent", "logs", "agent.log"),
    // Docker paths
    "/app/logs/combined.log",
    "/app/logs/backend.log",
    "/app/logs/ai-service.log",
    "/app/logs/agent.log",
  ];

  let foundLogs = 0;

  logPaths.forEach((logPath) => {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      console.log(`✅ Found: ${logPath} (${Math.round(stats.size / 1024)}KB)`);
      foundLogs++;
    }
  });

  if (foundLogs === 0) {
    console.log(
      "⚠️  No log files found. This might indicate logging configuration issues."
    );
  } else {
    console.log(`✅ Found ${foundLogs} log files`);
  }

  return foundLogs;
}

async function main() {
  console.log("🚀 Starting logging and metrics test...\n");

  // Check log files first
  const logCount = checkLogFiles();

  console.log("\n🏥 Testing service health endpoints...");

  // Test all services
  const services = [
    {
      url: BACKEND_URL,
      name: "Backend",
      metricsEndpoint: "/health/metrics/backend",
    },
    {
      url: AI_SERVICE_URL,
      name: "AI Service",
      metricsEndpoint: "/service/v1/health",
    },
    { url: AGENT_URL, name: "Agent", metricsEndpoint: "/agent/v1/health" },
  ];

  let healthyServices = 0;
  let workingMetrics = 0;

  for (const service of services) {
    const isHealthy = await testServiceHealth(service.url, service.name);
    if (isHealthy) {
      healthyServices++;

      // Test metrics endpoint
      const hasMetrics = await testServiceMetrics(
        service.url,
        service.name,
        service.metricsEndpoint
      );
      if (hasMetrics) {
        workingMetrics++;
      }
    }
    console.log(""); // Add spacing
  }

  // Summary
  console.log("📋 Test Summary:");
  console.log(`   Log files found: ${logCount}`);
  console.log(`   Healthy services: ${healthyServices}/${services.length}`);
  console.log(`   Working metrics: ${workingMetrics}/${services.length}`);

  if (
    healthyServices === services.length &&
    workingMetrics === services.length &&
    logCount > 0
  ) {
    console.log(
      "\n🎉 All tests passed! Logging and metrics are working correctly."
    );
    process.exit(0);
  } else {
    console.log(
      "\n⚠️  Some tests failed. Please check the output above for details."
    );
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

main().catch(console.error);
