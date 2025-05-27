const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require("./routes/authRoutes");

// Import middleware
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// Define CORS options dynamically based on environment
const corsOptions = {
  origin:
    process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL_PROD,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow cookies to be sent with requests
};

// CORS middleware
app.use(cors(corsOptions));

// Rate limiting middleware (Limit to 100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

app.use(limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser middleware
app.use(cookieParser());

// Morgan logging (for dev and prod environments)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// MongoDB connection
const connectDB = require("./config/database");
connectDB();

// Mount routes
app.use("/api/v1/auth", authRoutes);

// Health check route
app.get("/api/v1/hello", (req, res) => {
  res.json({ message: "Hello from the backend! 💥⏳" });
});

// Cookie test route
app.get("/api/cookie-test", (req, res) => {
  res.json({
    message: "Cookie testing endpoint",
    cookies: req.cookies,
    hasCookie: !!req.cookies.token,
    authStatus: req.cookies.token
      ? "Authenticated via cookie"
      : "Not authenticated",
    tip: !req.cookies.token
      ? "Try logging in first to set the authentication cookie"
      : "You are successfully authenticated with cookies",
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
