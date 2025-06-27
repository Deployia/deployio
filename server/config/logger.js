const winston = require("winston");
const path = require("path");
const fs = require("fs");

const { combine, timestamp, printf, colorize, align, json } = winston.format;

// Determine log level based on environment
const level = process.env.NODE_ENV === "production" ? "warn" : "info";

// Ensure logs directory exists
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// For Docker environment, also try to create /app/logs
const dockerLogsDir = "/app/logs";
if (process.env.NODE_ENV === "production") {
  try {
    if (!fs.existsSync(dockerLogsDir)) {
      fs.mkdirSync(dockerLogsDir, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create Docker logs directory:", err.message);
  }
}

// Custom log format
const logFormat = printf(
  ({ level, message, timestamp, stack, service, ...metadata }) => {
    let log = `${timestamp} [${service || "application"}] ${level}: ${message}`;
    if (stack) {
      log = `${log}\\n${stack}`;
    }
    // Add any additional metadata
    if (Object.keys(metadata).length) {
      // Remove morgan's internal properties if they exist
      const { 0: morganTokens, 1: req, 2: res, ...restMeta } = metadata;
      if (Object.keys(restMeta).length) {
        log += ` ${JSON.stringify(restMeta)}`;
      }
    }
    return log;
  }
);

// Determine log file paths based on environment
const getLogPath = (filename) => {
  // In Docker production, use /app/logs
  if (process.env.NODE_ENV === "production" && fs.existsSync("/app/logs")) {
    return path.join("/app/logs", filename);
  }
  // Default to relative logs directory
  return path.join(__dirname, "..", "logs", filename);
};

const transports = [
  new winston.transports.Console({
    level: level,
    format: combine(
      colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      align(),
      logFormat
    ),
  }),
];

if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.File({
      filename: getLogPath("error.log"),
      level: "error",
      format: combine(timestamp(), json()), // Store errors in JSON format
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: getLogPath("combined.log"),
      level: "info", // Log info and above to this file in production
      format: combine(timestamp(), json()), // Store combined logs in JSON format
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: getLogPath("backend.log"),
      level: "info", // Alternative log file name for backend service
      format: combine(timestamp(), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
} else {
  // For development, create the same log files as production but with more verbose logging
  transports.push(
    new winston.transports.File({
      filename: getLogPath("error.log"),
      level: "error",
      format: combine(timestamp(), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: getLogPath("combined.log"),
      level: "debug", // Log everything in development
      format: combine(timestamp(), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: getLogPath("backend.log"),
      level: "debug", // Alternative log file name for backend service
      format: combine(timestamp(), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

const logger = winston.createLogger({
  level: level, // Minimum log level to be processed
  defaultMeta: { service: "backend-express" }, // Default metadata
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }), // Log stack traces
    json() // Default to JSON format for transports that don't override
  ),
  transports: transports,
  exitOnError: false, // Do not exit on handled exceptions
});

// Log that the logger has been initialized (helps verify logging is working)
logger.info("Logger initialized", {
  environment: process.env.NODE_ENV || "development",
  logLevel: level,
  transports: transports.map((t) => ({
    type: t.constructor.name,
    filename: t.filename || "console",
    level: t.level,
  })),
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: (message) => {
    // Morgan typically logs with a newline at the end, remove it
    // Also, morgan passes additional arguments that we might not want directly in the message
    // The actual log message from morgan is the first part of the string.
    // We'll let winston handle the formatting.
    logger.info(message.trim());
  },
};

// Performance logging utility
logger.logPerformance = (startTime, routeName, method, statusCode) => {
  const endTime = process.hrtime(startTime);
  const durationInMs = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(3);
  logger.info(
    `Performance: ${method} ${routeName} - ${statusCode} - ${durationInMs}ms`
  );
};

module.exports = logger;
