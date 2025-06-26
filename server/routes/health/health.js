// Health Check Routes - /health/*
// System health monitoring endpoints

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { getRedisClient } = require("@config/redisClient");

// Basic health check
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now();

    const health = {
      service: "Express Backend",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      services: {},
    };

    // Check database connection
    health.mongodb = {
      status: mongoose.connection.readyState === 1 ? "healthy" : "unhealthy",
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name,
    };

    // Check Redis connection
    const redisClient = getRedisClient();
    health.redis = {
      status: redisClient && redisClient.isReady ? "healthy" : "unhealthy",
      connected: redisClient ? redisClient.isReady : false,
    };

    // Check AI service connection
    health.services.aiService = await checkAiServiceHealth();

    // Check deployment agent connection
    health.services.deploymentAgent = await checkDeploymentAgentHealth();

    // Determine overall health with more nuanced logic
    const coreServices = ["mongodb", "redis"];
    const optionalServices = ["aiService", "deploymentAgent"];

    // Check core services (MongoDB, Redis)
    const coreServicesHealthy = [
      health.mongodb.status,
      health.redis.status,
    ].every((status) => status === "healthy");

    // Check optional services
    const unhealthyOptionalServices = Object.entries(health.services).filter(
      ([key, service]) =>
        optionalServices.includes(key) && service.status !== "healthy"
    );

    // Determine status based on core vs optional services
    if (!coreServicesHealthy) {
      // Core services down = unhealthy
      health.status = "unhealthy";
      res.status(503);
    } else if (unhealthyOptionalServices.length > 0) {
      // Core services up, but some optional services down = degraded
      health.status = "degraded";
      res.status(200); // Still return 200 since core system works
    } else {
      // All services healthy
      health.status = "healthy";
      res.status(200);
    }

    // Add detailed health summary
    health.summary = {
      coreServicesHealthy,
      optionalServicesDown: unhealthyOptionalServices.length,
      totalServices: Object.keys(health.services).length + 2, // +2 for mongodb, redis
    };

    // Add response time
    health.responseTime = Date.now() - startTime;

    res.json(health);
  } catch (error) {
    res.status(500).json({
      service: "Express Backend",
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe (for Kubernetes)
router.get("/liveness", (req, res) => {
  res.status(200).json({ status: "alive" });
});

// Readiness probe (for Kubernetes)
router.get("/readiness", async (req, res) => {
  try {
    // Check if app is ready to serve traffic
    const isReady = mongoose.connection.readyState === 1;

    if (isReady) {
      res.status(200).json({ status: "ready" });
    } else {
      res.status(503).json({ status: "not ready" });
    }
  } catch (error) {
    res.status(503).json({ status: "not ready", error: error.message });
  }
});

// Helper functions
async function checkAiServiceHealth() {
  try {
    const axios = require("axios");
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const start = Date.now();
    const response = await axios.get(`${aiServiceUrl}/service/v1/health`, {
      timeout: 5000,
      headers: {
        "User-Agent": "Express-Backend-HealthCheck/1.0",
      },
    });

    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
      ...response.data,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      code: error.code || error.response?.status,
    };
  }
}

async function checkDeploymentAgentHealth() {
  try {
    const axios = require("axios");
    const agentUrl = process.env.AGENT_URL || "http://localhost:5000";

    const start = Date.now();
    const response = await axios.get(`${agentUrl}/agent/v1/health`, {
      timeout: 5000,
      headers: {
        "User-Agent": "Express-Backend-HealthCheck/1.0",
      },
    });

    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
      ...response.data,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      code: error.code || error.response?.status,
    };
  }
}

module.exports = router;
