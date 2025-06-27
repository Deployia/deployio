// Health Service Routes - /health/service/*
// Detailed service monitoring with admin-protected logs

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../../middleware/authMiddleware");
const logger = require("../../config/logger");
const mongoose = require("mongoose");
const { getRedisClient } = require("../../config/redisClient");

/**
 * Get detailed service information (admin only)
 */
router.get("/:serviceName", protect, adminOnly, async (req, res) => {
  try {
    const { serviceName } = req.params;

    let serviceInfo;
    switch (serviceName) {
      case "backend":
        serviceInfo = await getBackendServiceDetails();
        break;
      case "ai-service":
        serviceInfo = await getAiServiceDetails();
        break;
      case "agent":
        serviceInfo = await getAgentServiceDetails();
        break;
      default:
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
    }

    res.json({
      success: true,
      data: serviceInfo,
    });
  } catch (error) {
    logger.error(
      `Error getting ${req.params.serviceName} service details:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get service details",
      error: error.message,
    });
  }
});

/**
 * Get service logs (admin only) - Using unified LogCollectorService
 */
router.get("/:serviceName/logs", protect, adminOnly, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { lines = 100, level = "all" } = req.query;

    // Use unified LogCollectorService instead of duplicate logic
    const {
      logCollectorService,
    } = require("../../services/logging/LogCollectorService");

    const logData = await logCollectorService.getRecentLogs(serviceName, {
      lines: parseInt(lines),
      level,
    });

    res.json({
      success: true,
      data: {
        service: serviceName,
        lines: logData.logs.length,
        logs: logData.logs,
        totalLines: logData.totalLines,
        logFile: logData.logFile,
        streamingEndpoint: "/logs (WebSocket)",
      },
    });
  } catch (error) {
    logger.error(`Error getting ${req.params.serviceName} logs:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get service logs",
      error: error.message,
    });
  }
});

/**
 * Get service metrics (admin only) - Using unified MetricsCollector
 */
router.get("/:serviceName/metrics", protect, adminOnly, async (req, res) => {
  try {
    const { serviceName } = req.params;

    // Use unified MetricsCollector for consistent metrics
    const {
      metricsCollector,
    } = require("../../services/logging/MetricsCollector");
    const allMetrics = await metricsCollector.getCurrentMetrics();

    // Extract specific service metrics
    let metrics;
    if (allMetrics && allMetrics.services && allMetrics.services[serviceName]) {
      metrics = allMetrics.services[serviceName];
    } else {
      // Fallback to individual service metrics if not available in collector
      const SystemMetricsService = require("../../services/logging/SystemMetricsService");
      metrics = await SystemMetricsService.getServiceMetrics(serviceName);
    }

    res.json({
      success: true,
      data: {
        ...metrics,
        streamingEndpoint: "/metrics (WebSocket)",
        collectedAt: allMetrics?.timestamp,
      },
    });
  } catch (error) {
    logger.error(`Error getting ${req.params.serviceName} metrics:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get service metrics",
      error: error.message,
    });
  }
});

// Helper functions for service details
async function getBackendServiceDetails() {
  const startTime = Date.now();

  // Database info
  const dbInfo = {
    status: mongoose.connection.readyState === 1 ? "healthy" : "unhealthy",
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
  };

  try {
    await mongoose.connection.db.admin().ping();
    dbInfo.responseTime = Date.now() - startTime;
  } catch (error) {
    dbInfo.error = error.message;
  }

  // Redis info
  const redisClient = getRedisClient();
  const redisInfo = {
    status: redisClient && redisClient.isReady ? "healthy" : "unhealthy",
    connected: redisClient ? redisClient.isReady : false,
  };

  if (redisClient) {
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      redisInfo.responseTime = Date.now() - redisStart;
    } catch (error) {
      redisInfo.error = error.message;
    }
  }

  return {
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
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    services: {
      database: dbInfo,
      redis: redisInfo,
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

async function getAiServiceDetails() {
  try {
    const axios = require("axios");
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const response = await axios.get(`${aiServiceUrl}/service/v1/health`, {
      timeout: 10000,
    });

    return {
      ...response.data,
      source: "external",
      url: aiServiceUrl,
    };
  } catch (error) {
    return {
      service: "FastAPI AI Service",
      status: "unhealthy",
      error: error.message,
      code: error.code || error.response?.status,
      source: "external",
      url: process.env.AI_SERVICE_URL || "http://localhost:8000",
    };
  }
}

async function getAgentServiceDetails() {
  try {
    const axios = require("axios");
    const agentUrl = process.env.AGENT_URL || "http://localhost:8001";

    const response = await axios.get(`${agentUrl}/agent/v1/health`, {
      timeout: 10000,
    });

    return {
      ...response.data,
      source: "external",
      url: agentUrl,
    };
  } catch (error) {
    return {
      service: "DeployIO Agent",
      status: "unhealthy",
      error: error.message,
      code: error.code || error.response?.status,
      source: "external",
      url: process.env.AGENT_URL || "http://localhost:8001",
    };
  }
}

// Export functions for backward compatibility
module.exports = router;
