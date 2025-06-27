/**
 * Metrics Collector Service
 * Handles system metrics collection and storage
 */

const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const logger = require("@config/logger");

class MetricsCollector extends EventEmitter {
  constructor() {
    super();
    this.metricsPath = path.join(__dirname, "..", "..", "logs", "metrics");
    this.currentMetricsFile = path.join(this.metricsPath, "current.json");
    this.historicalMetricsFile = path.join(this.metricsPath, "historical.json");
    this.collectionInterval = null;
    this.config = {
      collectionIntervalMs: 30000, // 30 seconds
      retentionHours: 24,
      maxHistoricalEntries: 1000,
    };

    this.ensureMetricsDirectory();
  }

  ensureMetricsDirectory() {
    if (!fs.existsSync(this.metricsPath)) {
      fs.mkdirSync(this.metricsPath, { recursive: true });
    }
  }

  async getMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: await this.getSystemMetrics(),
      services: await this.getServiceMetrics(),
    };

    // Store current metrics
    await this.storeCurrentMetrics(metrics);

    // Emit to WebSocket clients if available
    this.emitToWebSocket(metrics);

    return metrics;
  }

  emitToWebSocket(metrics) {
    try {
      const { getWebSocketManager } = require("@websockets");
      const webSocketManager = getWebSocketManager();
      const metricsNamespace = webSocketManager.getNamespace("/metrics");

      if (metricsNamespace) {
        metricsNamespace.emit("metrics:data", {
          type: "system",
          data: metrics,
          timestamp: metrics.timestamp,
        });
      }
    } catch (error) {
      // Silently fail if WebSocket is not available
      logger.debug("Failed to emit metrics to WebSocket:", error.message);
    }
  }

  async getSystemMetrics() {
    const os = require("os");

    return {
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      cpu: {
        cores: os.cpus().length,
        architecture: os.arch(),
      },
    };
  }

  async getServiceMetrics() {
    try {
      // Import system metrics service
      const SystemMetricsService = require("./SystemMetricsService");

      const services = {};

      // Get backend metrics
      try {
        services.backend = await SystemMetricsService.getBackendMetrics();
      } catch (error) {
        logger.warn("Failed to get backend metrics:", error.message);
        services.backend = {
          service: "backend",
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      // Get AI service metrics
      try {
        services["ai-service"] =
          await SystemMetricsService.getAiServiceMetrics();
      } catch (error) {
        logger.warn("Failed to get AI service metrics:", error.message);
        services["ai-service"] = {
          service: "ai-service",
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      // Get agent metrics
      try {
        services.agent = await SystemMetricsService.getAgentMetrics();
      } catch (error) {
        logger.warn("Failed to get agent metrics:", error.message);
        services.agent = {
          service: "agent",
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      return services;
    } catch (error) {
      logger.error("Error getting service metrics:", error);
      // Return fallback metrics
      return {
        backend: { status: "unknown", error: "Failed to collect metrics" },
        "ai-service": { status: "unknown", error: "Failed to collect metrics" },
        agent: { status: "unknown", error: "Failed to collect metrics" },
      };
    }
  }

  async storeCurrentMetrics(metrics) {
    try {
      await fs.promises.writeFile(
        this.currentMetricsFile,
        JSON.stringify(metrics, null, 2)
      );

      // Also add to historical data
      await this.addToHistoricalMetrics(metrics);
    } catch (error) {
      logger.error("Failed to store current metrics:", error);
    }
  }

  async addToHistoricalMetrics(metrics) {
    try {
      let historical = [];

      if (fs.existsSync(this.historicalMetricsFile)) {
        const data = await fs.promises.readFile(
          this.historicalMetricsFile,
          "utf8"
        );
        historical = JSON.parse(data);
      }

      historical.push(metrics);

      // Keep only recent entries
      if (historical.length > this.config.maxHistoricalEntries) {
        historical = historical.slice(-this.config.maxHistoricalEntries);
      }

      await fs.promises.writeFile(
        this.historicalMetricsFile,
        JSON.stringify(historical, null, 2)
      );
    } catch (error) {
      logger.error("Failed to add to historical metrics:", error);
    }
  }

  async getCurrentMetrics() {
    try {
      if (fs.existsSync(this.currentMetricsFile)) {
        const data = await fs.promises.readFile(
          this.currentMetricsFile,
          "utf8"
        );
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error("Failed to read current metrics:", error);
    }

    // Return fresh metrics if file doesn't exist or failed to read
    return await this.getMetrics();
  }

  async getHistoricalMetrics(options = {}) {
    const { hours = 1, maxEntries = 100 } = options;

    try {
      if (!fs.existsSync(this.historicalMetricsFile)) {
        return [];
      }

      const data = await fs.promises.readFile(
        this.historicalMetricsFile,
        "utf8"
      );
      const historical = JSON.parse(data);

      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      return historical
        .filter((entry) => new Date(entry.timestamp) > cutoffTime)
        .slice(-maxEntries);
    } catch (error) {
      logger.error("Failed to read historical metrics:", error);
      return [];
    }
  }

  startCollection() {
    if (this.collectionInterval) {
      return;
    }

    logger.info("Starting metrics collection", {
      intervalMs: this.config.collectionIntervalMs,
      retentionHours: this.config.retentionHours,
    });

    this.collectionInterval = setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        this.emit("metrics", metrics);
      } catch (error) {
        logger.error("Error during metrics collection:", error);
      }
    }, this.config.collectionIntervalMs);
  }

  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      logger.info("Stopped metrics collection");
    }
  }

  async cleanup() {
    const cutoffTime = new Date(
      Date.now() - this.config.retentionHours * 60 * 60 * 1000
    );

    try {
      if (fs.existsSync(this.historicalMetricsFile)) {
        const data = await fs.promises.readFile(
          this.historicalMetricsFile,
          "utf8"
        );
        const historical = JSON.parse(data);

        const filtered = historical.filter(
          (entry) => new Date(entry.timestamp) > cutoffTime
        );

        await fs.promises.writeFile(
          this.historicalMetricsFile,
          JSON.stringify(filtered, null, 2)
        );

        logger.info(
          `Cleaned up metrics: removed ${
            historical.length - filtered.length
          } old entries`
        );
      }
    } catch (error) {
      logger.error("Failed to cleanup historical metrics:", error);
    }
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

module.exports = {
  MetricsCollector,
  metricsCollector,
};
