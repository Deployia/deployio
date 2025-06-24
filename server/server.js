// Initialize module aliases FIRST
require("module-alias/register");

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

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

  // Set up Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/ws/notifications",
  });

  // Make io available globally for notification services
  global.io = io;

  // Set up WebSocket authentication and connection handling
  const setupWebSocketAuth = require("./config/websocket");
  setupWebSocketAuth(io);

  // Start server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server ready at /ws/notifications`);
  });
})();
