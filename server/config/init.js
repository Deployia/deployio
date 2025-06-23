// config/init.js
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const compression = require("compression");
const logger = require("./logger");
const connectDB = require("./database"); // Import connectDB
const {
  getRateLimiters,
  bypassHealthChecks,
  debugRateLimit,
  addRateLimitHeaders,
} = require("../middleware/rateLimitMiddleware");

module.exports = (app) => {
  // Connect to the database and log the host
  connectDB().then((conn) => {
    if (conn) {
      logger.info(
        `Backend successfully connected to MongoDB at ${conn.connection.host}`
      );
    }
  });

  // Trust proxy configuration - Critical for rate limiting behind reverse proxy
  // This must be configured BEFORE any rate limiting middleware
  if (process.env.NODE_ENV === "production") {
    // In production, check if we should trust proxy
    const trustProxy = process.env.TRUST_PROXY === "true";
    app.set("trust proxy", trustProxy);

    if (trustProxy) {
      logger.info(
        "Trust proxy enabled - IP detection will use X-Forwarded-For headers"
      );
    } else {
      logger.warn(
        "Trust proxy disabled in production - rate limiting may not work correctly behind reverse proxy"
      );
    }
  } else {
    // In development, typically no reverse proxy
    app.set("trust proxy", process.env.TRUST_PROXY === "true");
  }

  // Enable gzip compression for better performance
  app.use(
    compression({
      threshold: 1024, // Only compress files larger than 1KB
      level: 6, // Compression level (1-9, 6 is good balance)
      filter: (req, res) => {
        // Don't compress responses if the cache control is 'no-transform'
        if (
          res.getHeader("Cache-Control") &&
          res.getHeader("Cache-Control").includes("no-transform")
        ) {
          return false;
        }
        // Default compression
        return compression.filter(req, res);
      },
    })
  ); // Response time header for performance monitoring
  app.use((req, res, next) => {
    const start = process.hrtime(); // Use process.hrtime() for more precise timing
    const originalEnd = res.end;

    res.end = function (chunk, encoding) {
      const endTime = process.hrtime(start);
      const durationInMs = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(3);

      // Log performance using the logger utility
      logger.logPerformance(start, req.path, req.method, res.statusCode);

      if (!res.headersSent) {
        res.set("X-Response-Time", `${durationInMs}ms`);
      }

      if (parseFloat(durationInMs) > 500) {
        logger.warn(
          `Slow request: ${req.method} ${req.path} - ${res.statusCode} - ${durationInMs}ms`
        );
      }
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  });

  // Cache headers for static content
  app.use((req, res, next) => {
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
    }
    next();
  });
  // Modern Swagger Documentation System (FastAPI-like)
  if (process.env.NODE_ENV === "development") {
    const swaggerOptions = require("./swagger");
    const swaggerSpec = swaggerJsdoc(swaggerOptions);

    // Custom CSS for better UI
    const customCss = `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin-bottom: 30px; }
      .swagger-ui .info .title { font-size: 36px; color: #3b82f6; }
      .swagger-ui .info .description { font-size: 16px; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #f8fafc; border: 1px solid #e2e8f0; }
      .swagger-ui .opblock .opblock-summary { border-left: 4px solid #3b82f6; }
      .swagger-ui .btn.authorize { background-color: #3b82f6; border-color: #3b82f6; }
      .swagger-ui .btn.authorize:hover { background-color: #2563eb; }
    `;

    app.use(
      "/api/v1/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss,
        customSiteTitle: "DeployIO API Documentation",
        customfavIcon: "/favicon.ico",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          docExpansion: "none",
          filter: true,
          showExtensions: true,
          tryItOutEnabled: true,
        },
      })
    );

    logger.info("📚 Swagger documentation available at /api/v1/docs");
  } // Passport
  app.use(passport.initialize());

  // Add debugging middleware for rate limiting in development
  if (process.env.NODE_ENV === "development") {
    app.use(debugRateLimit);
    app.use(addRateLimitHeaders);
  }
  // Rate limiting - Apply global rate limiting with health check bypass
  app.use(bypassHealthChecks);
  app.use(getRateLimiters().general);

  // Body parser
  app.use(require("express").json());
  app.use(require("express").urlencoded({ extended: false }));

  // Cookie parser
  app.use(cookieParser());

  // Logging - Replace morgan's default console logging with Winston
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev", { stream: logger.stream }));
  } else {
    app.use(morgan("combined", { stream: logger.stream }));
  }

  // Security
  app.use(helmet());
  app.use(hpp()); // CORS - Environment-specific configuration for security
  const corsOptions = {
    origin: function (origin, callback) {
      // Define allowed origins based on environment
      // More robust environment detection - handle various edge cases
      const nodeEnv = String(process.env.NODE_ENV || "development")
        .toLowerCase()
        .trim()
        .replace(/['"#\s].*/g, ""); // Remove comments and quotes

      const isDevelopment =
        nodeEnv === "development" ||
        nodeEnv === "dev" ||
        nodeEnv !== "production";

      const allowedOrigins = isDevelopment
        ? [
            process.env.FRONTEND_URL_DEV || "http://localhost:5173",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
          ]
        : [
            process.env.FRONTEND_URL_PROD,
            // NEVER include localhost in production for security
          ];

      // Allow requests with no origin (mobile apps, Postman, health checks, etc.)
      // In development: allow all no-origin requests
      // In production: allow no-origin requests for health checks and internal services
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Log blocked origins in development for debugging
        if (isDevelopment) {
          logger.warn(
            `CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(
              ", "
            )}`
          );
        }
        callback(new Error("Not allowed by CORS policy"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));
};
