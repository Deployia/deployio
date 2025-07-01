// Initialize module aliases FIRST
require("module-alias/register");

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");

// Load env vars
dotenv.config();

// MongoDB connection
const connectDB = require("./config/database");
connectDB();

// Redis connection and app startup
const { connectRedis } = require("./config/redisClient");

(async () => {
  // Connect to Redis first
  await connectRedis();

  // Import app after Redis is ready
  const app = require("./app");

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize WebSocket services
  const { initializeWebSockets } = require("./websockets");
  const io = initializeWebSockets(server, {
    features: {
      notifications: true,
      chat: false,
      logStreaming: true,
      metrics: true, // Enable metrics streaming
      agentBridge: true, // Enable agent bridge
      ai: true, // Enable AI service bridge
      deploymentLogs: false,
      systemMonitoring: false,
    },
  });

  // Graceful shutdown handling
  const { shutdownWebSockets } = require("./websockets");

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    shutdownWebSockets();
    server.close(() => {
      console.log("Server shut down successfully");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    shutdownWebSockets();
    server.close(() => {
      console.log("Server shut down successfully");
      process.exit(0);
    });
  });

  // Start server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket services ready`);
  });
})();
