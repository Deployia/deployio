const express = require("express");
const init = require("./config/init");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const routes = require("./routes");
require("./config/passport");

const app = express();

// Init (security, cors, rate limit, docs, passport, body, cookie, logging)
init(app);

// Routes
app.use("/api/v1", routes);

// Health check
app.get("/api/v1/hello", (req, res) => {
  res.json({ message: "Hello from the backend! 💥⏳" });
});

// Cookie test
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
