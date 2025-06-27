/**
 * Metrics Controller
 * Handles all metrics-related HTTP requests
 */

const logger = require("@config/logger");
const { metricsCollector } = require("@services/logging/MetricsCollector");
const SystemMetricsService = require("@services/logging/SystemMetricsService");
const { getWebSocketManager } = require("@websockets");

class MetricsController {
  /**
   * Get metrics system status
   * GET /api/v1/metrics/status
   */
  static async getStatus(req, res) {
    try {
      const webSocketManager = getWebSocketManager();
      const metricsNamespace = webSocketManager.getNamespace("/metrics");

      const status = {
        websocket: {
          namespace: "/metrics",
          active: !!metricsNamespace,
          connectedClients: metricsNamespace
            ? metricsNamespace.sockets.size
            : 0,
        },
        collector: {
          running: !!metricsCollector.collectionInterval,
          intervalMs: metricsCollector.config.collectionIntervalMs,
          retentionHours: metricsCollector.config.retentionHours,
        },
        services: {
          supported: ["backend", "ai-service", "agent"],
        },
        user: {
          id: req.user.id,
          role: req.user.role,
          permissions: {
            systemMetrics: req.user.role === "admin",
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error("Error getting metrics system status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get metrics system status",
        error: error.message,
      });
    }
  }

  /**
   * Get current system metrics
   * GET /api/v1/metrics/system
   */
  static async getSystemMetrics(req, res) {
    try {
      const { service, type = "current" } = req.query;

      if (service) {
        // Get metrics for specific service
        let serviceMetrics;

        if (type === "current") {
          const allMetrics = await metricsCollector.getCurrentMetrics();
          serviceMetrics = allMetrics.services?.[service];

          if (!serviceMetrics) {
            // Fallback to direct service call
            serviceMetrics = await SystemMetricsService.getServiceMetrics(
              service
            );
          }
        } else if (type === "historical") {
          const hours = parseInt(req.query.hours) || 1;
          const historical = await metricsCollector.getHistoricalMetrics({
            hours,
            maxEntries: 100,
          });

          // Extract specific service from historical data
          serviceMetrics = historical
            .filter((entry) => entry.services?.[service])
            .map((entry) => ({
              timestamp: entry.timestamp,
              ...entry.services[service],
            }));
        }

        res.json({
          success: true,
          data: {
            service,
            type,
            metrics: serviceMetrics,
            streamingEndpoint: "/metrics (WebSocket)",
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // Get metrics for all services
        let allMetrics;

        if (type === "current") {
          allMetrics = await metricsCollector.getCurrentMetrics();
        } else if (type === "historical") {
          const hours = parseInt(req.query.hours) || 1;
          allMetrics = await metricsCollector.getHistoricalMetrics({
            hours,
            maxEntries: 100,
          });
        }

        res.json({
          success: true,
          data: {
            type,
            metrics: allMetrics,
            services: ["backend", "ai-service", "agent"],
            streamingEndpoint: "/metrics (WebSocket)",
          },
          timestamp: new Date().toISOString(),
        });
      }
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
   * Get metrics for specific system service
   * GET /api/v1/metrics/system/:service
   */
  static async getSystemServiceMetrics(req, res) {
    try {
      const { service } = req.params;
      const { type = "current", hours = 1 } = req.query;

      let serviceMetrics;

      if (type === "current") {
        const allMetrics = await metricsCollector.getCurrentMetrics();
        serviceMetrics = allMetrics.services?.[service];

        if (!serviceMetrics) {
          // Fallback to direct service call
          serviceMetrics = await SystemMetricsService.getServiceMetrics(
            service
          );
        }
      } else if (type === "historical") {
        const historical = await metricsCollector.getHistoricalMetrics({
          hours: parseInt(hours),
          maxEntries: 100,
        });

        // Extract specific service from historical data
        serviceMetrics = historical
          .filter((entry) => entry.services?.[service])
          .map((entry) => ({
            timestamp: entry.timestamp,
            ...entry.services[service],
          }));
      }

      res.json({
        success: true,
        data: {
          service,
          type,
          metrics: serviceMetrics,
          streamingEndpoint: "/metrics (WebSocket)",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        `Error getting metrics for service ${req.params.service}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: `Failed to get metrics for service ${req.params.service}`,
        error: error.message,
      });
    }
  }

  /**
   * Force metrics collection
   * POST /api/v1/metrics/collect
   */
  static async forceCollection(req, res) {
    try {
      const metrics = await metricsCollector.getMetrics();

      res.json({
        success: true,
        data: {
          metrics,
          message: "Metrics collected successfully",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error forcing metrics collection:", error);
      res.status(500).json({
        success: false,
        message: "Failed to collect metrics",
        error: error.message,
      });
    }
  }

  /**
   * Cleanup old metrics data
   * POST /api/v1/metrics/cleanup
   */
  static async cleanupMetrics(req, res) {
    try {
      await metricsCollector.cleanup();

      res.json({
        success: true,
        message: "Metrics cleanup completed successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error during metrics cleanup:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup metrics",
        error: error.message,
      });
    }
  }
}

module.exports = MetricsController;
