// Health Logs Routes - /health/logs/*
// Real-time log streaming endpoints with proper authentication

const express = require("express");
const router = express.Router();
const logger = require("@config/logger");
const { getWebSocketManager } = require("../../websockets");
const { protect, adminOnly } = require("@middleware/authMiddleware");
const { getRecentServiceLogs } = require("@utils/logUtils");

/**
 * Public status endpoint - shows streaming status without logs
 * GET /health/logs/status
 */
router.get("/status", (req, res) => {
  try {
    const webSocketManager = getWebSocketManager();
    const logsNamespace = webSocketManager.getNamespace("/logs");

    const status = {
      logsNamespaceActive: !!logsNamespace,
      connectedClients: logsNamespace ? logsNamespace.sockets.size : 0,
      supportedServices: ["backend", "ai-service", "agent"],
      streamingAvailable: true,
      requiresAuth: "admin",
    };

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting log streaming status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get log streaming status",
      error: error.message,
    });
  }
});

/**
 * Admin-only real-time logs endpoint for backend service
 * GET /health/logs/backend
 */
router.get("/backend", protect, adminOnly, async (req, res) => {
  try {
    const { lines = 50, level = "all" } = req.query;

    // Get recent backend logs using the new utility
    const recentLogs = await getRecentServiceLogs(
      "backend",
      parseInt(lines),
      level
    );

    res.json({
      success: true,
      data: {
        service: "Express Backend",
        logs: recentLogs.logs || [],
        totalLines: recentLogs.totalLines || 0,
        level: level,
        streamingEndpoint: "/logs (WebSocket)",
        streamId: "server",
        path: recentLogs.path,
        error: recentLogs.error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting backend logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get backend logs",
      error: error.message,
    });
  }
});

/**
 * Admin-only real-time logs endpoint for AI service
 * GET /health/logs/ai-service
 */
router.get("/ai-service", protect, adminOnly, async (req, res) => {
  try {
    const { lines = 50, level = "all" } = req.query;

    // Get recent AI service logs using the new utility
    const recentLogs = await getRecentServiceLogs(
      "ai-service",
      parseInt(lines),
      level
    );

    res.json({
      success: true,
      data: {
        service: "FastAPI AI Service",
        logs: recentLogs.logs || [],
        totalLines: recentLogs.totalLines || 0,
        level: level,
        streamingEndpoint: "/logs (WebSocket)",
        streamId: "ai-service",
        path: recentLogs.path,
        error: recentLogs.error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting AI service logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI service logs",
      error: error.message,
    });
  }
});

/**
 * Admin-only real-time logs endpoint for agent service
 * GET /health/logs/agent
 */
router.get("/agent", protect, adminOnly, async (req, res) => {
  try {
    const { lines = 50, level = "all" } = req.query;

    // Get recent agent logs using the new utility
    const recentLogs = await getRecentServiceLogs(
      "agent",
      parseInt(lines),
      level
    );

    res.json({
      success: true,
      data: {
        service: "DeployIO Agent",
        logs: recentLogs.logs || [],
        totalLines: recentLogs.totalLines || 0,
        level: level,
        streamingEndpoint: "/logs (WebSocket)",
        streamId: "agent",
        path: recentLogs.path,
        error: recentLogs.error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting agent logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get agent logs",
      error: error.message,
    });
  }
});

/**
 * Get agent logs from remote EC2 instance
 * GET /health/logs/agent/remote
 */
router.get("/agent/remote", protect, adminOnly, async (req, res) => {
  try {
    const { lines = 50, level = "all" } = req.query;
    const axios = require("axios");

    const agentUrl = process.env.AGENT_URL || "http://localhost:8001";

    // Try to get logs from remote agent
    const response = await axios.get(`${agentUrl}/agent/v1/logs`, {
      params: { lines, level },
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${process.env.AGENT_SECRET || "default-secret"}`,
        "User-Agent": "Express-Backend-LogFetcher/1.0",
      },
    });

    res.json({
      success: true,
      data: {
        service: "DeployIO Agent (Remote)",
        logs: response.data.logs || [],
        totalLines: response.data.totalLines || 0,
        level: level,
        source: "remote",
        streamingEndpoint: "/logs (WebSocket)",
        streamId: "agent-remote",
        remoteUrl: agentUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting remote agent logs:", error);

    // Fallback to local logs if remote fails
    try {
      const localLogs = await getRecentServiceLogs(
        "agent",
        parseInt(req.query.lines || 50),
        req.query.level || "all"
      );
      res.json({
        success: true,
        data: {
          service: "DeployIO Agent (Local Fallback)",
          logs: localLogs.logs || [],
          totalLines: localLogs.totalLines || 0,
          level: req.query.level || "all",
          source: "local_fallback",
          error: "Remote agent unreachable, showing local logs",
          remoteError: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: "Failed to get agent logs from both remote and local sources",
        error: error.message,
        fallbackError: fallbackError.message,
      });
    }
  }
});

/**
 * Get all service logs combined (admin only)
 * GET /health/logs/all
 */
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const { lines = 20, level = "all" } = req.query;
    const linesPerService = Math.ceil(parseInt(lines) / 3);

    const services = ["backend", "ai-service", "agent"];
    const allLogs = {};

    // Fetch logs from all services
    for (const service of services) {
      try {
        allLogs[service] = await getRecentServiceLogs(
          service,
          linesPerService,
          level
        );
      } catch (error) {
        logger.error(`Error getting ${service} logs:`, error);
        allLogs[service] = {
          error: error.message,
          logs: [],
          totalLines: 0,
        };
      }
    }

    res.json({
      success: true,
      data: {
        services: allLogs,
        totalServices: services.length,
        level: level,
        linesPerService: linesPerService,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error getting all service logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get all service logs",
      error: error.message,
    });
  }
});

module.exports = router;
