/**
 * AI Stream Router
 * Routes AI service streams to appropriate client namespaces and rooms
 * Handles AI analysis and generation progress streaming to UI
 */

const logger = require("@config/logger");
const webSocketManager = require("@config/webSocketManager");

class AIStreamRouter {
  constructor() {
    this.isInitialized = false;
    this.routingRules = new Map();
    this.activeStreams = new Map(); // sessionId -> stream info
    this.routingStats = {
      totalRouted: 0,
      routingErrors: 0,
      analysisSessions: 0,
      generationSessions: 0,
    };
  }

  /**
   * Initialize AI stream router
   */
  async initialize() {
    try {
      logger.info("Initializing AI Stream Router...");

      // Setup routing rules for AI events
      this._setupRoutingRules();

      this.isInitialized = true;

      logger.info("✅ AI Stream Router initialized", {
        routingRules: this.routingRules.size,
      });

      return true;
    } catch (error) {
      logger.error("Failed to initialize AI Stream Router", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Setup routing rules for AI events
   */
  _setupRoutingRules() {
    // Analysis progress routing
    this.routingRules.set("analysis_progress", {
      targetNamespace: "/ai",
      targetEvent: "ai:progress",
      roomPattern: "session:{sessionId}",
      requiresAuth: true,
    });

    // Analysis completion routing
    this.routingRules.set("analysis_complete", {
      targetNamespace: "/ai",
      targetEvent: "ai:analysis_complete",
      roomPattern: "session:{sessionId}",
      requiresAuth: true,
    });

    // Generation progress routing
    this.routingRules.set("generation_progress", {
      targetNamespace: "/ai",
      targetEvent: "ai:progress",
      roomPattern: "session:{sessionId}",
      requiresAuth: true,
    });

    // Generation completion routing
    this.routingRules.set("generation_complete", {
      targetNamespace: "/ai",
      targetEvent: "ai:generation_complete",
      roomPattern: "session:{sessionId}",
      requiresAuth: true,
    });

    // Service errors routing
    this.routingRules.set("service_error", {
      targetNamespace: "/ai",
      targetEvent: "ai:error",
      roomPattern: "session:{sessionId}",
      requiresAuth: true,
    });

    logger.info("AI routing rules configured", {
      rules: Array.from(this.routingRules.keys()),
    });
  }

  /**
   * Route AI stream to client namespace
   */
  async routeStream(streamData) {
    try {
      const { event, data, serviceId, timestamp } = streamData;
      const sessionId = data.session_id || data.sessionId;

      if (!sessionId) {
        logger.warning("No session ID in stream data", { event, serviceId });
        this.routingStats.routingErrors++;
        return false;
      }

      // Get routing rule for this event
      const routingRule = this.routingRules.get(event);
      if (!routingRule) {
        logger.warning("No routing rule found for AI event", { event });
        this.routingStats.routingErrors++;
        return false;
      }

      // Determine target room
      const targetRoom = routingRule.roomPattern.replace(
        "{sessionId}",
        sessionId
      );

      // Transform data for client consumption
      const transformedData = this._transformDataForClient(data, {
        serviceId,
        event,
        sessionId,
        timestamp: timestamp || new Date().toISOString(),
      });

      // Emit to AI namespace
      const success = await this._emitToAINamespace(
        routingRule.targetEvent,
        transformedData,
        targetRoom
      );

      if (success) {
        this._updateRoutingStats(event, serviceId, sessionId);
        logger.debug("AI stream routed successfully", {
          event,
          sessionId,
          targetRoom,
          targetEvent: routingRule.targetEvent,
        });
      }

      return success;
    } catch (error) {
      logger.error("Failed to route AI stream", {
        error: error.message,
        streamData,
      });
      this.routingStats.routingErrors++;
      return false;
    }
  }

  /**
   * Transform data for client consumption
   */
  _transformDataForClient(data, context) {
    const { serviceId, event, sessionId, timestamp } = context;

    // Base transformation
    const transformed = {
      sessionId: sessionId,
      timestamp: timestamp,
      source: "ai-service",
      serviceId: serviceId,
      ...data,
    };

    // Event-specific transformations
    switch (event) {
      case "analysis_progress":
      case "generation_progress":
        return {
          ...transformed,
          progress: data.progress || 0,
          status: data.status || "processing",
          message: data.message || "",
          details: data.details || {},
        };

      case "analysis_complete":
        return {
          ...transformed,
          status: "completed",
          data: data.result || data.data,
        };

      case "generation_complete":
        return {
          ...transformed,
          status: "completed",
          data: data.result || data.data,
          configType: data.config_type || data.configType,
        };

      case "service_error":
        return {
          ...transformed,
          error: data.error || "Unknown error",
          context: data.context || "ai_service",
        };

      default:
        return transformed;
    }
  }

  /**
   * Emit to AI namespace
   */
  async _emitToAINamespace(event, data, room) {
    try {
      const io = webSocketManager.getIO();
      const aiNamespace = io.of("/ai");

      if (room) {
        aiNamespace.to(room).emit(event, data);
      } else {
        aiNamespace.emit(event, data);
      }

      return true;
    } catch (error) {
      logger.error("Failed to emit to AI namespace", {
        error: error.message,
        event,
        room,
      });
      return false;
    }
  }

  /**
   * Update routing statistics
   */
  _updateRoutingStats(event, serviceId, sessionId) {
    this.routingStats.totalRouted++;

    if (event.includes("analysis")) {
      this.routingStats.analysisSessions = new Set([
        ...Array.from(this.routingStats.analysisSessions || []),
        sessionId,
      ]).size;
    }

    if (event.includes("generation")) {
      this.routingStats.generationSessions = new Set([
        ...Array.from(this.routingStats.generationSessions || []),
        sessionId,
      ]).size;
    }

    // Track active stream
    this.activeStreams.set(sessionId, {
      serviceId,
      lastActivity: new Date(),
      eventType: event,
    });
  }

  /**
   * Get routing statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      routingStats: this.routingStats,
      activeStreams: this.activeStreams.size,
      routingRules: this.routingRules.size,
    };
  }

  /**
   * Cleanup expired streams
   */
  cleanupExpiredStreams(maxAge = 3600000) {
    // 1 hour default
    const now = new Date();
    const expired = [];

    for (const [sessionId, streamInfo] of this.activeStreams.entries()) {
      if (now - streamInfo.lastActivity > maxAge) {
        expired.push(sessionId);
      }
    }

    expired.forEach((sessionId) => {
      this.activeStreams.delete(sessionId);
    });

    if (expired.length > 0) {
      logger.info("Cleaned up expired AI streams", {
        expired: expired.length,
        remaining: this.activeStreams.size,
      });
    }
  }

  /**
   * Shutdown the router
   */
  async shutdown() {
    try {
      this.activeStreams.clear();
      this.routingRules.clear();
      this.isInitialized = false;

      logger.info("AI Stream Router shutdown completed");
    } catch (error) {
      logger.error("Error during AI Stream Router shutdown", {
        error: error.message,
      });
    }
  }
}

module.exports = AIStreamRouter;
