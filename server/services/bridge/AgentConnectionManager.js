/**
 * Agent Connection Manager
 * Handles agent authentication, connection validation, and management
 */

const logger = require("@config/logger");

class AgentConnectionManager {
  constructor() {
    this.isInitialized = false;
    this.validAgents = new Map(); // agentId -> agent config
    this.connectionAttempts = new Map(); // agentId -> attempt count
    this.maxConnectionAttempts = 10;
    this.connectionTimeout = 30000; // 30 seconds
  }

  /**
   * Initialize connection manager
   */
  async initialize() {
    try {
      logger.info("Initializing Agent Connection Manager...");

      // Load valid agents configuration
      await this._loadAgentConfiguration();

      this.isInitialized = true;

      logger.info("✅ Agent Connection Manager initialized", {
        validAgents: this.validAgents.size,
      });

      return true;
    } catch (error) {
      logger.error("Failed to initialize Agent Connection Manager", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Validate agent credentials
   */
  async validateAgent(agentId, agentSecret, platformDomain) {
    try {
      if (!agentId || !agentSecret || !platformDomain) {
        logger.error("Missing agent credentials", { agentId });
        return false;
      }

      // Check if agent ID is valid format
      if (!this._isValidAgentId(agentId)) {
        logger.error("Invalid agent ID format", { agentId });
        return false;
      }

      // Check connection attempts
      const attempts = this.connectionAttempts.get(agentId) || 0;
      if (attempts >= this.maxConnectionAttempts) {
        logger.error("Too many connection attempts", { agentId, attempts });
        return false;
      }

      // For now, validate against environment or basic config
      // In production, this would check against database or secure config
      const isValidSecret = await this._validateAgentSecret(
        agentId,
        agentSecret
      );
      const isValidDomain = await this._validatePlatformDomain(platformDomain);

      if (!isValidSecret || !isValidDomain) {
        // Increment failed attempts
        this.connectionAttempts.set(agentId, attempts + 1);
        logger.error("Agent validation failed", {
          agentId,
          validSecret: isValidSecret,
          validDomain: isValidDomain,
          attempts: attempts + 1,
        });
        return false;
      }

      // Reset connection attempts on successful validation
      this.connectionAttempts.delete(agentId);

      // Store valid agent info
      this.validAgents.set(agentId, {
        agentId,
        platformDomain,
        validatedAt: new Date(),
        connectionCount:
          (this.validAgents.get(agentId)?.connectionCount || 0) + 1,
      });

      logger.info("✅ Agent validated successfully", {
        agentId,
        platformDomain,
      });
      return true;
    } catch (error) {
      logger.error("Error validating agent", {
        error: error.message,
        agentId,
      });
      return false;
    }
  }

  /**
   * Get agent connection info
   */
  getAgentInfo(agentId) {
    return this.validAgents.get(agentId);
  }

  /**
   * Check if agent is authorized for specific action
   */
  async isAgentAuthorized(agentId, action, resource = null) {
    try {
      const agentInfo = this.validAgents.get(agentId);
      if (!agentInfo) {
        return false;
      }

      // Basic authorization - all validated agents can perform standard actions
      const allowedActions = [
        "stream_logs",
        "stream_metrics",
        "send_heartbeat",
        "report_status",
      ];

      return allowedActions.includes(action);
    } catch (error) {
      logger.error("Error checking agent authorization", {
        error: error.message,
        agentId,
        action,
      });
      return false;
    }
  }

  /**
   * Load agent configuration (from environment/database)
   */
  async _loadAgentConfiguration() {
    try {
      // For development, we'll accept any agent with proper format
      // In production, this would load from secure configuration or database

      logger.info("Loading agent configuration...");

      // Example configuration - in production, load from secure source
      const defaultAgentConfigs = [
        {
          agentId: "agent-ec2-1",
          description: "EC2 Instance 1",
          region: "us-east-1",
        },
        {
          agentId: "agent-ec2-2",
          description: "EC2 Instance 2",
          region: "us-west-2",
        },
        {
          agentId: "agent-local-dev",
          description: "Local Development Agent",
          region: "local",
        },
      ];

      // Store default configs
      for (const config of defaultAgentConfigs) {
        this.validAgents.set(config.agentId, {
          ...config,
          connectionCount: 0,
          lastSeen: null,
        });
      }

      logger.info("✅ Agent configuration loaded", {
        configuredAgents: this.validAgents.size,
      });
    } catch (error) {
      logger.error("Error loading agent configuration", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate agent ID format
   */
  _isValidAgentId(agentId) {
    // Agent ID should be: agent-{identifier} where identifier is alphanumeric with hyphens
    const agentIdRegex = /^agent-[a-zA-Z0-9-]+$/;
    return agentIdRegex.test(agentId);
  }

  /**
   * Validate agent secret
   */
  async _validateAgentSecret(agentId, agentSecret) {
    try {
      // In development, accept any non-empty secret
      // In production, this would validate against stored hashed secrets

      if (!agentSecret || agentSecret.length < 8) {
        return false;
      }

      // For development - accept common development secrets
      const developmentSecrets = [
        "development-secret-change-in-production",
        "agent-secret-dev",
        "test-agent-secret",
      ];

      if (process.env.NODE_ENV === "development") {
        return (
          developmentSecrets.includes(agentSecret) || agentSecret.length >= 16
        );
      }

      // In production, implement proper secret validation
      // Example: await bcrypt.compare(agentSecret, storedHashedSecret)
      return agentSecret.length >= 32; // Require stronger secrets in production
    } catch (error) {
      logger.error("Error validating agent secret", {
        error: error.message,
        agentId,
      });
      return false;
    }
  }

  /**
   * Validate platform domain
   */
  async _validatePlatformDomain(platformDomain) {
    try {
      if (!platformDomain) {
        return false;
      }

      // Allow common development domains
      const allowedDomains = [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://deployio.tech",
        "https://api.deployio.tech",
      ];

      // In development, be more permissive
      if (process.env.NODE_ENV === "development") {
        return (
          allowedDomains.includes(platformDomain) ||
          platformDomain.includes("localhost") ||
          platformDomain.includes("127.0.0.1")
        );
      }

      // In production, be strict about allowed domains
      return allowedDomains.includes(platformDomain);
    } catch (error) {
      logger.error("Error validating platform domain", {
        error: error.message,
        platformDomain,
      });
      return false;
    }
  }

  /**
   * Get connection manager status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      validAgents: this.validAgents.size,
      connectionAttempts: this.connectionAttempts.size,
      agentList: Array.from(this.validAgents.keys()),
    };
  }

  /**
   * Reset connection attempts for agent
   */
  resetConnectionAttempts(agentId) {
    this.connectionAttempts.delete(agentId);
    logger.info("Reset connection attempts", { agentId });
  }

  /**
   * Cleanup connection manager
   */
  async cleanup() {
    logger.info("Cleaning up Agent Connection Manager...");

    this.validAgents.clear();
    this.connectionAttempts.clear();
    this.isInitialized = false;

    logger.info("✅ Agent Connection Manager cleanup completed");
  }
}

module.exports = AgentConnectionManager;
