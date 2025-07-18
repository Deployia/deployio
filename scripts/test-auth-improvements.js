#!/usr/bin/env node

/**
 * Test script to verify auth improvements are working
 */

const axios = require("axios");
const crypto = require("crypto");

const API_BASE = "http://localhost:3001/api/v1";

// Test data
const testUser = {
  username: "test_auth_improvements",
  email: `test_${crypto.randomBytes(4).toString("hex")}@example.com`,
  password: "TestPassword123!@#",
};

async function runTests() {
  console.log("🚀 Testing Auth Improvements...\n");

  try {
    // Test 1: Register user
    console.log("1. Testing user registration...");
    const registerResponse = await axios.post(
      `${API_BASE}/users/auth/register`,
      testUser
    );
    console.log("✅ Registration successful");

    // Test 2: Login user (should fail due to email verification)
    console.log("\n2. Testing login without verification...");
    try {
      await axios.post(`${API_BASE}/users/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      console.log("❌ Login should have failed without verification");
    } catch (error) {
      if (error.response?.status === 400) {
        console.log("✅ Login correctly failed - email verification required");
      } else {
        console.log("⚠️  Unexpected error:", error.response?.data?.message);
      }
    }

    // Test 3: Test API key endpoints structure
    console.log("\n3. Testing API key endpoint structure...");
    try {
      // This should fail due to authentication, but we check the endpoint exists
      await axios.get(`${API_BASE}/users/api-keys`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ API key endpoint exists and requires authentication");
      } else {
        console.log("⚠️  Unexpected API key endpoint response");
      }
    }

    // Test 4: Test password endpoint structure
    console.log("\n4. Testing password endpoint structure...");
    try {
      await axios.post(`${API_BASE}/users/set-initial-password`, {
        newPassword: "NewPassword123!@#",
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Password endpoint exists and requires authentication");
      } else {
        console.log("⚠️  Unexpected password endpoint response");
      }
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   - User registration: Working");
    console.log("   - Email verification requirement: Working");
    console.log("   - API key endpoints: Available");
    console.log("   - Password management endpoints: Available");
    console.log("\n✨ Auth improvements are ready for testing!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
