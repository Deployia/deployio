// Health Service Routes - /health/service/*
// Detailed service monitoring with admin-protected logs

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../../middleware/authMiddleware");
const logger = require("../../config/logger");
const mongoose = require("mongoose");
const { getRedisClient } = require("../../config/redisClient");

/**
 * Get detailed service information (admin only)
 */
router.get("/:serviceName", protect, adminOnly, async (req, res) => {
  try {
    const { serviceName } = req.params;

    let serviceInfo;
    switch (serviceName) {
      case "backend":
        serviceInfo = await getBackendServiceDetails();
        break;
      case "ai-service":
        serviceInfo = await getAiServiceDetails();
        break;
      case "agent":
        serviceInfo = await getAgentServiceDetails();
        break;
      default:
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
    }

    res.json({
      success: true,
      data: serviceInfo,
    });
  } catch (error) {
    logger.error(
      `Error getting ${req.params.serviceName} service details:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to get service details",
      error: error.message,
    });
  }
});

/**
 * Get service logs (admin only)
 */
router.get("/:serviceName/logs", protect, adminOnly, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { lines = 100, level = "all" } = req.query;

    const logData = await getServiceLogs(serviceName, parseInt(lines), level);

    res.json({
      success: true,
      data: {
        service: serviceName,
        lines: logData.logs.length,
        logs: logData.logs,
        totalLines: logData.totalLines,
        logFile: logData.logFile,
      },
    });
  } catch (error) {
    logger.error(`Error getting ${req.params.serviceName} logs:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get service logs",
      error: error.message,
    });
  }
});

/**
 * Get service metrics (admin only)
 */
