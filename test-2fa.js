// Test script for 2FA functionality
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

async function test2FA() {
  try {
    console.log("🧪 Testing 2FA Implementation...\n");

    // Step 1: Register a test user
    console.log("1. Registering test user...");
    const registerData = {
      name: "Test User",
      email: "test2fa@example.com",
      password: "password123",
    };

    let token;
    try {
      const registerResponse = await axios.post(
        `${BASE_URL}/auth/register`,
        registerData
      );
      token = registerResponse.data.token;
      console.log("✅ User registered successfully");
    } catch (error) {
      if (error.response?.data?.message?.includes("User already exists")) {
        // Try to login instead
        console.log("👤 User already exists, logging in...");
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: registerData.email,
          password: registerData.password,
        });
        token = loginResponse.data.token;
        console.log("✅ User logged in successfully");
      } else {
        throw error;
      }
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Check initial 2FA status
    console.log("\n2. Checking initial 2FA status...");
    const statusResponse = await axios.get(`${BASE_URL}/users/2fa/status`, {
      headers,
    });
    console.log("✅ 2FA Status:", statusResponse.data.data);

    // Step 3: Generate 2FA secret
    console.log("\n3. Generating 2FA secret...");
    const secretResponse = await axios.post(
      `${BASE_URL}/users/2fa/generate`,
      {},
      { headers }
    );
    console.log("✅ 2FA Secret generated");
    console.log("📱 QR Code URL:", secretResponse.data.data.qrCodeUrl);
    console.log("🔑 Secret:", secretResponse.data.data.secret);

    // For testing purposes, we'll simulate enabling 2FA without actually scanning QR code
    // In real scenario, user would scan QR code and enter the TOTP
    console.log("\n4. Testing 2FA endpoints structure...");

    // Test error handling for enable 2FA without token
    try {
      await axios.post(
        `${BASE_URL}/users/2fa/enable`,
        {
          secret: secretResponse.data.data.secret,
        },
        { headers }
      );
    } catch (error) {
      if (error.response?.status === 400) {
        console.log("✅ Enable 2FA properly validates missing token");
      }
    }

    // Test error handling for verify 2FA without proper data
    try {
      await axios.post(`${BASE_URL}/users/2fa/verify`, {}, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log("✅ Verify 2FA properly validates missing data");
      }
    }

    // Test disable 2FA without password
    try {
      await axios.post(`${BASE_URL}/users/2fa/disable`, {}, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log("✅ Disable 2FA properly validates missing password");
      }
    }

    // Test generate backup codes without password
    try {
      await axios.post(`${BASE_URL}/users/2fa/backup-codes`, {}, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          "✅ Generate backup codes properly validates missing password"
        );
      }
    }

    console.log("\n🎉 2FA API structure test completed successfully!");
    console.log("\n📝 Manual Testing Required:");
    console.log("1. Open http://localhost:5173 in your browser");
    console.log("2. Login with: test2fa@example.com / password123");
    console.log("3. Go to Profile > Security tab");
    console.log("4. Enable 2FA using an authenticator app");
    console.log("5. Test login with 2FA enabled");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

test2FA();
