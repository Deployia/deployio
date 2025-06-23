const axios = require("axios");
const jwt = require("jsonwebtoken");
const logger = require("@config/logger");

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICE_TIMEOUT = 30000; // 30 seconds

// Create axios instance for AI service
const aiServiceClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_SERVICE_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Service": "deployio-backend", // Internal service identification
  },
});

// Add request interceptor to include JWT token
aiServiceClient.interceptors.request.use((config) => {
  // Add any additional headers or auth tokens here
  return config;
});

// Add response interceptor for error handling
aiServiceClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error("AI Service Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw error;
  }
);

// Generate JWT token for AI service communication
const generateAiServiceToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// Generate demo JWT token for public endpoints (heavily rate limited)
const generateDemoToken = () => {
  return jwt.sign(
    {
      id: "demo_user",
      email: "demo@deployio.com",
      username: "demo",
      type: "demo",
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Short expiry for demo tokens
  );
};

// Check AI service health
const checkAiServiceHealth = async () => {
  try {
    const response = await aiServiceClient.get("/analysis/health");
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      data: response.data.data,
    };
  } catch (error) {
    logger.error("AI service health check failed:", error.message);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Get detailed AI service health
const getDetailedAiServiceHealth = async () => {
  try {
    const response = await aiServiceClient.get("/analysis/health/detailed");
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      data: response.data.data,
    };
  } catch (error) {
    logger.error("AI service detailed health check failed:", error.message);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  aiServiceClient,
  generateAiServiceToken,
  generateDemoToken,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,
};