router.get("/:serviceName/metrics", protect, adminOnly, async (req, res) => {
  try {
    const { serviceName } = req.params;

    let metrics;
    switch (serviceName) {
      case "backend":
        metrics = await getBackendMetrics();
        break;
      case "ai-service":
        metrics = await getAiServiceMetrics();
        break;
      case "agent":
        metrics = await getAgentMetrics();
        break;
      default:
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error(`Error getting ${req.params.serviceName} metrics:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get service metrics",
      error: error.message,
    });
  }
});

// Helper functions for service details
async function getBackendServiceDetails() {
  const startTime = Date.now();

  // Database info
  const dbInfo = {
    status: mongoose.connection.readyState === 1 ? "healthy" : "unhealthy",
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
  };

  try {
    await mongoose.connection.db.admin().ping();
    dbInfo.responseTime = Date.now() - startTime;
  } catch (error) {
    dbInfo.error = error.message;
  }

  // Redis info
  const redisClient = getRedisClient();
  const redisInfo = {
    status: redisClient && redisClient.isReady ? "healthy" : "unhealthy",
    connected: redisClient ? redisClient.isReady : false,
  };

  if (redisClient) {
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      redisInfo.responseTime = Date.now() - redisStart;
    } catch (error) {
      redisInfo.error = error.message;
    }
  }

  return {
    service: "Express Backend",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    services: {
      database: dbInfo,
      redis: redisInfo,
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

async function getAiServiceDetails() {
  try {
    const axios = require("axios");
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const response = await axios.get(`${aiServiceUrl}/service/v1/health`, {
      timeout: 10000,
    });

    return {
      ...response.data,
      source: "external",
      url: aiServiceUrl,
    };
  } catch (error) {
    return {
      service: "FastAPI AI Service",
      status: "unhealthy",
      error: error.message,
      code: error.code || error.response?.status,
      source: "external",
      url: process.env.AI_SERVICE_URL || "http://localhost:8000",
    };
  }
}

async function getAgentServiceDetails() {
  try {
    const axios = require("axios");
    const agentUrl = process.env.AGENT_URL || "http://localhost:8001";

    const response = await axios.get(`${agentUrl}/agent/v1/health`, {
      timeout: 10000,
    });

    return {
      ...response.data,
      source: "external",
      url: agentUrl,
    };
  } catch (error) {
    return {
      service: "DeployIO Agent",
      status: "unhealthy",
      error: error.message,
      code: error.code || error.response?.status,
      source: "external",
      url: process.env.AGENT_URL || "http://localhost:8001",
    };
  }
}

async function getServiceLogs(serviceName, lines, level) {
  const fs = require("fs");
  const path = require("path"); // Platform-agnostic log file detection with standardized paths
  const getLogPaths = (serviceName) => {
    const basePaths = {
      backend: [
        // Development paths
        path.join(process.cwd(), "logs", "combined.log"),
        path.join(process.cwd(), "logs", "backend.log"),
        path.join(process.cwd(), "server", "logs", "combined.log"),
        // Docker paths
        "/app/logs/combined.log",
        "/app/logs/backend.log",
        "/usr/src/app/logs/combined.log",
        // EC2 Ubuntu paths
        "/home/ubuntu/deployio/server/logs/combined.log",
        "/opt/deployio/server/logs/combined.log",
      ],
      "ai-service": [
        // Development paths
        path.join(process.cwd(), "..", "ai-service", "logs", "ai-service.log"),
        path.join(process.cwd(), "ai-service", "logs", "ai-service.log"),
        path.join(process.cwd(), "logs", "ai-service.log"),
        // Docker paths
        "/app/logs/ai-service.log",
        "/usr/src/app/logs/ai-service.log",
        // EC2 Ubuntu paths
        "/home/ubuntu/deployio/ai-service/logs/ai-service.log",
        "/opt/deployio/ai-service/logs/ai-service.log",
      ],
      agent: [
        // Development paths
        path.join(process.cwd(), "..", "agent", "logs", "agent.log"),
        path.join(process.cwd(), "agent", "logs", "agent.log"),
        path.join(process.cwd(), "logs", "agent.log"),
        // Docker paths
        "/app/logs/agent.log",
        "/usr/src/app/logs/agent.log",
        // EC2 Ubuntu paths (may be on different instance)
        "/home/ubuntu/deployio/agent/logs/agent.log",
        "/opt/deployio/agent/logs/agent.log",
      ],
    };
    return basePaths[serviceName] || [];
  };

  // Find the first existing log file
  const findLogFile = (serviceName) => {
    const paths = getLogPaths(serviceName);
    for (const logPath of paths) {
      if (fs.existsSync(logPath)) {
        return logPath;
      }
    }
    return null;
  };

  const logFile = findLogFile(serviceName);
  if (!logFile) {
    return {
      logs: [],
      totalLines: 0,
      logFile: `No log file found for ${serviceName}`,
      error: `Log file not found. Searched paths: ${getLogPaths(
        serviceName
      ).join(", ")}`,
      searchedPaths: getLogPaths(serviceName),
    };
  }
  try {
    // Highly optimized log reading for fast response
    const readRecentLines = async (filePath, numLines) => {
      const fs = require("fs");
      const { stat } = require("fs").promises;

      try {
        // Get file size for optimization decisions
        const fileStats = await stat(filePath);
        const fileSize = fileStats.size;

        // For small files (< 1MB), read entirely
        if (fileSize < 1024 * 1024) {
          const content = await fs.promises.readFile(filePath, "utf8");
          const lines = content.split(/\r?\n/).filter((line) => line.trim());
          return lines.slice(-numLines).join("\n");
        }

        // For larger files, use optimized tail approach
        return await readWithOptimizedTail(filePath, numLines, fileSize);
      } catch (error) {
        logger.warn(
          `Optimized read failed: ${error.message}, falling back to basic read`
        );
        // Fallback to basic read for small number of lines
        return await readWithBasicFallback(filePath, Math.min(numLines, 100));
      }
    };

    const readWithOptimizedTail = async (filePath, numLines, fileSize) => {
      const fs = require("fs");

      // Estimate bytes needed (average 150 chars per line)
      const estimatedBytesPerLine = 150;
      const bytesToRead = Math.min(
        numLines * estimatedBytesPerLine * 2,
        fileSize
      );
      const startPosition = Math.max(0, fileSize - bytesToRead);

      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath, {
          start: startPosition,
          encoding: "utf8",
        });

        let buffer = "";
        const timeout = setTimeout(() => {
          stream.destroy();
          reject(new Error("Read timeout"));
        }, 5000); // 5 second timeout

        stream.on("data", (chunk) => {
          buffer += chunk;
        });

        stream.on("end", () => {
          clearTimeout(timeout);
          const lines = buffer.split(/\r?\n/).filter((line) => line.trim());
          const recentLines = lines.slice(-numLines);
          resolve(recentLines.join("\n"));
        });

        stream.on("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    };

    const readWithBasicFallback = async (filePath, numLines) => {
      const fs = require("fs");
      const { exec } = require("child_process");
      const util = require("util");
      const execPromise = util.promisify(exec);

      try {
        let command;
        if (process.platform === "win32") {
          // Use PowerShell for Windows with timeout
          command = `powershell -Command "& {$ErrorActionPreference='Stop'; Get-Content -Path '${filePath.replace(
            /'/g,
            "''"
          )}' -Tail ${numLines} -ReadCount 0}"`;
        } else {
          // Use tail for Unix-like systems
          command = `tail -n ${numLines} "${filePath}"`;
        }

        const { stdout } = await execPromise(command, {
          timeout: 3000, // 3 second timeout
          maxBuffer: 5 * 1024 * 1024, // 5MB buffer
        });

        return stdout;
      } catch (cmdError) {
        // Final fallback - read just last part of file
        const fs = require("fs");
        const fileContent = await fs.promises.readFile(filePath, "utf8");
        const lines = fileContent.split(/\r?\n/).filter((line) => line.trim());
        return lines.slice(-Math.min(numLines, 50)).join("\n"); // Limit to 50 lines max for fallback
      }
    };

    const stdout = await readRecentLines(logFile, lines);
    const logLines = stdout
      .trim()
      .split(/\r?\n/)
      .filter((line) => line.trim());

    // Parse and filter logs with better timestamp extraction
    let filteredLogs = logLines.map((line, index) => {
      const parsed = parseLogLine(line, serviceName);
      return {
        id: `${serviceName}_${Date.now()}_${index}`,
        timestamp: parsed.timestamp || new Date().toISOString(),
        raw: line,
        level: parsed.level || "INFO",
        message: parsed.message || line,
        service: serviceName,
        parsed: parsed.parsed || false,
      };
    });

    // Filter by level if specified
    if (level !== "all") {
      filteredLogs = filteredLogs.filter(
        (log) => log.level.toLowerCase() === level.toLowerCase()
      );
    }

    return {
      logs: filteredLogs,
      totalLines: logLines.length,
      logFile,
      platform: process.platform,
      foundAt: logFile,
      optimized: true,
    };
  } catch (error) {
    logger.error(`Error reading logs for ${serviceName}:`, error);
    return {
      logs: [],
      totalLines: 0,
      logFile,
      error: error.message,
      platform: process.platform,
    };
  }
}

