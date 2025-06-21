const express = require("express");
const init = require("./config/init");
const errorHandler = require("./middleware/errorMiddleware");
const routes = require("./routes");
require("./config/passport");

const app = express();

// Init (security, cors, rate limit, docs, passport, body, cookie, logging)
init(app);

// Routes
app.use("/", routes);

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
