// Initialize module aliases FIRST
require("module-alias/register");

const dotenv = require("dotenv");
const mongoose = require("mongoose");

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

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