function parseLogLine(line, serviceName) {
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
    switch (serviceName) {
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
        // Uvicorn format: INFO:     message or with timestamp
        const uvicornMatch = line.match(/^(\w+):\s+(.+)$/);
        if (uvicornMatch) {
          return {
            parsed: true,
            level: uvicornMatch[1],
            message: uvicornMatch[2],
          };
        }

        // Alternative format with timestamp
        const timestampedMatch = line.match(
          /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\w+)\s+(.+)$/
        );
        if (timestampedMatch) {
          return {
            parsed: true,
            timestamp: new Date(timestampedMatch[1]).toISOString(),
            level: timestampedMatch[2],
            message: timestampedMatch[3],
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

async function getServiceMetrics(serviceName) {
  switch (serviceName) {
    case "backend":
      return await getBackendMetrics();
    case "ai-service":
      return await getAiServiceMetrics();
    case "agent":
      return await getAgentMetrics();
    default:
      throw new Error("Invalid service name");
  }
}

async function getBackendMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

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
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100), // %
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
      system: Math.round(cpuUsage.system / 1000),
      usage: Math.round(((cpuUsage.user + cpuUsage.system) / 1000000) * 100), // rough CPU %
      process_usage: Math.round(
        ((cpuUsage.user + cpuUsage.system) / 1000000) * 100
      ), // alias for compatibility
    },
    system: {
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length,
      eventLoopDelay: process.hrtime(),
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
      responseTime: 0, // Will be set by request timing if available
    },
    services: {
      mongodb: { status: mongoHealth },
      redis: { status: redisHealth },
    },
    source: "internal",
    url: `http://localhost:${process.env.PORT || 5000}`,
  };
}

async function getAiServiceMetrics() {
  try {
    const axios = require("axios");
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

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

async function getAgentMetrics() {
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

// Export functions for WebSocket use
module.exports = router;
module.exports.getServiceMetrics = getServiceMetrics;
module.exports.getBackendMetrics = getBackendMetrics;
module.exports.getAiServiceMetrics = getAiServiceMetrics;
module.exports.getAgentMetrics = getAgentMetrics;
