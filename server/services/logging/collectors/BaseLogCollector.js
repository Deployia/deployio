/**
 * Base Log Collector Class
 * Abstract base class for all log collectors
 */

const EventEmitter = require("events");
const logger = require("@config/logger");

class BaseLogCollector extends EventEmitter {
  constructor(serviceId) {
    super();
    this.serviceId = serviceId;
    this.isActive = false;
    this.lastActivity = null;
    this.buffer = [];
  }

  async start(options = {}) {
    this.isActive = true;
    this.lastActivity = new Date();
  }

  async stop() {
    this.isActive = false;
  }

  standardizeLogEntry(entry) {
    // Generate a stable ID: use timestamp+message hash if available, else fallback
    let id;
    if (entry.timestamp && entry.message) {
      const hash =
        String(entry.timestamp) + ":" + String(entry.message).slice(0, 100);
      id = Buffer.from(hash).toString("base64");
    } else {
      id = `${this.serviceId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }
    return {
      id,
      timestamp: entry.timestamp || new Date().toISOString(),
      level: (entry.level || "info").toLowerCase(),
      message: entry.message || "",
      service: this.serviceId,
      source: entry.source || "unknown",
      metadata: entry.metadata || {},
      raw: entry.raw || entry.message,
    };
  }

  emitLog(entry) {
    const standardized = this.standardizeLogEntry(entry);
    this.lastActivity = new Date();

    this.emit("log", standardized);
  }

  async cleanup(cutoffTime) {
    // Override in subclasses if needed
  }
}

module.exports = BaseLogCollector;
