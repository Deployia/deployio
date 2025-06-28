const axios = require("axios");
const jwt = require("jsonwebtoken");
const logger = require("@config/logger");

// Agent Service configuration
const AGENT_URL = process.env.AGENT_URL || "http://localhost:8001";
const AGENT_TIMEOUT = 15000; // 15 seconds

// Create axios instance for Agent service
const agentServiceClient = axios.create({
  baseURL: AGENT_URL + "/agent/v1",
  timeout: AGENT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Service": "deployio-backend", // Internal service identification
  },
});

// Generate JWT token for Agent service communication (user or system context)
const generateAgentServiceToken = (user) => {
  // If user is provided, use user info; else, use a system/service identity
  if (user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } else {
    // System/service token (for backend-initiated requests)
    return jwt.sign(
      {
        id: "deployio_backend",
        email: "backend@deployio.com",
        username: "deployio-backend",
        type: "system",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
  }
};

// Add request interceptor to include Bearer token
agentServiceClient.interceptors.request.use((config) => {
  // Use user from config if provided, else use system token
  let token;
  if (config.user) {
    token = generateAgentServiceToken(config.user);
  } else {
    token = generateAgentServiceToken();
  }
  config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Add response interceptor for error handling
agentServiceClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error("Agent Service Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw error;
  }
);

module.exports = {
  agentServiceClient,
  generateAgentServiceToken,
};
