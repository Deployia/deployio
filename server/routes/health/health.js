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
    health.services.database = {
      status: mongoose.connection.readyState === 1 ? "healthy" : "unhealthy",
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name,
    };

    // Check Redis connection
    const redisClient = getRedisClient();
    health.services.redis = {
      status: redisClient && redisClient.isReady ? "healthy" : "unhealthy",
      connected: redisClient ? redisClient.isReady : false,
    };

    // Check AI service connection
    health.services.aiService = await checkAiServiceHealth();

    // Check deployment agent connection
    health.services.deploymentAgent = await checkDeploymentAgentHealth();

    // Determine overall health
    const unhealthyServices = Object.values(health.services).filter(
      (service) => service.status !== "healthy"
    );

    if (unhealthyServices.length > 0) {
      health.status = "degraded";
      res.status(503);
    }

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
    const response = await axios.get(`${aiServiceUrl}/health`, {
      timeout: 5000,
      headers: {
        "User-Agent": "Express-Backend-HealthCheck/1.0",
      },
    });

    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
      version: response.data.version || "unknown",
      uptime: response.data.uptime || 0,
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
    const agentUrl = process.env.AGENT_URL || "http://localhost:8001";

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
      version: response.data.version || "unknown",
      uptime: response.data.uptime || 0,
      services: response.data.services || {},
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
