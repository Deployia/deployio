/**
 * System Metrics Service
 * Handles system metrics collection for backend, AI service, and agent
 */

const logger = require("@config/logger");
const mongoose = require("mongoose");
const { getRedisClient } = require("@config/redisClient");
const si = require("systeminformation");

class SystemMetricsService {
  static async getBackendMetrics() {
    const os = require("os");
    // Use systeminformation for accurate metrics
    let mem = {},
      cpu = {},
      processedCpuPercentage = 0;
    try {
      const [memInfo, cpuInfo, currentLoad] = await Promise.all([
        si.mem(),
        si.cpu(),
        si.currentLoad(),
      ]);
      mem = {
        used: Math.round((memInfo.active || memInfo.used) / 1024 / 1024), // MB
        total: Math.round(memInfo.total / 1024 / 1024), // MB
        free: Math.round(memInfo.free / 1024 / 1024), // MB
        usage: Math.round(
          ((memInfo.active || memInfo.used) / memInfo.total) * 100
        ), // %
      };
      cpu = {
        usage: Math.round(currentLoad.currentload), // total system CPU usage %
        process_usage: Math.round(process.cpuUsage().system / 1000 / 1000), // ms, rough process CPU usage
        user: Math.round(currentLoad.currentload_user),
        system: Math.round(currentLoad.currentload_system),
        cores: cpuInfo.cores,
        model: cpuInfo.brand || cpuInfo.manufacturer || "unknown",
      };
      processedCpuPercentage = Math.round(currentLoad.currentload);
    } catch (err) {
      // fallback to process values if systeminformation fails
      const memUsage = process.memoryUsage();
      mem = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      };
      cpu = { usage: 0, process_usage: 0 };
      processedCpuPercentage = 0;
    }

    // Check service health
    const mongoHealth =
      mongoose.connection.readyState === 1 ? "healthy" : "unhealthy";
    const redisClient = getRedisClient();
    const redisHealth =
      redisClient && redisClient.isReady ? "healthy" : "unhealthy";

    return {
      service: "backend",
      timestamp: new Date().toISOString(),
      status: "healthy",
      uptime: Math.round(process.uptime()),
      memory: mem,
      cpu: cpu,
      system: {
        activeHandles: process._getActiveHandles().length,
        activeRequests: process._getActiveRequests().length,
        eventLoopDelay: process.hrtime(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || "development",
        responseTime: 0, // Will be set by request timing if available
        architecture: process.arch,
        cores: cpu.cores || (os.cpus && os.cpus().length) || undefined,
        loadavg: os.loadavg(),
        uptime: os.uptime(),
      },
      services: {
        mongodb: { status: mongoHealth },
        redis: { status: redisHealth },
      },
      source: "internal",
      url: `http://localhost:${process.env.PORT || 5000}`,
    };
  }

  static async getAiServiceMetrics() {
    try {
      const axios = require("axios");
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";

      // Try to get metrics from AI service
      const response = await axios.get(`${aiServiceUrl}/service/v1/health`, {
        timeout: 5000,
      });

      // Extract metrics from health response
      const healthData = response.data;
      return {
        service: "ai-service",
        timestamp: new Date().toISOString(),
        status: healthData.status || "unknown",
        uptime: healthData.uptime || 0,
        memory: healthData.memory || { usage: 0, used: 0, total: 0 },
        cpu: healthData.cpu || { usage: 0, process_usage: 0 },
        system: {
          disk: healthData.disk || { usage: 0, free: 0, total: 0 },
          python_version: healthData.python_version || "unknown",
          responseTime: healthData.responseTime || 0,
        },
        services: {
          redis: healthData.services?.redis || { status: "unknown" },
        },
        requests: healthData.requests || { total: 0, active: 0 },
        url: aiServiceUrl,
        source: "external",
      };
    } catch (error) {
      return {
        service: "ai-service",
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        error: error.message,
        code: error.code || error.response?.status,
        url: process.env.AI_SERVICE_URL || "http://localhost:8000",
        source: "external",
        uptime: 0,
        memory: { usage: 0, used: 0, total: 0 },
        cpu: { usage: 0, process_usage: 0 },
        system: {
          disk: { usage: 0, free: 0, total: 0 },
          python_version: "unknown",
          responseTime: 0,
        },
        services: {
          redis: { status: "unknown" },
        },
      };
    }
  }

  static async getAgentMetrics() {
    try {
      const axios = require("axios");
      const agentUrl = process.env.AGENT_URL || "http://localhost:8001";

      // Try to get metrics from Agent service
      const response = await axios.get(`${agentUrl}/agent/v1/health`, {
        timeout: 5000,
      });

      // Extract metrics from health response
      const healthData = response.data;
      return {
        service: "agent",
        timestamp: new Date().toISOString(),
        status: healthData.status || "unknown",
        uptime: healthData.uptime || 0,
        memory: healthData.memory || { usage: 0, used: 0, total: 0 },
        cpu: healthData.cpu || { usage: 0, process_usage: 0 },
        system: {
          disk: healthData.disk || { usage: 0, free: 0, total: 0 },
          python_version: healthData.python_version || "unknown",
          environment: healthData.environment || "unknown",
          base_domain: healthData.base_domain || "unknown",
          docker: healthData.docker || { containers: 0 },
          responseTime: healthData.responseTime || 0,
        },
        services: {
          docker: healthData.services?.docker || { status: "unknown" },
          mongodb: healthData.services?.mongodb || { status: "unknown" },
          traefik: healthData.services?.traefik || { status: "unknown" },
        },
        url: agentUrl,
        source: "external",
      };
    } catch (error) {
      return {
        service: "agent",
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        error: error.message,
        code: error.code || error.response?.status,
        url: process.env.AGENT_URL || "http://localhost:8001",
        source: "external",
        uptime: 0,
        memory: { usage: 0, used: 0, total: 0 },
        cpu: { usage: 0, process_usage: 0 },
        system: {
          disk: { usage: 0, free: 0, total: 0 },
          python_version: "unknown",
          environment: "unknown",
          base_domain: "unknown",
          docker: { containers: 0 },
          responseTime: 0,
        },
        services: {
          docker: { status: "unknown" },
          mongodb: { status: "unknown" },
          traefik: { status: "unknown" },
        },
      };
    }
  }

  static async getServiceMetrics(serviceName) {
    switch (serviceName) {
      case "backend":
        return await this.getBackendMetrics();
      case "ai-service":
        return await this.getAiServiceMetrics();
      case "agent":
        return await this.getAgentMetrics();
      default:
        throw new Error("Invalid service name");
    }
  }
}

module.exports = SystemMetricsService;
