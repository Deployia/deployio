/**
 * Log utilities that match the logger configuration exactly
 * This ensures we're looking in the right places for log files
 */

const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const logger = require("@config/logger");

const execPromise = util.promisify(exec);

/**
 * Helper function to get log file paths - matches logger configuration exactly
 */
function getServiceLogPaths(serviceType) {
  // Helper function from logger.js logic
  const getLogPath = (basePath, filename) => {
    // In Docker production, use /app/logs
    if (process.env.NODE_ENV === "production" && fs.existsSync("/app/logs")) {
      return path.join("/app/logs", filename);
    }
    // Default to relative logs directory
    return path.join(basePath, "logs", filename);
  };

  const logConfigs = {
    backend: {
      basePath: path.join(__dirname, "..", ".."), // server directory
      files: ["combined.log", "backend.log", "error.log"], // Try multiple files as per logger config
    },
    "ai-service": {
      basePath: path.join(__dirname, "..", "..", "..", "ai-service"), // ai-service directory
      files: ["ai-service.log", "error.log"], // From ai-service logger config
    },
    agent: {
      basePath: path.join(__dirname, "..", "..", "..", "agent"), // agent directory
      files: ["agent.log", "error.log"], // From agent logger config
    },
  };

  const config = logConfigs[serviceType];
  if (!config) {
    return null;
  }

  // Try each file in order until we find one that exists
  for (const filename of config.files) {
    const logPath = getLogPath(config.basePath, filename);
    if (fs.existsSync(logPath)) {
      return logPath;
    }
  }

  // Return the primary log path even if it doesn't exist (for error reporting)
  return getLogPath(config.basePath, config.files[0]);
}

/**
 * Parse a log line to extract relevant information
 */
function parseLogLine(line, serviceType) {
  try {
    // Try to parse as JSON first (production logs)
    if (line.trim().startsWith("{")) {
      const parsed = JSON.parse(line);
      return {
        parsed: true,
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level || "INFO",
        message: parsed.message || line,
      };
    }

    // Parse standard log format: timestamp - service - level - message
    const logRegex =
      /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s*-?\s*(\w+)?\s*-?\s*(\w+):\s*(.+)$/;
    const match = line.match(logRegex);

    if (match) {
      return {
        parsed: true,
        timestamp: match[1] || new Date().toISOString(),
        level: match[3] || "INFO",
        message: match[4] || line,
      };
    }

    // Fallback for unparseable lines
    return {
      parsed: false,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: line,
    };
  } catch (error) {
    return {
      parsed: false,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: line,
    };
  }
}

/**
 * Get recent logs for a specific service - simplified and robust
 */
async function getRecentServiceLogs(serviceType, lines = 50, level = "all") {
  try {
    const logPath = getServiceLogPaths(serviceType);

    if (!logPath) {
      return {
        error: `Unknown service type: ${serviceType}`,
        path: "N/A",
        logs: [],
      };
    }

    // Check if log file exists
    if (!fs.existsSync(logPath)) {
      logger.warn(`Log file not found for ${serviceType}: ${logPath}`);

      return {
        error: `Log file not found for ${serviceType}`,
        path: logPath,
        logs: [
          {
            id: `${serviceType}_${Date.now()}_0`,
            raw: `Log file not found: ${logPath}`,
            parsed: false,
            timestamp: new Date().toISOString(),
            level: "WARN",
            message: `Log file not found for ${serviceType}. Check logger configuration and ensure logs directory exists.`,
            service: serviceType,
          },
        ],
        note: "Log file not found - check service logger configuration",
      };
    }

    // Use tail command to get recent lines
    const command =
      process.platform === "win32"
        ? `powershell "Get-Content -Path '${logPath}' -Tail ${lines}"`
        : `tail -n ${lines} "${logPath}"`;

    const { stdout } = await execPromise(command);
    const logLines = stdout
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    // Parse and filter logs
    const parsedLogs = logLines.map((line, index) => {
      const parsed = parseLogLine(line, serviceType);
      return {
        id: `${serviceType}_${Date.now()}_${index}`,
        raw: line,
        parsed: parsed.parsed,
        timestamp: parsed.timestamp,
        level: parsed.level,
        message: parsed.message,
        service: serviceType,
      };
    });

    // Filter by level if specified
    const filteredLogs =
      level === "all"
        ? parsedLogs
        : parsedLogs.filter(
            (log) => log.level.toLowerCase() === level.toLowerCase()
          );

    return {
      logs: filteredLogs,
      totalLines: filteredLogs.length,
      filteredBy: level,
      path: logPath,
    };
  } catch (error) {
    logger.error(`Error reading logs for ${serviceType}:`, error);
    return {
      error: error.message,
      logs: [],
      totalLines: 0,
      path: "unknown",
    };
  }
}

