const webSocketRegistry = require("../core/WebSocketRegistry");
const ai = require("../../services/ai");
const logger = require("../../config/logger");
const { v4: uuidv4 } = require("uuid");

/**
 * AI WebSocket Namespace
 * Handles real-time AI analysis and configuration generation
 */
class AINamespace {
  constructor() {
    this.namespace = null;
    this.activeSessions = new Map(); // Track active analysis sessions
    this.aiServiceBridge = null;
  }

  /**
   * Initialize the AI namespace
   */
  static initialize() {
    const instance = new AINamespace();

    // Get AI service bridge reference
    try {
      instance.aiServiceBridge = require("../../services/bridge/AIServiceBridgeService");
    } catch (error) {
      logger.warn(
        "AI Service bridge not available, falling back to direct AI service calls"
      );
    }

    // Register namespace with authentication required
    const namespace = webSocketRegistry.register("/ai", {
      requireAuth: true,
      requireAdmin: false,
      requireVerified: true, // Require verified users for AI features
    });

    // Register event handlers
    namespace
      .on("analyze_repository", instance.analyzeRepository.bind(instance))
      .on("generate_configs", instance.generateConfigurations.bind(instance))
      .on("get_analysis_progress", instance.getAnalysisProgress.bind(instance))
      .on("cancel_analysis", instance.cancelAnalysis.bind(instance))
      .on("subscribe_analysis", instance.subscribeToAnalysis.bind(instance));

    // Add connection handler
    namespace.onConnection(instance.handleConnection.bind(instance));
    namespace.onDisconnect(instance.handleDisconnect.bind(instance));

    instance.namespace = namespace;

    logger.info("AI namespace initialized");
    return instance;
  }

