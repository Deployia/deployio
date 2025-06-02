const express = require("express");
const init = require("./config/init");
const errorHandler = require("./middleware/errorMiddleware");
const routes = require("./routes");
require("./config/passport");
const mongoose = require("mongoose"); // Import mongoose

const app = express();

// Init (security, cors, rate limit, docs, passport, body, cookie, logging)
init(app);

// Routes
app.use("/api/v1", routes);

// Health check
app.get("/api/v1/health", async (req, res) => {
  let mongoStatus = "disconnected";
  try {
    // Check Mongoose connection state
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) {
      // Optional: perform a quick ping or lightweight query to be absolutely sure
      // await mongoose.connection.db.admin().ping();
      mongoStatus = "connected";
    } else {
      // Attempt to log current state if not connected for debugging
      console.log(
        `MongoDB connection state: ${mongoose.connection.readyState}`
      );
    }
  } catch (error) {
    console.error("MongoDB health check failed:", error.message);
    mongoStatus = "error";
  }
  res.json({
    service_name: "Node.js Server",
    status: "ok",
    mongodb_status: mongoStatus,
    // message: "Hello from the backend! 💥⏳" // Original message, can be kept or removed
  });
});

// Cookie test
app.get("/api/v1/cookie-test", (req, res) => {
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

// Error handling
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

module.exports = app;
