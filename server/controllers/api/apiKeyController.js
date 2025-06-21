const apiKeyService = require("../../services/api/apiKeyService");
const { validationResult } = require("express-validator");

/**
 * Get all API keys for the authenticated user
 */
const getApiKeys = async (req, res) => {
  try {
    const apiKeys = await apiKeyService.getUserApiKeys(req.user.id);
    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch API keys",
    });
  }
};

/**
 * Create a new API key
 */
const createApiKey = async (req, res) => {
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
    const { name, permissions } = req.body;
    const apiKey = await apiKeyService.createApiKey(req.user.id, {
      name,
      permissions,
    });

    res.status(201).json({
      success: true,
      data: apiKey,
      message: "API key created successfully",
    });
  } catch (error) {
    console.error("Error creating API key:", error);

    if (
      error.message === "Maximum number of API keys (10) reached" ||
      error.message === "API key with this name already exists"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create API key",
    });
  }
};

/**
 * Update an existing API key
 */
const updateApiKey = async (req, res) => {
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

    const { keyId } = req.params;
    const { name, permissions, isActive } = req.body;

    const apiKey = await apiKeyService.updateApiKey(keyId, req.user.id, {
      name,
      permissions,
      isActive,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    res.json({
      success: true,
      data: apiKey,
      message: "API key updated successfully",
    });
  } catch (error) {
    console.error("Error updating API key:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update API key",
    });
  }
};

/**
 * Delete an API key
 */
const deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const deleted = await apiKeyService.deleteApiKey(keyId, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    res.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete API key",
    });
  }
};

/**
 * Get API key usage statistics
 */
const getApiKeyStats = async (req, res) => {
  try {
    const { keyId } = req.params;
    const stats = await apiKeyService.getIndividualApiKeyStats(
      keyId,
      req.user.id
    );

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching API key stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch API key statistics",
    });
  }
};

/**
 * Regenerate an API key
 */
const regenerateApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const apiKey = await apiKeyService.regenerateApiKey(keyId, req.user.id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    res.json({
      success: true,
      data: apiKey,
      message: "API key regenerated successfully",
    });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate API key",
    });
  }
};

module.exports = {
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  getApiKeyStats,
  regenerateApiKey,
};