  /**
   * Handle new connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    logger.info(`AI namespace: User ${socket.user.username} connected`);

    // Join user to their personal room for progress updates
    socket.join(`user:${socket.user._id}`);

    // Send initial status
    socket.emit("ai:status", {
      status: "connected",
      timestamp: new Date().toISOString(),
      message: "AI service connected successfully",
    });
  }

  /**
   * Handle disconnection
   * @param {Object} socket - Socket instance
   */
  handleDisconnect(socket) {
    logger.info(`AI namespace: User ${socket.user.username} disconnected`);

    // Clean up any active sessions for this user
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === socket.user._id.toString()) {
        this.activeSessions.delete(sessionId);
        logger.info(`Cleaned up session ${sessionId} for disconnected user`);
      }
    }
  }

  /**
   * Analyze repository with real-time progress
   * @param {Object} socket - Socket instance
   * @param {Object} data - Analysis request data
   */
  async analyzeRepository(socket, data) {
    const sessionId = uuidv4();

    try {
      const { repositoryData, analysisTypes, options = {} } = data;

      if (!repositoryData) {
        socket.emit("ai:error", {
          sessionId,
          error: "Repository data is required",
        });
        return;
      }

      // Register session
      this.activeSessions.set(sessionId, {
        userId: socket.user._id.toString(),
        type: "analysis",
        startTime: new Date(),
        status: "running",
      });

      // Join session room for progress updates
      socket.join(`session:${sessionId}`);

      // Send initial progress
      socket.emit("ai:progress", {
        sessionId,
        progress: 5,
        status: "starting",
        message: "Initializing repository analysis...",
      });

      // Prepare analysis request
      const analysisRequest = {
        sessionId,
        userId: socket.user._id.toString(),
        repositoryData,
        analysisTypes: analysisTypes || ["stack", "dependencies", "quality"],
        options: {
          user: {
            id: socket.user._id.toString(),
            username: socket.user.username,
            email: socket.user.email,
          },
          socketId: socket.id,
          ...options,
        },
      };

      // Send to AI service via bridge or fallback to direct call
      if (this.aiServiceBridge && this.aiServiceBridge.isInitialized) {
        const success = await this.aiServiceBridge.sendToAIService(
          "analysis_request",
          analysisRequest
        );

        if (!success) {
          throw new Error("Failed to send request to AI service");
        }
      } else {
        // Fallback to direct AI service call
        logger.warn("Using fallback direct AI service call");
        const analysisOptions = {
          user: socket.user,
          sessionId,
          socketId: socket.id,
          analysisTypes: analysisTypes || ["stack", "dependencies", "quality"],
          ...options,
        };

        const result = await ai.analyzeRepositoryWithWebSocket(
          repositoryData,
          analysisOptions
        );

        // Update session status
        const session = this.activeSessions.get(sessionId);
        if (session) {
          session.status = "completed";
          session.result = result;
        }

        // Send completion
        socket.emit("ai:analysis_complete", {
          sessionId,
          status: "completed",
          data: result,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(`Analysis requested for session ${sessionId}`);
    } catch (error) {
      logger.error(`Analysis failed for session ${sessionId}:`, error);

      // Update session status
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = "error";
        session.error = error.message;
      }

      socket.emit("ai:error", {
        sessionId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Generate configurations from analysis results
   * @param {Object} socket - Socket instance
   * @param {Object} data - Generation request data
   */
  async generateConfigurations(socket, data) {
    const sessionId = uuidv4();

    try {
      const {
        repositoryData,
        analysisResults,
        configTypes,
        options = {},
      } = data;

      if (!repositoryData || !analysisResults) {
        socket.emit("ai:error", {
          sessionId,
          error: "Repository data and analysis results are required",
        });
        return;
      }

      // Register session
      this.activeSessions.set(sessionId, {
        userId: socket.user._id.toString(),
        type: "generation",
        startTime: new Date(),
        status: "running",
      });

      // Join session room for progress updates
      socket.join(`session:${sessionId}`);

      // Send initial progress
      socket.emit("ai:progress", {
        sessionId,
        progress: 10,
        status: "starting",
        message: "Generating deployment configurations...",
      });

      // Prepare generation request
      const generationRequest = {
        sessionId,
        userId: socket.user._id.toString(),
        repositoryData,
        analysisResults,
        configTypes: configTypes || [
          "dockerfile",
          "github_actions",
          "docker_compose",
        ],
        options: {
          user: {
            id: socket.user._id.toString(),
            username: socket.user.username,
            email: socket.user.email,
          },
          socketId: socket.id,
          optimizationLevel: options.optimizationLevel || "balanced",
          userPreferences: options.userPreferences || {},
          ...options,
        },
      };

      // Send to AI service via bridge or fallback to direct call
      if (this.aiServiceBridge && this.aiServiceBridge.isInitialized) {
        const success = await this.aiServiceBridge.sendToAIService(
          "generation_request",
          generationRequest
        );

        if (!success) {
          throw new Error("Failed to send request to AI service");
        }
      } else {
        // Fallback to direct AI service call
        logger.warn("Using fallback direct AI service call for generation");
        const generationOptions = {
          user: socket.user,
          sessionId,
          configTypes: configTypes || [
            "dockerfile",
            "github_actions",
            "docker_compose",
          ],
          optimizationLevel: options.optimizationLevel || "balanced",
          userPreferences: options.userPreferences || {},
        };

        const result = await ai.generateConfigurations(
          repositoryData,
          analysisResults,
          generationOptions
        );

        // Update session status
        const session = this.activeSessions.get(sessionId);
        if (session) {
          session.status = "completed";
          session.result = result;
        }

        // Send completion
        socket.emit("ai:generation_complete", {
          sessionId,
          status: "completed",
          data: result,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(
        `Configuration generation requested for session ${sessionId}`
      );
    } catch (error) {
      logger.error(
        `Configuration generation failed for session ${sessionId}:`,
        error
      );

      // Update session status
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = "error";
        session.error = error.message;
      }

      socket.emit("ai:error", {
        sessionId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get analysis progress
   * @param {Object} socket - Socket instance
   * @param {Object} data - Progress request data
   */
  async getAnalysisProgress(socket, data) {
    try {
      const { sessionId } = data;
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        socket.emit("ai:error", {
          sessionId,
          error: "Session not found",
        });
        return;
      }

      socket.emit("ai:progress_update", {
        sessionId,
        status: session.status,
        startTime: session.startTime,
        type: session.type,
      });
    } catch (error) {
      logger.error("Error getting analysis progress:", error);
      socket.emit("ai:error", {
        error: "Failed to get analysis progress",
      });
    }
  }

  /**
   * Cancel analysis
   * @param {Object} socket - Socket instance
   * @param {Object} data - Cancel request data
   */
  async cancelAnalysis(socket, data) {
    try {
      const { sessionId } = data;
      const session = this.activeSessions.get(sessionId);

      if (!session || session.userId !== socket.user._id.toString()) {
        socket.emit("ai:error", {
          sessionId,
          error: "Session not found or unauthorized",
        });
        return;
      }

      // Update session status
      session.status = "cancelled";

      socket.emit("ai:analysis_cancelled", {
        sessionId,
        status: "cancelled",
        timestamp: new Date().toISOString(),
      });

      // Clean up session after a delay
      setTimeout(() => {
        this.activeSessions.delete(sessionId);
      }, 30000); // 30 seconds

      logger.info(`Analysis cancelled for session ${sessionId}`);
    } catch (error) {
      logger.error("Error cancelling analysis:", error);
      socket.emit("ai:error", {
        error: "Failed to cancel analysis",
      });
    }
  }

  /**
   * Subscribe to analysis updates for a specific session
   * @param {Object} socket - Socket instance
   * @param {Object} data - Subscription data
   */
  subscribeToAnalysis(socket, data) {
    try {
      const { sessionId } = data;

      // Join session room for progress updates
      socket.join(`session:${sessionId}`);

      socket.emit("ai:subscribed", {
        sessionId,
        message: "Subscribed to analysis updates",
      });

      logger.info(
        `User ${socket.user.username} subscribed to session ${sessionId}`
      );
    } catch (error) {
      logger.error("Error subscribing to analysis:", error);
      socket.emit("ai:error", {
        error: "Failed to subscribe to analysis updates",
      });
    }
  }

  /**
   * Broadcast progress update to session subscribers
   * @param {string} sessionId - Session ID
   * @param {Object} progressData - Progress data
   */
  broadcastProgress(sessionId, progressData) {
    if (this.namespace) {
      this.namespace.to(`session:${sessionId}`).emit("ai:progress", {
        sessionId,
        ...progressData,
      });
    }
  }

  /**
   * Get active sessions count
   * @returns {number} Active sessions count
   */
  getActiveSessionsCount() {
    return this.activeSessions.size;
  }

  /**
   * Get sessions for a specific user
   * @param {string} userId - User ID
   * @returns {Array} User sessions
   */
  getUserSessions(userId) {
    const userSessions = [];
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({
          sessionId,
          ...session,
        });
      }
    }
    return userSessions;
  }
}

module.exports = AINamespace;
