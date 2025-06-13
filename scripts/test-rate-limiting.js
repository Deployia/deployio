#!/usr/bin/env node
// scripts/test-rate-limiting.js
// Test script to verify rate limiting configuration

const axios = require("axios");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function testRateLimit(endpoint, maxRequests = 10, delay = 100) {
  console.log(`\n🧪 Testing rate limiting for ${endpoint}`);
  console.log(`Making ${maxRequests} requests with ${delay}ms delay...`);

  const results = {
    success: 0,
    rateLimited: 0,
    errors: 0,
    responses: [],
  };

  for (let i = 1; i <= maxRequests; i++) {
    try {
      const start = Date.now();
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on 4xx/5xx
      });

      const duration = Date.now() - start;
      const status = response.status;
      const rateLimitInfo = {
        remaining: response.headers["ratelimit-remaining"],
        limit: response.headers["ratelimit-limit"],
        reset: response.headers["ratelimit-reset"],
      };

      results.responses.push({
        request: i,
        status,
        duration: `${duration}ms`,
        rateLimitInfo,
      });

      if (status === 200) {
        results.success++;
        console.log(
          `✅ Request ${i}: ${status} (${duration}ms) - Remaining: ${rateLimitInfo.remaining}`
        );
      } else if (status === 429) {
        results.rateLimited++;
        console.log(
          `🚫 Request ${i}: ${status} (${duration}ms) - RATE LIMITED`
        );
      } else {
        results.errors++;
        console.log(`❌ Request ${i}: ${status} (${duration}ms) - ERROR`);
      }

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      results.errors++;
      console.log(`💥 Request ${i}: ERROR - ${error.message}`);
    }
  }

  console.log(`\n📊 Results for ${endpoint}:`);
  console.log(`   ✅ Successful: ${results.success}`);
  console.log(`   🚫 Rate Limited: ${results.rateLimited}`);
  console.log(`   ❌ Errors: ${results.errors}`);

  return results;
}

async function testHealthEndpoint() {
  console.log("\n💚 Testing health endpoint (should bypass rate limiting)");
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/health`);
    console.log(
      `✅ Health check: ${response.status} - ${response.data.status}`
    );

    if (response.data._rateLimitDebug) {
      console.log("🔍 Rate Limit Debug Info:", response.data._rateLimitDebug);
    }
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }
}

async function testAuthEndpoints() {
  console.log("\n🔐 Testing auth endpoints with strict rate limiting");

  // Test login endpoint (should have stricter limits)
  await testRateLimit("/api/v1/auth/login", 8, 1000); // 8 requests with 1s delay
}

async function main() {
  console.log("🚀 DeployIO Rate Limiting Test Suite");
  console.log(`📍 Testing against: ${BASE_URL}`);

  try {
    // Test health endpoint
    await testHealthEndpoint();

    // Test general API rate limiting
    await testRateLimit("/api/v1/health", 15, 500);

    // Test auth rate limiting
    await testAuthEndpoints();

    console.log("\n✅ Rate limiting tests completed!");
    console.log("\n💡 Tips:");
    console.log("   - Set DEBUG_RATE_LIMIT=true to see IP detection logs");
    console.log("   - Check server logs for rate limit violations");
    console.log(
      "   - In production, ensure TRUST_PROXY=true behind reverse proxy"
    );
  } catch (error) {
    console.error("💥 Test suite failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testRateLimit, testHealthEndpoint };
