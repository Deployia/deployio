#!/usr/bin/env node

/**
 * DevOps Automation Integration Test
 *
 * This script tests the new AI-powered DevOps automation endpoints to ensure
 * they're working correctly with the pipeline generator, environment manager,
 * and build optimizer engines.
 */

const axios = require("axios");
const colors = require("colors");

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

/**
 * Test helper functions
 */
const log = (message, type = "info") => {
  const timestamp = new Date().toISOString();
  switch (type) {
    case "success":
      console.log(`[${timestamp}] ✅ ${message}`.green);
      break;
    case "error":
      console.log(`[${timestamp}] ❌ ${message}`.red);
      break;
    case "warning":
      console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
      break;
    default:
      console.log(`[${timestamp}] ℹ️  ${message}`.blue);
  }
};

const test = async (testName, testFn) => {
  try {
    log(`Running test: ${testName}`);
    await testFn();
    testResults.passed++;
    log(`Test passed: ${testName}`, "success");
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${error.message}`);
    log(`Test failed: ${testName} - ${error.message}`, "error");
  }
};

/**
 * Test AI Service Health
 */
const testAiServiceHealth = async () => {
  const response = await axios.get(`${AI_SERVICE_URL}/service/v1/health`);

  if (response.status !== 200) {
    throw new Error("AI Service health check failed");
  }

  if (response.data.status !== "ok") {
    throw new Error(`AI Service not healthy: ${response.data.status}`);
  }

  log("AI Service is healthy and ready");
};

/**
 * Test Pipeline Generation Endpoint
 */
const testPipelineGeneration = async () => {
  const testPayload = {
    repository_url: "https://github.com/test/repo",
    target_platforms: ["github", "gitlab"],
    deployment_targets: ["docker", "kubernetes"],
    quality_gates: ["testing", "security", "performance"],
    ci_features: ["auto_testing", "security_scanning", "caching"],
    cd_features: ["auto_deployment", "rollback", "notifications"],
  };

  const response = await axios.post(
    `${AI_SERVICE_URL}/service/v1/ai/generate-pipeline`,
    {
      project_id: "test-project-001",
      ...testPayload,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service": "deployio-backend",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `Pipeline generation failed with status: ${response.status}`
    );
  }

  const result = response.data.data;

  // Validate response structure
  if (!result || typeof result !== "object") {
    throw new Error("Invalid response structure");
  }

  // Check for expected fields
  const expectedFields = [
    "deployment_configs",
    "quality_gates",
    "optimization_notes",
    "estimated_build_time",
  ];
  for (const field of expectedFields) {
    if (!(field in result)) {
      throw new Error(`Missing expected field: ${field}`);
    }
  }

  log("Pipeline generation endpoint working correctly");
};

/**
 * Test Environment Configuration Endpoint
 */
const testEnvironmentConfiguration = async () => {
  const testPayload = {
    environments: ["development", "staging", "production"],
    cloud_provider: "aws",
    deployment_strategy: "blue_green",
    infrastructure_type: "kubernetes",
    monitoring_enabled: true,
    auto_scaling: true,
  };

  const response = await axios.post(
    `${AI_SERVICE_URL}/service/v1/ai/manage-environment`,
    {
      project_id: "test-project-002",
      ...testPayload,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service": "deployio-backend",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `Environment configuration failed with status: ${response.status}`
    );
  }

  const result = response.data.data;

  // Validate response structure
  if (!result || typeof result !== "object") {
    throw new Error("Invalid response structure");
  }

  // Check for expected fields
  const expectedFields = [
    "terraform_configs",
    "kubernetes_manifests",
    "security_policies",
  ];
  for (const field of expectedFields) {
    if (!(field in result)) {
      throw new Error(`Missing expected field: ${field}`);
    }
  }

  log("Environment configuration endpoint working correctly");
};

/**
 * Test Build Optimization Endpoint
 */
const testBuildOptimization = async () => {
  const testPayload = {
    technology_stack: {
      language: "javascript",
      framework: "react",
      build_tool: "npm",
      package_manager: "npm",
    },
    optimization_level: "balanced",
    target_platform: "cloud",
    build_frequency: "moderate",
  };

  const response = await axios.post(
    `${AI_SERVICE_URL}/service/v1/ai/optimize-build`,
    {
      project_id: "test-project-003",
      ...testPayload,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service": "deployio-backend",
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `Build optimization failed with status: ${response.status}`
    );
  }

  const result = response.data.data;

  // Validate response structure
  if (!result || typeof result !== "object") {
    throw new Error("Invalid response structure");
  }

  // Check for expected fields
  const expectedFields = [
    "optimization_recommendations",
    "estimated_improvements",
  ];
  for (const field of expectedFields) {
    if (!(field in result)) {
      throw new Error(`Missing expected field: ${field}`);
    }
  }

  log("Build optimization endpoint working correctly");
};

/**
 * Test Backend Integration (if available)
 */
const testBackendIntegration = async () => {
  try {
    // Test backend health first
    const healthResponse = await axios.get(`${BASE_URL}/api/v1/health`);
    if (healthResponse.status !== 200) {
      log("Backend not available, skipping integration test", "warning");
      return;
    }

    log(
      "Backend integration test would require authentication - skipping for now",
      "warning"
    );
  } catch (error) {
    log("Backend not available, skipping integration test", "warning");
  }
};

/**
 * Main test runner
 */
const runTests = async () => {
  console.log("\n🚀 Starting DevOps Automation Integration Tests\n".cyan.bold);

  // Test AI Service Health
  await test("AI Service Health Check", testAiServiceHealth);

  // Test DevOps Automation Endpoints
  await test("Pipeline Generation", testPipelineGeneration);
  await test("Environment Configuration", testEnvironmentConfiguration);
  await test("Build Optimization", testBuildOptimization);

  // Test Backend Integration
  await test("Backend Integration", testBackendIntegration);

  // Print results
  console.log("\n📊 Test Results Summary\n".cyan.bold);
  console.log(`✅ Passed: ${testResults.passed}`.green);
  console.log(`❌ Failed: ${testResults.failed}`.red);

  if (testResults.errors.length > 0) {
    console.log("\n❌ Error Details:\n".red.bold);
    testResults.errors.forEach((error) => {
      console.log(`   • ${error}`.red);
    });
  }

  if (testResults.failed === 0) {
    console.log(
      "\n🎉 All tests passed! DevOps Automation is working correctly.".green
        .bold
    );
    process.exit(0);
  } else {
    console.log(
      "\n💥 Some tests failed. Please check the errors above.".red.bold
    );
    process.exit(1);
  }
};

// Handle errors gracefully
process.on("unhandledRejection", (error) => {
  log(`Unhandled rejection: ${error.message}`, "error");
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  log(`Test runner failed: ${error.message}`, "error");
  process.exit(1);
});
