const aiChatService = require("../../services/ai/aiChatService");
const { validationResult } = require("express-validator");

/**
 * Business chatbot controller - Public access
 * Handles customer support and sales inquiries
 */
const businessChat = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { message, sessionId } = req.body;

    // Call AI service
    const response = await aiChatService.businessChat(message, sessionId);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Business chat error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process chat request",
      error: error.message,
    });
  }
};

/**
 * DevOps chatbot controller - Authenticated access only
 * Handles technical support and DevOps guidance
 */
const devOpsChat = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { message, context } = req.body;

    // Add user context if available
    const enhancedContext = {
      ...context,
      user: req.user
        ? {
            id: req.user._id,
            username: req.user.username,
          }
        : null,
    };

    // Call AI service
    const response = await aiChatService.devOpsChat(message, enhancedContext);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("DevOps chat error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process DevOps chat request",
      error: error.message,
    });
  }
};

/**
 * Reset business chat conversation
 */
const resetBusinessConversation = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const response = await aiChatService.resetBusinessConversation(sessionId);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Reset conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset conversation",
      error: error.message,
    });
  }
};

/**
 * Get business chat welcome message
 */
const getBusinessWelcome = async (req, res) => {
  try {
    const response = await aiChatService.getBusinessWelcome();

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get welcome message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get welcome message",
      error: error.message,
    });
  }
};

/**
 * Get chatbot services health status
 */
const getChatbotHealth = async (req, res) => {
  try {
    const response = await aiChatService.getChatbotHealth();

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Chatbot health check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check chatbot health",
      error: error.message,
    });
  }
};

module.exports = {
  businessChat,
  devOpsChat,
  resetBusinessConversation,
  getBusinessWelcome,
  getChatbotHealth,
};
