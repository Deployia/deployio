// Health Check Routes - /health/*
// System health monitoring endpoints

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { getRedisClient } = require("@config/redisClient");

// Basic health check
router.get("/", async (req, res) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {},
    };

    // Check database connection
    health.services.database = {
      status: mongoose.connection.readyState === 1 ? "healthy" : "unhealthy",
      readyState: mongoose.connection.readyState,
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

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check
router.get("/detailed", async (req, res) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      services: {},
      external: {},
    };

    // Database health
    health.services.database = await getDatabaseHealth();

    // Redis health
    health.services.redis = await getRedisHealth();

    // File system health
    health.services.filesystem = await getFilesystemHealth();

    // External services health
    health.external.aiService = await checkAiServiceHealth();
    health.external.deploymentAgent = await checkDeploymentAgentHealth();
    health.external.github = await checkGitHubApiHealth();

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: "error",
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
    // TODO: Implement AI service health check
    return { status: "healthy", responseTime: 0 };
  } catch (error) {
    return { status: "unhealthy", error: error.message };
  }
}

async function checkDeploymentAgentHealth() {
  try {
    // TODO: Implement deployment agent health check
    return { status: "healthy", responseTime: 0 };
  } catch (error) {
    return { status: "unhealthy", error: error.message };
  }
}

async function checkGitHubApiHealth() {
  try {
    // TODO: Implement GitHub API health check
    return { status: "healthy", responseTime: 0 };
  } catch (error) {
    return { status: "unhealthy", error: error.message };
  }
}

async function getDatabaseHealth() {
  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
      readyState: mongoose.connection.readyState,
      collections: mongoose.connection.collections
        ? Object.keys(mongoose.connection.collections).length
        : 0,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      readyState: mongoose.connection.readyState,
    };
  }
}

async function getRedisHealth() {
  try {
    const redisClient = getRedisClient();
    if (!redisClient) {
      return { status: "unavailable", message: "Redis client not initialized" };
    }

    const start = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
      connected: redisClient.isReady,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
    };
  }
}

async function getFilesystemHealth() {
  try {
    const fs = require("fs").promises;
    const start = Date.now();
    await fs.access("/tmp", fs.constants.W_OK);
    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime,
      writable: true,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      writable: false,
    };
  }
}

module.exports = router;
