// Health Logs Routes - /health/logs/*
// Real-time log streaming endpoints with proper authentication

const express = require("express");
const router = express.Router();
const logger = require("@config/logger");
const { getWebSocketManager } = require("../../websockets");
const { protect, adminOnly } = require("@middleware/authMiddleware");

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

    // Get recent backend logs
    const recentLogs = await getRecentServiceLogs(
      "backend",
      parseInt(lines),
      level
    );

    res.json({
      success: true,
      data: {
        service: "Express Backend",
        logs: recentLogs,
        totalLines: recentLogs.length,
        level: level,
        streamingEndpoint: "/logs (WebSocket)",
        streamId: "server",
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

    // Get recent AI service logs
    const recentLogs = await getRecentServiceLogs(
      "ai-service",
      parseInt(lines),
      level
    );

    res.json({
      success: true,
      data: {
        service: "FastAPI AI Service",
        logs: recentLogs,
        totalLines: recentLogs.length,
        level: level,
        streamingEndpoint: "/logs (WebSocket)",
        streamId: "ai-service",
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

    // Get recent agent logs
    const recentLogs = await getRecentServiceLogs(
      "agent",
      parseInt(lines),
      level
    );

    res.json({
      success: true,
      data: {
        service: "DeployIO Agent",
        logs: recentLogs,
        totalLines: recentLogs.length,
        level: level,
        streamingEndpoint: "/logs (WebSocket)",
        streamId: "agent",
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
 * Admin-only endpoint to trigger test logs for a specific service
 * POST /health/logs/:service/test
 */
router.post("/:service/test", protect, adminOnly, (req, res) => {
  try {
    const { service } = req.params;
    const supportedServices = ["backend", "ai-service", "agent"];

    if (!supportedServices.includes(service)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported service. Must be one of: ${supportedServices.join(
          ", "
        )}`,
      });
    }

    const webSocketManager = getWebSocketManager();
    const logsNamespace = webSocketManager.getNamespace("/logs");

    if (!logsNamespace) {
      return res.status(503).json({
        success: false,
        message: "WebSocket logs namespace not available",
      });
    }

    // Generate service-specific test logs
    const testLogs = generateTestLogsForService(service);

    // Send each test log with staggered timing
    testLogs.forEach((logEntry, index) => {
      setTimeout(() => {
        logEntry.timestamp = Date.now() / 1000;
        logEntry.serverTimestamp = new Date().toISOString();

        const streamId = getStreamIdFromService(logEntry.service);

        logsNamespace.emit("stream:data", {
          streamId,
          logType: streamId,
          timestamp: logEntry.serverTimestamp,
          data: {
            timestamp: new Date(logEntry.timestamp * 1000).toISOString(),
            level: logEntry.level,
            message: logEntry.message,
            service: logEntry.service,
            logger: logEntry.logger,
            parsed: true,
          },
          raw: formatLogLine(logEntry),
          source: "test",
          triggeredBy: req.user.email,
        });
      }, index * 800); // Stagger by 800ms
    });

    res.json({
      success: true,
      message: `${
        testLogs.length
      } test logs will be streamed for ${service} over the next ${Math.ceil(
        testLogs.length * 0.8
      )} seconds`,
      service: service,
      triggeredBy: req.user.email,
    });
  } catch (error) {
    logger.error("Error generating service test logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate test logs",
      error: error.message,
    });
  }
});

/**
 * Admin-only endpoint to get all services logs at once
 * GET /health/logs/all
 */
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const { lines = 20 } = req.query;

    const services = ["backend", "ai-service", "agent"];
    const allLogs = {};

    for (const service of services) {
      try {
        allLogs[service] = await getRecentServiceLogs(
          service,
          parseInt(lines),
          "all"
        );
      } catch (error) {
        allLogs[service] = {
          error: error.message,
          logs: [],
        };
      }
    }

    res.json({
      success: true,
      data: {
        services: allLogs,
        totalServices: services.length,
        linesPerService: parseInt(lines),
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

/**
 * Helper function to get recent logs for a specific service
 */
async function getRecentServiceLogs(serviceType, lines = 50, level = "all") {
  try {
    const fs = require("fs");
    const path = require("path");
    const { exec } = require("child_process");
    const util = require("util");
    const execPromise = util.promisify(exec);

    // Map service types to log file paths
    const logPaths = {
      backend: path.join(process.cwd(), "logs", "combined.log"),
      "ai-service": path.join(
        process.cwd(),
        "..",
        "ai-service",
        "logs",
        "ai-service.log"
      ),
      agent: path.join(process.cwd(), "..", "agent", "logs", "agent.log"),
    };

    const logPath = logPaths[serviceType];

    if (!logPath || !fs.existsSync(logPath)) {
      return {
        error: `Log file not found for ${serviceType}`,
        path: logPath,
        logs: [],
      };
    }

    // Use tail command to get recent lines
    const command =
      process.platform === "win32"
        ? `powershell "Get-Content -Path '${logPath}' -Tail ${lines}"`
        : `tail -n ${lines} "${logPath}"`;

    const { stdout } = await execPromise(command);
    const logLines = stdout
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    // Parse and filter logs
    const parsedLogs = logLines.map((line, index) => {
      const parsed = parseLogLine(line, serviceType);
      return {
        id: `${serviceType}_${Date.now()}_${index}`,
        raw: line,
        parsed: parsed.parsed,
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level || "INFO",
        message: parsed.message || line,
        service: serviceType,
      };
    });

    // Filter by level if specified
    const filteredLogs =
      level === "all"
        ? parsedLogs
        : parsedLogs.filter(
            (log) => log.level.toLowerCase() === level.toLowerCase()
          );

    return {
      logs: filteredLogs,
      totalLines: filteredLogs.length,
      filteredBy: level,
      path: logPath,
    };
  } catch (error) {
    logger.error(`Error reading logs for ${serviceType}:`, error);
    return {
      error: error.message,
      logs: [],
    };
  }
}

/**
 * Helper function to parse log lines based on service type
 */
function parseLogLine(line, serviceType) {
  try {
    // Try to parse as JSON first (for structured logs)
    if (line.startsWith("{")) {
      const parsed = JSON.parse(line);
      return {
        parsed: true,
        timestamp: parsed.timestamp,
        level: parsed.level,
        message: parsed.message,
        ...parsed,
      };
    }

    // Parse different log formats based on service
    switch (serviceType) {
      case "backend":
        // Winston format: timestamp [level]: message
        const winstonMatch = line.match(
          /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+\[(\w+)\]:\s+(.+)$/
        );
        if (winstonMatch) {
          return {
            parsed: true,
            timestamp: winstonMatch[1],
            level: winstonMatch[2],
            message: winstonMatch[3],
          };
        }
        break;

      case "ai-service":
      case "agent":
        // Uvicorn format: INFO:     message
        const uvicornMatch = line.match(/^(\w+):\s+(.+)$/);
        if (uvicornMatch) {
          return {
            parsed: true,
            level: uvicornMatch[1],
            message: uvicornMatch[2],
          };
        }
        break;
    }

    // Fallback for unmatched patterns
    return {
      parsed: false,
      message: line,
    };
  } catch (error) {
    return {
      parsed: false,
      message: line,
      parseError: error.message,
    };
  }
}

/**
 * Helper function to generate service-specific test logs
 */
function generateTestLogsForService(serviceType) {
  const baseTimestamp = Date.now() / 1000;

  const testTemplates = {
    backend: [
      {
        level: "INFO",
        message: "Express server handling authentication request",
        logger: "auth.middleware",
      },
      {
        level: "DEBUG",
        message: "Database connection pool status: 5 active, 10 idle",
        logger: "database.pool",
      },
      {
        level: "WARN",
        message: "Rate limit approaching for IP: 192.168.1.100",
        logger: "rate.limiter",
      },
      {
        level: "INFO",
        message: "WebSocket client connected from namespace /notifications",
        logger: "websocket.manager",
      },
      {
        level: "ERROR",
        message: "Failed to send email notification: SMTP timeout",
        logger: "email.service",
      },
      {
        level: "INFO",
        message: "User profile updated successfully: user@example.com",
        logger: "user.controller",
      },
    ],
    "ai-service": [
      {
        level: "INFO",
        message: "AI service processing code analysis request",
        logger: "analysis.engine",
      },
      {
        level: "DEBUG",
        message: "Redis cache hit for analysis key: proj_123_main.js",
        logger: "cache.manager",
      },
      {
        level: "INFO",
        message: "Machine learning model loaded: deployment-predictor-v2.1",
        logger: "ml.loader",
      },
      {
        level: "WARN",
        message: "High memory usage detected: 85% of allocated memory",
        logger: "resource.monitor",
      },
      {
        level: "INFO",
        message: "Code analysis completed in 2.3 seconds",
        logger: "analysis.engine",
      },
      {
        level: "ERROR",
        message: "OpenAI API rate limit exceeded, falling back to local model",
        logger: "ai.provider",
      },
    ],
    agent: [
      {
        level: "INFO",
        message: "Agent started successfully, monitoring 3 containers",
        logger: "agent.startup",
      },
      {
        level: "DEBUG",
        message: "Docker container health check passed: webapp-prod-v1.2.3",
        logger: "container.monitor",
      },
      {
        level: "INFO",
        message: "Deployment initiated for project: ecommerce-frontend",
        logger: "deployment.manager",
      },
      {
        level: "WARN",
        message: "Container memory usage high: webapp-staging (85% used)",
        logger: "resource.monitor",
      },
      {
        level: "INFO",
        message: "Traefik configuration updated with new service route",
        logger: "traefik.manager",
      },
      {
        level: "ERROR",
        message:
          "Failed to connect to container registry: authentication failed",
        logger: "registry.client",
      },
    ],
  };

  const templates = testTemplates[serviceType] || testTemplates.backend;

  return templates.map((template, index) => ({
    ...template,
    service: getServiceNameFromType(serviceType),
    timestamp: baseTimestamp + index,
  }));
}

/**
 * Helper function to map service types to internal service names
 */
function getServiceNameFromType(serviceType) {
  const serviceMap = {
    backend: "express-backend",
    "ai-service": "ai-service",
    agent: "deployio-agent",
  };
  return serviceMap[serviceType] || serviceType;
}

/**
 * Helper function to map service names to stream IDs
 */
function getStreamIdFromService(serviceName) {
  const serviceMap = {
    "deployio-agent": "agent",
    "ai-service": "ai-service",
    "express-backend": "server",
  };

  return serviceMap[serviceName] || serviceName;
}

/**
 * Helper function to format log entry as a readable line
 */
function formatLogLine(logEntry) {
  const timestamp = new Date(logEntry.timestamp * 1000).toISOString();
  const level = logEntry.level || "INFO";
  const service = logEntry.service || "unknown";
  const message = logEntry.message || "";

  return `${timestamp} [${level}] ${service}: ${message}`;
}

module.exports = router;
