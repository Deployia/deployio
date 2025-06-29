/**
 * Stream Router
 * Routes agent streams to appropriate client namespaces and rooms
 * Handles user access control and room management
 */

const logger = require("@config/logger");
const webSocketRegistry = require("@websockets/core/WebSocketRegistry");

class StreamRouter {
  constructor() {
    this.isInitialized = false;
    this.routingRules = new Map();
    this.activeRoutes = new Map(); // streamId -> route info
    this.routingStats = {
      totalRouted: 0,
      routingErrors: 0,
      routesByNamespace: new Map(),
    };
  }

  /**
   * Initialize stream router
   */
  async initialize() {
    try {
      logger.info("Initializing Stream Router...");

      // Setup routing rules
      this._setupRoutingRules();

      this.isInitialized = true;

      logger.info("✅ Stream Router initialized", {
        routingRules: this.routingRules.size,
      });

      return true;
    } catch (error) {
      logger.error("Failed to initialize Stream Router", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Route agent stream to client namespace
   */
  async routeStream(streamData) {
    try {
      const { agentId, sourceNamespace, event, data, room, timestamp } =
        streamData;

      // Get routing rule for this stream
      const routingRule = this.routingRules.get(sourceNamespace);
      if (!routingRule) {
        logger.warning("No routing rule found", { sourceNamespace });
        return false;
      }

      // Determine target namespace and room
      const targetNamespace = routingRule.targetNamespace;
      const targetRoom = this._determineTargetRoom(room, data, routingRule);

      // Validate target room access
      const hasAccess = await this._validateRoomAccess(targetRoom, data);
      if (!hasAccess) {
        logger.warning("Access denied for room", { targetRoom, agentId });
        this.routingStats.routingErrors++;
        return false;
      }

      // Transform data for client consumption
      const transformedData = this._transformDataForClient(data, {
        agentId,
        sourceNamespace,
        targetNamespace,
        timestamp,
      });

      // Handle arrays of log entries (for live streaming)
      if (Array.isArray(transformedData)) {
        let routeSuccess = true;
        for (const logEntry of transformedData) {
          const success = await this._emitToClientNamespace(
            targetNamespace,
            event,
            logEntry,
            targetRoom
          );
          if (!success) routeSuccess = false;
        }

        if (routeSuccess) {
          this._updateRoutingStats(
            targetNamespace,
            agentId,
            sourceNamespace,
            transformedData.length
          );
        }
        return routeSuccess;
      }

      // Route single data object to client namespace
      const success = await this._emitToClientNamespace(
        targetNamespace,
        event,
        transformedData,
        targetRoom
      );

      if (success) {
        this._updateRoutingStats(targetNamespace, agentId, sourceNamespace, 1);
        return true;
      }

      this.routingStats.routingErrors++;
      return false;
    } catch (error) {
      logger.error("Error routing stream", {
        error: error.message,
        streamData,
      });
      this.routingStats.routingErrors++;
      return false;
    }
  }

  /**
   * Update routing statistics
   */
  _updateRoutingStats(
    targetNamespace,
    agentId,
    sourceNamespace,
    dataCount = 1
  ) {
    // Update routing statistics
    this.routingStats.totalRouted += dataCount;
    const namespaceCount =
      this.routingStats.routesByNamespace.get(targetNamespace) || 0;
    this.routingStats.routesByNamespace.set(
      targetNamespace,
      namespaceCount + dataCount
    );

    // Track active route
    const routeId = `${agentId}-${sourceNamespace}-${Date.now()}`;
    this.activeRoutes.set(routeId, {
      agentId,
      sourceNamespace,
      targetNamespace,
      event: "live_logs",
      timestamp: new Date().toISOString(),
      dataCount,
    });
  }

  /**
   * Setup routing rules for different agent namespaces
   */
  _setupRoutingRules() {
    // Agent logs -> Client logs namespace
    this.routingRules.set("/agent-logs", {
      targetNamespace: "/logs",
      roomMapping: {
        "admin-system-logs": "admin-logs",
        "user-{userId}-logs": "user-{userId}-logs",
      },
      eventMapping: {
        system_logs: "agent_system_logs",
        container_logs: "agent_container_logs",
        system_logs_response: "agent_system_logs",
        container_logs_response: "agent_container_logs",
        live_system_logs: "log:data", // Map to client's log:data event
        live_container_logs: "log:data", // Map to client's log:data event
      },
      accessControl: {
        adminOnly: ["admin-system-logs"],
        userSpecific: ["user-{userId}-logs"],
      },
    });

    // Agent metrics -> Client metrics namespace (future)
    this.routingRules.set("/agent-metrics", {
      targetNamespace: "/metrics",
      roomMapping: {
        "admin-system-metrics": "admin-metrics",
        "user-{userId}-metrics": "user-{userId}-metrics",
      },
      eventMapping: {
        system_metrics: "agent_system_metrics",
        container_metrics: "agent_container_metrics",
      },
      accessControl: {
        adminOnly: ["admin-system-metrics"],
        userSpecific: ["user-{userId}-metrics"],
      },
    });

    // Agent builds -> Client logs namespace (build logs)
    this.routingRules.set("/agent-builds", {
      targetNamespace: "/logs",
      roomMapping: {
        "user-{userId}-builds": "user-{userId}-logs",
      },
      eventMapping: {
        build_logs: "agent_build_logs",
        build_status: "agent_build_status",
      },
      accessControl: {
        userSpecific: ["user-{userId}-builds"],
      },
    });

    // Agent deployments -> Client notifications namespace
    this.routingRules.set("/agent-deployments", {
      targetNamespace: "/notifications",
      roomMapping: {
        "user-{userId}-deployments": "user-{userId}-notifications",
      },
      eventMapping: {
        deployment_status: "agent_deployment_status",
        deployment_logs: "agent_deployment_logs",
      },
      accessControl: {
        userSpecific: ["user-{userId}-deployments"],
      },
    });

    logger.info("✅ Routing rules setup completed", {
      rules: Array.from(this.routingRules.keys()),
    });
  }

  /**
   * Determine target room based on source room and routing rules
   */
  _determineTargetRoom(sourceRoom, data, routingRule) {
    try {
      const roomMapping = routingRule.roomMapping;

      // Direct mapping first
      if (roomMapping[sourceRoom]) {
        return roomMapping[sourceRoom];
      }

      // Pattern matching for user-specific rooms
      for (const [pattern, target] of Object.entries(roomMapping)) {
        if (pattern.includes("{userId}") && sourceRoom.includes("user-")) {
          // Extract userId from source room
          const userIdMatch = sourceRoom.match(/user-(\d+)-/);
          if (userIdMatch) {
            const userId = userIdMatch[1];
            return target.replace("{userId}", userId);
          }
        }
      }

      // Fallback to admin room if no specific mapping
      const adminFallback = Object.values(roomMapping).find((room) =>
        room.includes("admin")
      );
      return adminFallback || sourceRoom;
    } catch (error) {
      logger.error("Error determining target room", {
        error: error.message,
        sourceRoom,
      });
      return sourceRoom; // Fallback to source room
    }
  }

  /**
   * Validate room access based on data and user permissions
   */
  async _validateRoomAccess(targetRoom, data) {
    try {
      // Admin rooms require admin access
      if (targetRoom.includes("admin")) {
        // For now, allow admin room access
        // In production, validate admin permissions
        return true;
      }

      // User-specific rooms require user ownership validation
      if (targetRoom.includes("user-")) {
        const userIdMatch = targetRoom.match(/user-(\d+)-/);
        if (userIdMatch) {
          const roomUserId = userIdMatch[1];
          const dataUserId = data.user_id || data.userId;

          // Allow if user IDs match or if data doesn't specify user
          return !dataUserId || roomUserId === String(dataUserId);
        }
      }

      // Default allow for other rooms
      return true;
    } catch (error) {
      logger.error("Error validating room access", {
        error: error.message,
        targetRoom,
      });
      return false;
    }
  }

  /**
   * Transform agent data for client consumption
   */
  _transformDataForClient(data, metadata) {
    try {
      // Special handling for live log data (match LogStreamingNamespace format)
      if (
        metadata.sourceNamespace === "/agent-logs" &&
        data.logs &&
        Array.isArray(data.logs)
      ) {
        // Transform each log entry to client format
        return data.logs.map((logEntry) => ({
          streamId: `agent-${metadata.agentId}`, // Use agent-based stream ID
          data: logEntry.message,
          timestamp: logEntry.timestamp,
          level: logEntry.level,
          service: metadata.agentId,
          source: logEntry.source || "agent",
          isError: logEntry.level === "ERROR" || logEntry.level === "error",
          metadata: logEntry.metadata || {},
          // Include original agent data
          agentId: metadata.agentId,
          sourceNamespace: metadata.sourceNamespace,
          routedAt: metadata.timestamp,
          raw: logEntry.raw,
          id: logEntry.id,
        }));
      }

      // Default transformation for other data types
      const transformed = {
        ...data,
        // Add metadata
        source: "agent",
        agentId: metadata.agentId,
        sourceNamespace: metadata.sourceNamespace,
        routedAt: metadata.timestamp,
        // Ensure timestamp exists
        timestamp: data.timestamp || metadata.timestamp,
      };

      // Remove any agent-specific internal fields
      delete transformed.internal;
      delete transformed._agentInternal;

      return transformed;
    } catch (error) {
      logger.error("Error transforming data for client", {
        error: error.message,
        metadata,
      });
      return data; // Return original data on error
    }
  }

  /**
   * Emit data to client namespace
   */
  async _emitToClientNamespace(namespace, event, data, room) {
    try {
      // Get the namespace from registry
      const namespaceHandler = webSocketRegistry.get(namespace);
      if (!namespaceHandler) {
        logger.error("Client namespace not found", { namespace });
        return false;
      }

      // Map event name if needed
      const routingRule = Array.from(this.routingRules.values()).find(
        (rule) => rule.targetNamespace === namespace
      );

      let targetEvent = event;
      if (routingRule && routingRule.eventMapping[event]) {
        targetEvent = routingRule.eventMapping[event];
      }

      // Emit to the namespace and room
      if (room) {
        namespaceHandler.namespace.to(room).emit(targetEvent, data);
      } else {
        namespaceHandler.emit(targetEvent, data);
      }

      logger.debug("✅ Emitted to client namespace", {
        namespace,
        event: targetEvent,
        room,
        dataSize: JSON.stringify(data).length,
      });

      return true;
    } catch (error) {
      logger.error("Error emitting to client namespace", {
        error: error.message,
        namespace,
        event,
        room,
      });
      return false;
    }
  }

  /**
   * Clean up streams for specific agent
   */
  async cleanupAgentStreams(agentId) {
    try {
      logger.info("Cleaning up agent streams", { agentId });

      // Remove active routes for this agent
      for (const [routeId, routeInfo] of this.activeRoutes.entries()) {
        if (routeInfo.agentId === agentId) {
          this.activeRoutes.delete(routeId);
        }
      }

      logger.debug("✅ Agent streams cleaned up", { agentId });
    } catch (error) {
      logger.error("Error cleaning up agent streams", {
        error: error.message,
        agentId,
      });
    }
  }

  /**
   * Check if router is active
   */
  isActive() {
    return this.isInitialized;
  }

  /**
   * Get router status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      routingRules: this.routingRules.size,
      activeRoutes: this.activeRoutes.size,
      stats: this.routingStats,
    };
  }

  /**
   * Get routing statistics
   */
  getStats() {
    return {
      ...this.routingStats,
      activeRoutes: this.activeRoutes.size,
      routesByAgent: this._getRoutesByAgent(),
    };
  }

  /**
   * Get routes grouped by agent
   */
  _getRoutesByAgent() {
    const routesByAgent = new Map();

    for (const routeInfo of this.activeRoutes.values()) {
      const agentRoutes = routesByAgent.get(routeInfo.agentId) || [];
      agentRoutes.push({
        sourceNamespace: routeInfo.sourceNamespace,
        targetNamespace: routeInfo.targetNamespace,
        targetRoom: routeInfo.targetRoom,
        timestamp: routeInfo.timestamp,
      });
      routesByAgent.set(routeInfo.agentId, agentRoutes);
    }

    return Object.fromEntries(routesByAgent);
  }

  /**
   * Cleanup stream router
   */
  async cleanup() {
    logger.info("Cleaning up Stream Router...");

    this.routingRules.clear();
    this.activeRoutes.clear();
    this.routingStats = {
      totalRouted: 0,
      routingErrors: 0,
      routesByNamespace: new Map(),
    };
    this.isInitialized = false;

    logger.info("✅ Stream Router cleanup completed");
  }
}

module.exports = StreamRouter;
