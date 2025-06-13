// config/redisClient.js
const redis = require("redis");

let redisClient = null;

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
 * Initialize Redis client (singleton)
 * @returns {Promise<object>} Redis client
 */
const initRedisClient = async () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = getRedisUrl();
  console.log(`Attempting to connect to Redis at: ${redisUrl}`);

  redisClient = redis.createClient({
    url: redisUrl,
    socket: {
      keepAlive: 5000, // Send TCP keepalive packets every 5 seconds
      connectTimeout: 10000, // Abort connection attempt after 10 seconds
    },
    // Performance optimizations
    disableOfflineQueue: true, // Don't queue commands when offline
  });

  redisClient.on("error", (err) => console.error("Redis Client Error:", err));
  redisClient.on("connect", () =>
    console.log("✅ Redis connected successfully")
  );
  redisClient.on("reconnecting", () => console.log("Reconnecting to Redis..."));

  try {
    await redisClient.connect();
    console.log(`✅ Redis Connected: ${redisUrl}`);
    return redisClient;
  } catch (error) {
    console.warn(`⚠️ Redis connection failed at ${redisUrl}:`, error.message);
    console.warn(
      "⚠️ Continuing without Redis - rate limiting will use memory store"
    );
    redisClient = null; // Reset to null so getRedisClient knows it's not available
    return null;
  }
};

/**
 * Get the Redis client instance
 * @returns {object|null} Redis client or null if not available
 */
const getRedisClient = () => {
  return redisClient; // Return null if not initialized or connection failed
};

/**
 * Close Redis connection
 */
const closeRedisClient = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

/**
 * Connect to Redis - similar pattern to connectDB
 * @returns {Promise<object|null>} Redis client or null if connection fails
 */
const connectRedis = async () => {
  try {
    const client = await initRedisClient();
    return client;
  } catch (error) {
    console.warn("⚠️ Redis connection failed:", error.message);
    console.warn(
      "⚠️ Continuing without Redis - rate limiting will use memory store"
    );
    return null;
  }
};

module.exports = {
  connectRedis,
  initRedisClient,
  getRedisClient,
  closeRedisClient,
};
