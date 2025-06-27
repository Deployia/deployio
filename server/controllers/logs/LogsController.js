/**
 * Logs Controller
 * Handles all log-related HTTP requests
 */

const logger = require("@config/logger");
const { protect, adminOnly } = require("@middleware/authMiddleware");
const {
  logCollectorService,
} = require("@services/logging/LogCollectorService");
const { metricsCollector } = require("@services/logging/MetricsCollector");
const { getWebSocketManager } = require("@websockets");

class LogsController {
  /**
   * Get logging system status
   * GET /api/v1/logs/status
   */
  static async getStatus(req, res) {
    try {
      const webSocketManager = getWebSocketManager();
      const logsNamespace = webSocketManager.getNamespace("/logs");
      const collectorStatus = logCollectorService.getStatus();

      const status = {
        websocket: {
          namespace: "/logs",
          active: !!logsNamespace,
          connectedClients: logsNamespace ? logsNamespace.sockets.size : 0,
        },
        collector: collectorStatus,
        services: {
          supported: ["backend", "ai-service", "agent"],
          available: Object.keys(collectorStatus.collectors),
        },
        user: {
          id: req.user.id,
          role: req.user.role,
          permissions: {
            systemLogs: req.user.role === "admin",
            userLogs: true,
            metrics: req.user.role === "admin",
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error("Error getting logging system status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get logging system status",
        error: error.message,
      });
    }
  }

  /**
   * Get system logs for all services
   * GET /api/v1/logs/system
   */
  static async getSystemLogs(req, res) {
    try {
      const { service, lines = 50, level = "all", format = "json" } = req.query;

      if (service) {
        // Get logs for specific service
        const serviceLog = await logCollectorService.getRecentLogs(service, {
          lines: parseInt(lines),
          level,
        });

        res.json({
          success: true,
          data: {
            service,
            ...serviceLog,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // Get logs for all services
        const services = ["backend", "ai-service", "agent"];
        const linesPerService = Math.ceil(parseInt(lines) / services.length);
        const allLogs = {};

        for (const serviceId of services) {
          try {
            allLogs[serviceId] = await logCollectorService.getRecentLogs(
              serviceId,
              {
                lines: linesPerService,
                level,
              }
            );
          } catch (error) {
            logger.error(`Error getting logs for ${serviceId}:`, error);
            allLogs[serviceId] = {
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
            level,
            linesPerService,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error("Error getting system logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get system logs",
        error: error.message,
      });
    }
  }

  /**
   * Get logs for specific system service
   * GET /api/v1/logs/system/:service
   */
  static async getSystemServiceLogs(req, res) {
    try {
      const { service } = req.params;
      const { lines = 50, level = "all" } = req.query;

      const serviceLog = await logCollectorService.getRecentLogs(service, {
        lines: parseInt(lines),
        level,
      });

      res.json({
        success: true,
        data: {
          service,
          ...serviceLog,
          streamingEndpoint: "/logs (WebSocket)",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        `Error getting logs for service ${req.params.service}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: `Failed to get logs for service ${req.params.service}`,
        error: error.message,
      });
    }
  }

  /**
   * Get user's project logs
   * GET /api/v1/logs/projects/:projectId
   */
  static async getProjectLogs(req, res) {
    try {
      const { projectId } = req.params;
      const { lines = 50, level = "all" } = req.query;
      const userId = req.user.id;

      // TODO: Verify user has access to this project
      // const hasAccess = await verifyProjectAccess(userId, projectId);
      // if (!hasAccess) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Access denied to project logs",
      //   });
      // }

      // TODO: Get project logs from agent service
      // For now, return placeholder
      res.json({
        success: true,
        data: {
          projectId,
          logs: [],
          totalLines: 0,
          message: "Project logs will be available in the next phase",
          streamingEndpoint: "/logs (WebSocket)",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        `Error getting project logs for ${req.params.projectId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to get project logs",
        error: error.message,
      });
    }
  }

  /**
   * Get deployment logs
   * GET /api/v1/logs/deployments/:deploymentId
   */
  static async getDeploymentLogs(req, res) {
    try {
      const { deploymentId } = req.params;
      const { lines = 50, level = "all", container } = req.query;
      const userId = req.user.id;

      // TODO: Verify user has access to this deployment
      // const hasAccess = await verifyDeploymentAccess(userId, deploymentId);
      // if (!hasAccess) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Access denied to deployment logs",
      //   });
      // }

      // TODO: Get deployment logs from agent service
      // This should connect to the remote agent and get container logs
      res.json({
        success: true,
        data: {
          deploymentId,
          container,
          logs: [],
          totalLines: 0,
          message:
            "Deployment logs will be available when agent integration is complete",
          streamingEndpoint: "/logs (WebSocket)",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        `Error getting deployment logs for ${req.params.deploymentId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to get deployment logs",
        error: error.message,
      });
    }
  }

  /**
   * Get system metrics using MetricsCollector
   * GET /api/v1/logs/metrics
   */
  static async getSystemMetrics(req, res) {
    try {
      const { type = "current", hours = 1 } = req.query;

      let metrics;

      if (type === "historical") {
        metrics = await metricsCollector.getHistoricalMetrics({
          hours: parseInt(hours),
          maxEntries: 100,
        });
      } else {
        metrics = await metricsCollector.getCurrentMetrics();
      }

      res.json({
        success: true,
        data: {
          type,
          metrics,
          streamingEndpoint: "/metrics (WebSocket)",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting system metrics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get system metrics",
        error: error.message,
      });
    }
  }

  /**
   * Start log stream
   * POST /api/v1/logs/streams
   */
  static async startLogStream(req, res) {
    try {
      const { serviceId, type = "system", options = {} } = req.body;
      const userId = req.user.id;

      // Check permissions
      if (type === "system" && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions for system log streaming",
        });
      }

      const streamId = await logCollectorService.startCollection(serviceId, {
        realtime: true,
        ...options,
      });

      res.json({
        success: true,
        data: {
          streamId,
          serviceId,
          type,
          userId,
          message: "Log stream started successfully",
          websocketEndpoint: "/logs",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error starting log stream:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start log stream",
        error: error.message,
      });
    }
  }

  /**
   * Stop log stream
   * DELETE /api/v1/logs/streams/:streamId
   */
  static async stopLogStream(req, res) {
    try {
      const { streamId } = req.params;
      const userId = req.user.id;

      // TODO: Verify user owns this stream or is admin
      const success = await logCollectorService.stopCollection(streamId);

      if (success) {
        res.json({
          success: true,
          data: {
            streamId,
            message: "Log stream stopped successfully",
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Stream not found or already stopped",
        });
      }
    } catch (error) {
      logger.error("Error stopping log stream:", error);
      res.status(500).json({
        success: false,
        message: "Failed to stop log stream",
        error: error.message,
      });
    }
  }

  /**
   * Receive logs from internal services
   * POST /api/v1/logs/internal/stream
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
        logsNamespace.emit("log:data", {
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

  /**
   * Cleanup old data
   * POST /api/v1/logs/cleanup
   */
  static async cleanupLogs(req, res) {
    try {
      await logCollectorService.cleanup();
      await metricsCollector.cleanup();

      res.json({
        success: true,
        message: "Log and metrics cleanup completed successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error during cleanup:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup logs and metrics",
        error: error.message,
      });
    }
  }
}

module.exports = LogsController;
