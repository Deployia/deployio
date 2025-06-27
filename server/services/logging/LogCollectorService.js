/**
 * Refactored Log Collector Service
 * Clean service layer managing different log collectors
 */

const EventEmitter = require("events");
const logger = require("@config/logger");
const SystemLogCollector = require("./collectors/SystemLogCollector");
const AgentLogCollector = require("./collectors/AgentLogCollector");

class LogCollectorService extends EventEmitter {
  constructor() {
    super();
    this.collectors = new Map();
    this.activeStreams = new Map();
    this.config = {
      maxLines: 1000,
      retentionHours: 24,
      bufferSize: 100,
    };
  }

  /**
   * Initialize the log collector service
   */
  initialize() {
    logger.info("Initializing Unified Log Collector Service");

    // Register system service collectors
    this.registerCollector("backend", new SystemLogCollector("backend"));
    this.registerCollector("ai-service", new SystemLogCollector("ai-service"));
    this.registerCollector("agent", new AgentLogCollector());

    logger.info("Log Collector Service initialized successfully");
  }

  /**
   * Register a log collector for a specific service
   */
  registerCollector(serviceId, collector) {
    this.collectors.set(serviceId, collector);

    // Forward collector events
    collector.on("log", (logEntry) => {
      this.emit("log", { serviceId, ...logEntry });
    });

    collector.on("error", (error) => {
      this.emit("error", { serviceId, error });
    });

    logger.info(`Registered log collector for service: ${serviceId}`);
  }

  /**
   * Start collecting logs for a specific service
   */
  async startCollection(serviceId, options = {}) {
    logger.debug("Starting log collection", {
      serviceId,
      options,
      availableCollectors: Array.from(this.collectors.keys()),
    });

    const collector = this.collectors.get(serviceId);
    if (!collector) {
      const availableServices = Array.from(this.collectors.keys());
      logger.error(`No collector registered for service: ${serviceId}`, {
        serviceId,
        availableServices,
        collectorCount: this.collectors.size,
      });
      throw new Error(
        `No collector registered for service: ${serviceId}. Available services: ${availableServices.join(
          ", "
        )}`
      );
    }

    // Use clientStreamId if provided, otherwise generate internal streamId
    const streamId = options.clientStreamId || `${serviceId}_${Date.now()}`;

    this.activeStreams.set(streamId, {
      serviceId,
      collector,
      startTime: new Date(),
      options,
      isClientStream: !!options.clientStreamId,
    });

    try {
      await collector.start(options);
      logger.info(`Started log collection for service: ${serviceId}`, {
        streamId,
        isClientStream: !!options.clientStreamId,
      });
      return streamId;
    } catch (error) {
      this.activeStreams.delete(streamId);
      throw error;
    }
  }

  /**
   * Stop collecting logs for a specific service
   */
  async stopCollection(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return false;
    }

    try {
      await stream.collector.stop();
      this.activeStreams.delete(streamId);
      logger.info(`Stopped log collection for stream: ${streamId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error stopping log collection for stream ${streamId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get recent logs for a service
   */
  async getRecentLogs(serviceId, options = {}) {
    const collector = this.collectors.get(serviceId);
    if (!collector) {
      throw new Error(`No collector registered for service: ${serviceId}`);
    }

    return await collector.getRecentLogs(options);
  }

  /**
   * Get deployment logs (user-specific)
   */
  async getDeploymentLogs(deploymentId, options = {}) {
    // This will be implemented when we add deployment log collectors
    throw new Error("Deployment log collection not yet implemented");
  }

  /**
   * Clean up old logs and inactive streams
   */
  async cleanup() {
    const now = new Date();
    const cutoffTime = new Date(
      now.getTime() - this.config.retentionHours * 60 * 60 * 1000
    );

    // Clean up inactive streams
    for (const [streamId, stream] of this.activeStreams) {
      if (stream.startTime < cutoffTime) {
        await this.stopCollection(streamId);
        logger.info(`Cleaned up inactive stream: ${streamId}`);
      }
    }

    // Clean up collectors
    for (const collector of this.collectors.values()) {
      if (collector.cleanup) {
        await collector.cleanup(cutoffTime);
      }
    }
  }

  /**
   * Get status of all collectors
   */
  getStatus() {
    const status = {
      activeStreams: this.activeStreams.size,
      collectors: {},
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    for (const [serviceId, collector] of this.collectors) {
      status.collectors[serviceId] = {
        type: collector.constructor.name,
        status: collector.isActive ? "active" : "inactive",
        lastActivity: collector.lastActivity || null,
      };
    }

    return status;
  }

  /**
   * Get list of available service collectors
   */
  getAvailableServices() {
    return Array.from(this.collectors.keys());
  }

  /**
   * Check if a collector is registered for a service
   */
  hasCollector(serviceId) {
    return this.collectors.has(serviceId);
  }
}

// Create singleton instance
const logCollectorService = new LogCollectorService();

module.exports = {
  LogCollectorService,
  logCollectorService,
};
