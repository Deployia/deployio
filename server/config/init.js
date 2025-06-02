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
      apis: ["./docs/*.js"],
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
  app.use(hpp());

  // CORS
  const corsOptions = {
    origin:
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
  app.use(cors(corsOptions));
};
