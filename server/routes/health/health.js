// Health Check Routes - /health/*
// System health monitoring endpoints

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { getRedisClient } = require("@config/redisClient");
const os = require("os");

// Helper function to get system metrics
function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  // Get CPU usage (Node.js process only)
  const cpuUsage = process.cpuUsage();
  const cpus = os.cpus();

  return {
    memory: {
      usage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100, // % with 2 decimal places
      used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
      total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
      system_used: Math.round((usedMemory / 1024 / 1024) * 100) / 100, // MB
      system_total: Math.round((totalMemory / 1024 / 1024) * 100) / 100, // MB
      external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100, // MB
    },
    cpu: {
      usage: 0, // Node.js doesn't provide real-time CPU percentage easily
      cores: cpus.length,
      model: cpus[0]?.model || "Unknown",
      user_cpu_time: cpuUsage.user,
      system_cpu_time: cpuUsage.system,
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      node_version: process.version,
      uptime: os.uptime(),
      load_average: os.loadavg(),
    },
  };
}

// Basic health check
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now();

    // Get enhanced system metrics
    const systemMetrics = getSystemMetrics();

    const health = {
      service: "Express Backend",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: systemMetrics.memory,
      cpu: systemMetrics.cpu,
      system: systemMetrics.system,
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

// Agent Bridge Health Check
router.get("/bridge", async (req, res) => {
  try {
    // Import here to avoid circular dependencies
    const agentBridgeService = require("../../services/bridge/AgentBridgeService");

    const bridgeHealth = await agentBridgeService.healthCheck();

    res.json({
      service: "Agent Bridge",
      timestamp: new Date().toISOString(),
      initialized: bridgeHealth.initialized,
      connectedAgents: bridgeHealth.connectedAgents,
      health: {
        overall: bridgeHealth.health.overall,
        agentConnections: bridgeHealth.health.agentConnections,
        streamRouting: bridgeHealth.health.streamRouting,
      },
      status: bridgeHealth.initialized ? "operational" : "initializing",
    });
  } catch (error) {
    res.status(500).json({
      service: "Agent Bridge",
      error: error.message,
      timestamp: new Date().toISOString(),
      health: {
        overall: "error",
      },
    });
  }
});

// Detailed Agent Bridge Status
router.get("/bridge/status", async (req, res) => {
  try {
    const agentBridgeService = require("../../services/bridge/AgentBridgeService");

    const status = agentBridgeService.getStatus();
    const connectedAgents = [];

    // Get detailed information about each connected agent
    for (const [
      agentId,
      agentInfo,
    ] of agentBridgeService.connectedAgents.entries()) {
      const verification = await agentBridgeService.verifyBridgeConnection(
        agentId
      );

      connectedAgents.push({
        agentId,
        socketId: agentInfo.socketId,
        platformDomain: agentInfo.platformDomain,
        connectedAt: agentInfo.connectedAt,
        connectionDuration: new Date() - agentInfo.connectedAt,
        handshakeCompleted: agentInfo.handshakeCompleted || false,
        connectionAcked: agentInfo.connectionAcked || false,
        healthStatus: agentInfo.healthStatus || "unknown",
        lastHeartbeat: agentInfo.lastHeartbeat,
        lastPong: agentInfo.lastPong,
        capabilities: agentInfo.capabilities || {},
        verification,
      });
    }

    res.json({
      service: "Agent Bridge",
      timestamp: new Date().toISOString(),
      initialized: status.initialized,
      connectedAgents: status.connectedAgents,
      agentList: status.agentList,
      activeStreams: status.activeStreams,
      detailedAgents: connectedAgents,
      componentStatus: status.componentStatus,
      stats: {
        totalConnections: connectedAgents.length,
        healthyConnections: connectedAgents.filter(
          (a) => a.verification.connected
        ).length,
        completedHandshakes: connectedAgents.filter((a) => a.handshakeCompleted)
          .length,
        ackedConnections: connectedAgents.filter((a) => a.connectionAcked)
          .length,
      },
    });
  } catch (error) {
    res.status(500).json({
      service: "Agent Bridge Status",
      error: error.message,
      timestamp: new Date().toISOString(),
      health: {
        overall: "error",
      },
    });
  }
});

// WebSocket Services Health
router.get("/websockets", async (req, res) => {
  try {
    const { getWebSocketStats } = require("@websockets/index");

    const stats = getWebSocketStats();

    res.json({
      service: "WebSocket Services",
      timestamp: new Date().toISOString(),
      ...stats,
      health: {
        overall: stats.totalNamespaces > 0 ? "healthy" : "degraded",
        namespaces: `${stats.totalNamespaces} active`,
      },
    });
  } catch (error) {
    res.status(500).json({
      service: "WebSocket Services",
      error: error.message,
      timestamp: new Date().toISOString(),
      health: {
        overall: "error",
      },
    });
  }
});

module.exports = router;
