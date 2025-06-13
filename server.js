const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load env vars
dotenv.config();

// MongoDB connection
const connectDB = require("./config/database");
connectDB();

// Redis connection
const connectRedis = require("./config/redis"); // Import new Redis config
let redisClient;

(async () => {
  redisClient = await connectRedis();
  app.set("redisClient", redisClient); // Set redisClient in app context after connection
})();

const app = require("./app");

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
