const ApiKey = require("@models/ApiKey");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

class ApiKeyService {
  /**
   * Generate secure API key
   */
  generateApiKey(type = "live") {
    const keyData = crypto.randomBytes(32).toString("hex");
    return `dp_${type}_${keyData}`;
  }

  /**
   * Create API key
   */
  async createApiKey(userId, { name, description, permissions, expiresAt }) {
    try {
      // Check if user already has too many API keys
      const existingKeys = await ApiKey.find({
        user: userId,
        status: "active",
      });
      if (existingKeys.length >= 10) {
        throw new Error("Maximum number of API keys (10) reached");
      }

      // Check if name already exists for this user
      const existingKey = await ApiKey.findOne({
        user: userId,
        name: name,
        status: "active",
      });
      if (existingKey) {
        throw new Error("API key with this name already exists");
      }

      // Generate secure API key
      const keyType = permissions.includes("write") ? "live" : "test";
      const fullKey = this.generateApiKey(keyType);
      const keyPrefix = fullKey.substring(0, 12); // dp_live_xxxx or dp_test_xxxx

      // Hash the key for storage
      const keyHash = await bcrypt.hash(fullKey, 12);

      // Create the API key
      const apiKey = new ApiKey({
        name: name.trim(),
        description: description?.trim() || "",
        keyHash,
        keyPrefix,
        user: userId,
        permissions: permissions || ["projects:read"],
        expiresAt,
        status: "active",
        lastUsed: null,
      });

      await apiKey.save();

      // Return the new API key with full key visible (only time it's shown)
      return {
        id: apiKey._id,
        name: apiKey.name,
        description: apiKey.description,
        key: fullKey, // Return full key for user to copy
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        created: apiKey.createdAt,
        lastUsed: apiKey.lastUsed,
      };
    } catch (error) {
      console.error("Error creating API key:", error);
      throw error;
    }
  }

  /**
   * Get user's API keys
   */
  async getUserApiKeys(userId, { includeInactive = false } = {}) {
    try {
      const query = { user: userId };
      if (!includeInactive) {
        query.status = "active";
      }

      const apiKeys = await ApiKey.find(query)
        .select("-keyHash") // Never return the hash
        .sort({ createdAt: -1 })
        .lean();

      // Return API keys with masked keys for security
      return apiKeys.map((key) => ({
        id: key._id,
        name: key.name,
        description: key.description,
        key: `${key.keyPrefix}${"*".repeat(20)}${key.keyPrefix.slice(-3)}`,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        status: key.status,
        expiresAt: key.expiresAt,
        created: key.createdAt,
        lastUsed: key.lastUsed,
      }));
    } catch (error) {
      console.error("Error fetching user API keys:", error);
      throw new Error("Failed to fetch API keys");
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(keyString) {
    try {
      if (!keyString || !keyString.startsWith("dp_")) {
        return null;
      }

      // Extract the prefix to find potential matches
      const keyPrefix = keyString.substring(0, 12);

      // Find API keys with matching prefix
      const potentialKeys = await ApiKey.find({
        keyPrefix,
        status: "active",
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }).populate("user", "username email status");

      // Check each potential key
      for (const apiKey of potentialKeys) {
        const isValid = await bcrypt.compare(keyString, apiKey.keyHash);
        if (isValid) {
          // Update last used timestamp
          await ApiKey.findByIdAndUpdate(apiKey._id, {
            lastUsed: new Date(),
            $inc: { usageCount: 1 },
          });

          return {
            id: apiKey._id,
            user: apiKey.user,
            permissions: apiKey.permissions,
            name: apiKey.name,
            status: apiKey.status,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error validating API key:", error);
      return null;
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(keyId, userId) {
    try {
      // Find the API key and verify ownership
      const apiKey = await ApiKey.findOne({
        _id: keyId,
        user: userId,
        status: "active",
      });

      if (!apiKey) {
        throw new Error("API key not found");
      }

      // Soft delete the API key
      apiKey.status = "revoked";
      apiKey.revokedAt = new Date();
      await apiKey.save();

      return true;
    } catch (error) {
      console.error("Error deleting API key:", error);
      throw error;
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(keyId, userId, updates) {
    try {
      const allowedUpdates = ["name", "description", "permissions"];
      const filteredUpdates = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      const apiKey = await ApiKey.findOneAndUpdate(
        { _id: keyId, user: userId, status: "active" },
        { ...filteredUpdates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select("-keyHash");

      if (!apiKey) {
        throw new Error("API key not found");
      }

      return {
        id: apiKey._id,
        name: apiKey.name,
        description: apiKey.description,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        created: apiKey.createdAt,
        lastUsed: apiKey.lastUsed,
        updated: apiKey.updatedAt,
      };
    } catch (error) {
      console.error("Error updating API key:", error);
      throw error;
    }
  }

  /**
   * Get API key statistics
   */
  async getApiKeyStats(userId) {
    try {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = await ApiKey.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
            recentlyUsed: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$lastUsed", last7Days] },
                      { $eq: ["$status", "active"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalUsage: { $sum: "$usageCount" },
          },
        },
      ]);

      return (
        stats[0] || {
          total: 0,
          active: 0,
          recentlyUsed: 0,
          totalUsage: 0,
        }
      );
    } catch (error) {
      console.error("Error getting API key stats:", error);
      throw new Error("Failed to get API key statistics");
    }
  }

  /**
   * Get specific API key statistics
   */
  async getIndividualApiKeyStats(keyId, userId) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: keyId,
        user: userId,
        status: "active",
      });

      if (!apiKey) {
        return null;
      }

      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        usageCount: apiKey.usageCount || 0,
        lastUsed: apiKey.lastUsed,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        isRecentlyUsed: apiKey.lastUsed && apiKey.lastUsed >= last7Days,
        status: apiKey.status,
      };
    } catch (error) {
      console.error("Error getting individual API key stats:", error);
      throw new Error("Failed to get API key statistics");
    }
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(keyId, userId) {
    try {
      const apiKey = await ApiKey.findOne({
        _id: keyId,
        user: userId,
        status: "active",
      });

      if (!apiKey) {
        return null;
      }

      // Generate new key
      const keyType = apiKey.permissions.includes("write") ? "live" : "test";
      const fullKey = this.generateApiKey(keyType);
      const keyPrefix = fullKey.substring(0, 12);

      // Hash the new key
      const keyHash = await bcrypt.hash(fullKey, 12);

      // Update the API key
      apiKey.keyHash = keyHash;
      apiKey.keyPrefix = keyPrefix;
      apiKey.usageCount = 0; // Reset usage count
      apiKey.lastUsed = null; // Reset last used
      apiKey.updatedAt = new Date();

      await apiKey.save();

      return {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        key: fullKey, // Return the full key only on creation/regeneration
        permissions: apiKey.permissions,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
      };
    } catch (error) {
      console.error("Error regenerating API key:", error);
      throw new Error("Failed to regenerate API key");
    }
  }
}

module.exports = new ApiKeyService();
