// Internal Log Streaming Routes - /api/internal/logs/*
// Handles log streaming from internal services (Agent, AI Service)

const express = require("express");
const logger = require("@config/logger");
const { getWebSocketManager } = require("@websockets");
const { protect, adminOnly } = require("@middleware/authMiddleware");

const router = express.Router();

/**
 * Stream log endpoint for internal services
 * Receives logs from FastAPI services and broadcasts them via WebSocket
 */
router.post("/stream", async (req, res) => {
  try {
    const logEntry = req.body;

    // Validate log entry
    if (!logEntry || !logEntry.service || !logEntry.message) {
      return res.status(400).json({
        success: false,
        message: "Invalid log entry format",
      });
    }

    // Add server timestamp
    logEntry.serverTimestamp = new Date().toISOString();

    // Broadcast to WebSocket clients in the logs namespace
    const webSocketManager = getWebSocketManager();
    const logsNamespace = webSocketManager.getNamespace("/logs");

    if (logsNamespace) {
      // Determine the stream ID based on service
      const streamId = getStreamIdFromService(logEntry.service);

      // Broadcast to all connected clients in the logs namespace
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
          pathname: logEntry.pathname,
          lineno: logEntry.lineno,
          funcName: logEntry.funcName,
          parsed: true,
        },
        raw: formatLogLine(logEntry),
        source: "websocket",
      });
    }

    // Also log to server's own log system
    const logLevel = logEntry.level?.toLowerCase() || "info";
    const logMessage = `[${logEntry.service}] ${logEntry.message}`;

    switch (logLevel) {
      case "error":
        logger.error(logMessage);
        break;
      case "warn":
      case "warning":
        logger.warn(logMessage);
        break;
      case "debug":
        logger.debug(logMessage);
        break;
      default:
        logger.info(logMessage);
    }

    res.json({
      success: true,
      message: "Log entry received and broadcasted",
    });
  } catch (error) {
    logger.error("Error processing log stream:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process log entry",
      error: error.message,
    });
  }
});

/**
 * Bulk stream logs endpoint for batch processing
 */
router.post("/stream/bulk", async (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        message: "Logs must be an array",
      });
    }

    const webSocketManager = getWebSocketManager();
    const logsNamespace = webSocketManager.getNamespace("/logs");

    if (logsNamespace) {
      // Process each log entry
      logs.forEach((logEntry) => {
        if (logEntry && logEntry.service && logEntry.message) {
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
            source: "websocket",
          });
        }
      });
    }

    res.json({
      success: true,
      message: `${logs.length} log entries processed`,
    });
  } catch (error) {
    logger.error("Error processing bulk log stream:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk log entries",
      error: error.message,
    });
  }
});

/**
 * Get streaming status
 */
router.get("/status", (req, res) => {
  try {
    const webSocketManager = getWebSocketManager();
    const logsNamespace = webSocketManager.getNamespace("/logs");

    const status = {
      logsNamespaceActive: !!logsNamespace,
      connectedClients: logsNamespace ? logsNamespace.sockets.size : 0,
      supportedServices: ["deployio-agent", "ai-service", "express-backend"],
    };

    res.json({
      success: true,
      data: status,
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
 * Test endpoint to generate sample logs
 */
router.post("/test", (req, res) => {
  try {
    const webSocketManager = getWebSocketManager();
    const logsNamespace = webSocketManager.getNamespace("/logs");

    if (!logsNamespace) {
      return res.status(503).json({
        success: false,
        message: "WebSocket logs namespace not available",
      });
    }

    // Generate test logs
    const testLogs = [
      {
        level: "INFO",
        message: "Express backend test log message",
        service: "express-backend",
        logger: "test.logger",
      },
      {
        level: "WARN",
        message: "This is a warning message for testing",
        service: "express-backend",
        logger: "test.logger",
      },
      {
        level: "ERROR",
        message: "This is an error message for testing",
        service: "express-backend",
        logger: "test.logger",
      },
      {
        level: "DEBUG",
        message: "Debug information for testing WebSocket log streaming",
        service: "express-backend",
        logger: "test.logger",
      },
    ];

    // Send each test log
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
        });
      }, index * 1000); // Stagger the test logs
    });

    res.json({
      success: true,
      message: `${testLogs.length} test logs will be sent over the next ${testLogs.length} seconds`,
    });
  } catch (error) {
    logger.error("Error generating test logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate test logs",
      error: error.message,
    });
  }
});

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
