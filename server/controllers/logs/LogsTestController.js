/**
 * Logs Test Controller
 * Handles test and debugging endpoints for logging system
 */

const logger = require("@config/logger");
const { getWebSocketManager } = require("@websockets");

class LogsTestController {
  /**
   * Generate test logs
   */
  static async generateTestLogs(req, res) {
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
          message: "Test log message from unified logging system",
          service: "unified-logger",
          logger: "test.logger",
        },
        {
          level: "WARN",
          message: "Warning: This is a test warning message",
          service: "unified-logger",
          logger: "test.logger",
        },
        {
          level: "ERROR",
          message: "Error: This is a test error message",
          service: "unified-logger",
          logger: "test.logger",
        },
        {
          level: "DEBUG",
          message: "Debug: Unified logging system test completed",
          service: "unified-logger",
          logger: "test.logger",
        },
      ];

      // Send each test log with delay
      testLogs.forEach((logEntry, index) => {
        setTimeout(() => {
          logEntry.timestamp = new Date().toISOString();

          logsNamespace.emit("system:log", {
            ...logEntry,
            id: `test_${Date.now()}_${index}`,
            source: "test-endpoint",
          });
        }, index * 1000);
      });

      res.json({
        success: true,
        message: `${testLogs.length} test logs will be sent over the next ${testLogs.length} seconds`,
        data: {
          testLogs: testLogs.length,
          websocketEndpoint: "/logs",
        },
      });
    } catch (error) {
      logger.error("Error generating test logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate test logs",
        error: error.message,
      });
    }
  }

  /**
   * Receive logs from internal services
   */
  static async receiveInternalLogs(req, res) {
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

      // Broadcast to WebSocket clients
      const webSocketManager = getWebSocketManager();
      const logsNamespace = webSocketManager.getNamespace("/logs");

      if (logsNamespace) {
        logsNamespace.emit("system:log", {
          ...logEntry,
          timestamp: logEntry.serverTimestamp,
          source: "internal-service",
        });
      }

      // Log to server's own log system
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
      logger.error("Error processing internal log stream:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process log entry",
        error: error.message,
      });
    }
  }
}

module.exports = LogsTestController;
