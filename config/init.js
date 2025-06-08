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

module.exports = (app) => {
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
      const allowedOrigins =
        process.env.NODE_ENV === "development"
          ? [
              process.env.FRONTEND_URL_DEV,
              "http://localhost:5173",
              "http://localhost:3000",
              "http://localhost:8000",
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
