// config/init.js
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const compression = require("compression");

module.exports = (app) => {
  // Trust proxy - Only in production when behind reverse proxy (Traefik)
  // This allows Express to properly handle X-Forwarded-For headers for rate limiting
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", true);
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
    const start = Date.now();

    // Override res.end to set header before response is sent
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      const duration = Date.now() - start;

      // Only set header if not already sent
      if (!res.headersSent) {
        res.set("X-Response-Time", `${duration}ms`);
      }

      // Log slow requests in development
      if (process.env.NODE_ENV === "development" && duration > 500) {
        console.log(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
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

  // Swagger (only in local/development)
  if (process.env.NODE_ENV === "development") {
    const swaggerOptions = {
      definition: {
        openapi: "3.0.0",
        info: {
          title: "DeployIO API Docs",
          version: "1.0.0",
          description: "API documentation for DeployIO MERN Template",
        },
        servers: [{ url: "/" }],
      },
      apis: ["./docs/backend/*.js"],
    };
    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // Passport
  app.use(passport.initialize());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
  });
  app.use(limiter);

  // Body parser
  app.use(require("express").json());
  app.use(require("express").urlencoded({ extended: false }));

  // Cookie parser
  app.use(cookieParser());

  // Logging
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
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
          console.log(`CORS blocked origin: ${origin}`);
          console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
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