/**
 * Get logs from Docker container (for production environment)
 */
async function getDockerServiceLogs(serviceType, lines = 50, level = "all") {
  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execPromise = util.promisify(exec);

    // Map service types to Docker container/service names
    const dockerServices = {
      "ai-service": "deployio-ai-service", // Adjust to your actual container name
      agent: "deployio-agent",
      backend: "deployio-backend",
    };

    const serviceName = dockerServices[serviceType];
    if (!serviceName) {
      throw new Error(`Unknown Docker service: ${serviceType}`);
    }

    // Try Docker Compose logs first, then Docker container logs
    let command;
    let source = "docker-compose";

    try {
      // Try docker-compose logs first (most common in production)
      command = `docker-compose logs --tail=${lines} ${serviceType}`;
      const { stdout } = await execPromise(command);

      if (stdout.trim()) {
        return parseDockerLogs(stdout, serviceType, source, level);
      }
    } catch (composeError) {
      // Fallback to docker logs
      source = "docker-container";
      command = `docker logs --tail=${lines} ${serviceName}`;

      try {
        const { stdout } = await execPromise(command);
        return parseDockerLogs(stdout, serviceType, source, level);
      } catch (containerError) {
        throw new Error(
          `Both docker-compose and docker logs failed: ${composeError.message}, ${containerError.message}`
        );
      }
    }
  } catch (error) {
    logger.error(`Error getting Docker logs for ${serviceType}:`, error);
    return {
      error: `Docker logs unavailable: ${error.message}`,
      logs: [],
      totalLines: 0,
      source: "docker-error",
    };
  }
}

/**
 * Parse Docker logs output
 */
function parseDockerLogs(stdout, serviceType, source, level = "all") {
  const logLines = stdout
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  const parsedLogs = logLines.map((line, index) => {
    // Docker logs format: service_name | timestamp log_content
    // or: timestamp container_name log_content

    let cleanLine = line;
    let timestamp = new Date().toISOString();

    // Remove Docker compose prefix (service_name |)
    const composeMatch = line.match(/^[\w-]+\s*\|\s*(.+)$/);
    if (composeMatch) {
      cleanLine = composeMatch[1];
    }

    // Extract timestamp if present
    const timestampMatch = cleanLine.match(
      /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[.\d]*[Z]?)\s+(.+)$/
    );
    if (timestampMatch) {
      timestamp = timestampMatch[1];
      cleanLine = timestampMatch[2];
    }

    // Parse the actual log content
    const parsed = parseLogLine(cleanLine, serviceType);

    return {
      id: `${serviceType}_docker_${Date.now()}_${index}`,
      raw: line,
      parsed: parsed.parsed,
      timestamp: parsed.timestamp || timestamp,
      level: parsed.level,
      message: parsed.message,
      service: serviceType,
      source: source,
    };
  });

  // Filter by level if specified
  const filteredLogs =
    level === "all"
      ? parsedLogs
      : parsedLogs.filter(
          (log) => log.level.toLowerCase() === level.toLowerCase()
        );

  return {
    logs: filteredLogs,
    totalLines: filteredLogs.length,
    filteredBy: level,
    source: source,
    path: "docker-logs",
  };
}

module.exports = {
  getServiceLogPaths,
  getRecentServiceLogs,
  parseLogLine,
  getDockerServiceLogs,
};
