// API Key Management Routes - /api/v1/users/api-keys/*
// API key management using the new API key controller

const express = require("express");
const { body, param } = require("express-validator");
const { api } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");

const router = express.Router();

// Validation middleware
const validateApiKeyCreation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array")
    .custom((permissions) => {
      const validPermissions = ["read", "write", "delete", "admin"];
      if (
        permissions &&
        !permissions.every((p) => validPermissions.includes(p))
      ) {
        throw new Error("Invalid permissions specified");
      }
      return true;
    }),
];

const validateApiKeyUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array")
    .custom((permissions) => {
      const validPermissions = ["read", "write", "delete", "admin"];
      if (
        permissions &&
        !permissions.every((p) => validPermissions.includes(p))
      ) {
        throw new Error("Invalid permissions specified");
      }
      return true;
    }),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const validateKeyId = [
  param("keyId").isMongoId().withMessage("Invalid API key ID"),
];

// API Key routes (all protected)
router.get("/", protect, api.apiKey.getApiKeys);
router.post("/", protect, validateApiKeyCreation, api.apiKey.createApiKey);
router.put(
  "/:keyId",
  protect,
  validateKeyId,
  validateApiKeyUpdate,
  api.apiKey.updateApiKey
);
router.delete("/:keyId", protect, validateKeyId, api.apiKey.deleteApiKey);
router.get("/:keyId/stats", protect, validateKeyId, api.apiKey.getApiKeyStats);
router.post(
  "/:keyId/regenerate",
  protect,
  validateKeyId,
  api.apiKey.regenerateApiKey
);

module.exports = router;
