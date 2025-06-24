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
  const path = require("path");

  // Platform-agnostic log file detection
  const getLogPaths = (serviceName) => {
    const basePaths = {
      backend: [
        // Development paths
        path.join(process.cwd(), "logs", "combined.log"),
        path.join(process.cwd(), "server", "logs", "combined.log"),
        // Docker paths
        "/app/logs/combined.log",
        "/usr/src/app/logs/combined.log",
        // EC2 Ubuntu paths
        "/home/ubuntu/deployio/server/logs/combined.log",
        "/opt/deployio/server/logs/combined.log",
      ],
      "ai-service": [
        // Development paths
        path.join(process.cwd(), "..", "ai-service", "logs", "ai-service.log"),
        path.join(process.cwd(), "ai-service", "logs", "ai-service.log"),
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
    // Optimized log reading using streams for better performance
    const readRecentLines = async (filePath, numLines) => {
      const { spawn } = require("child_process");
      const { createReadStream } = require("fs");
      const { stat } = require("fs").promises;

      // First, try efficient platform-specific commands
      const useStreamingApproach = numLines > 1000; // Use streaming for large requests

      if (!useStreamingApproach) {
        // For smaller requests, use platform commands (fastest)
        return await readWithPlatformCommand(filePath, numLines);
      }

      // For larger requests, use efficient streaming approach
      return await readWithStreaming(filePath, numLines);
    };

    const readWithPlatformCommand = async (filePath, numLines) => {
      const { exec } = require("child_process");
      const util = require("util");
      const execPromise = util.promisify(exec);

      let command;

      if (process.platform === "win32") {
        // Optimized Windows PowerShell command
        command = `powershell -Command "Get-Content -Path '${filePath.replace(
          /'/g,
          "''"
        )}' -Tail ${numLines} -ReadCount 0"`;
      } else {
        // Unix-like systems - tail is very efficient
        command = `tail -n ${numLines} "${filePath}"`;
      }

      try {
        const { stdout } = await execPromise(command, {
          timeout: 30000, // 30 second timeout
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });
        return stdout;
      } catch (cmdError) {
        console.warn(`Platform command failed: ${cmdError.message}`);
        // Fallback to streaming approach
        return await readWithStreaming(filePath, numLines);
      }
    };

    const readWithStreaming = async (filePath, numLines) => {
      const readline = require("readline");
      const { createReadStream } = require("fs");
      const { stat } = require("fs").promises;

      try {
        const fileStats = await stat(filePath);
        const fileSize = fileStats.size;

        // For very large files, start reading from near the end
        const estimatedLineLength = 200; // Average log line length
        const estimatedBytesNeeded = numLines * estimatedLineLength;
        const startPosition = Math.max(0, fileSize - estimatedBytesNeeded * 2);

        const lines = [];
        const fileStream = createReadStream(filePath, {
          start: startPosition,
          encoding: "utf8",
        });

        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity,
        });

        for await (const line of rl) {
          lines.push(line);
        }

        // Return the last numLines
        const recentLines = lines.slice(-numLines);
        return recentLines.join("\n");
      } catch (streamError) {
        // Final fallback - read entire file (not recommended for large files)
        console.warn(
          `Streaming failed, using basic fallback: ${streamError.message}`
        );
        const fs = require("fs");
        const fileContent = await fs.promises.readFile(filePath, "utf8");
        const allLines = fileContent.split(/\r?\n/);
        const recentLines = allLines.slice(-numLines);
        return recentLines.join("\n");
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

async function getBackendMetrics() {
  return {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    eventLoopDelay: process.hrtime(),
    activeHandles: process._getActiveHandles().length,
    activeRequests: process._getActiveRequests().length,
  };
}

async function getAiServiceMetrics() {
  // This would call the AI service metrics endpoint
  return {
    note: "AI Service metrics would be fetched from external service",
  };
}

async function getAgentMetrics() {
  // This would call the Agent metrics endpoint
  return {
    note: "Agent metrics would be fetched from external service",
  };
}

module.exports = router;
