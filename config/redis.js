const redis = require("redis");

/**
 * Determines the Redis connection URL.
 * Uses REDIS_URL from environment if available.
 * Defaults to 'redis://redis:6379' if NODE_ENV is 'production' (Docker context).
 * Defaults to 'redis://localhost:6379' otherwise (local development context).
 * @returns {string} Redis connection URL
 */
const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return process.env.NODE_ENV === "production"
    ? "redis://redis:6379"
    : "redis://localhost:6379";
};

/**
 * Connect to Redis using the determined connection string
 * @returns {Promise<object>} Redis client
 */
const connectRedis = async () => {
  const redisUrl = getRedisUrl();
  console.log(`Attempting to connect to Redis at: ${redisUrl}`); // Log the URL being used

  const redisClient = redis.createClient({
    url: redisUrl,
    socket: {
      keepAlive: 5000, // Send TCP keepalive packets every 5 seconds
      connectTimeout: 10000, // Abort connection attempt after 10 seconds
    },
    // Performance optimizations
    disableOfflineQueue: true, // Don't queue commands when offline
  });

  redisClient.on("error", (err) => console.error("Redis Client Error:", err)); // Enhanced logging
  redisClient.on("connect", () => console.log("Connected to Redis"));
  redisClient.on("reconnecting", () => console.log("Reconnecting to Redis..."));

  try {
    await redisClient.connect();
  } catch (error) {
    console.error(`Failed to connect to Redis at ${redisUrl}:`, error); // Enhanced logging
    process.exit(1); // Exit if cannot connect to Redis
  }

  return redisClient;
};

module.exports = connectRedis;
