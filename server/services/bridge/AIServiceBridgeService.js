/**
 * AI Service Bridge Service
 * Manages WebSocket communication between AI Service and Server
 */

const EventEmitter = require("events");
const logger = require("@config/logger");
const webSocketManager = require("@config/webSocketManager");

class AIServiceBridgeService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.connectedAIServices = new Map(); // serviceId -> connection info
    this.activeSessions = new Map(); // sessionId -> session info
  }

  /**
   * Initialize the AI Service Bridge
   */
  async initialize() {
    if (this.isInitialized) {
      logger.debug("AI Service Bridge already initialized");
      return true;
    }

    try {
      logger.info("Initializing AI Service Bridge...");

      // Setup AI service namespace for receiving connections
      await this._setupAIServiceNamespace();

      this.isInitialized = true;

      logger.info("AI Service Bridge initialized successfully", {
        namespace: "/ai-service",
      });

      return true;
    } catch (error) {
      logger.error("Failed to initialize AI Service Bridge", {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Setup AI service namespace for incoming connections
   */
  async _setupAIServiceNamespace() {
    const io = webSocketManager.getIO();
    const aiServiceNamespace = io.of("/ai-service");

    aiServiceNamespace.on("connection", (socket) => {
      logger.info("🔗 AI Service connecting to bridge", {
        socketId: socket.id,
        serviceType: socket.handshake.headers["x-service-type"],
        serviceVersion: socket.handshake.headers["x-service-version"],
        timestamp: new Date().toISOString(),
      });

      // Handle service registration
      socket.on("register_service", async (data) => {
        await this.handleServiceRegistration(socket, data);
      });

      // Handle analysis progress updates
      socket.on("analysis_progress", (data) => {
        this.handleAnalysisProgress(socket, data);
      });

      // Handle analysis completion
      socket.on("analysis_complete", (data) => {
        this.handleAnalysisComplete(socket, data);
      });

      // Handle generation progress updates
      socket.on("generation_progress", (data) => {
        this.handleGenerationProgress(socket, data);
      });

      // Handle generation completion
      socket.on("generation_complete", (data) => {
        this.handleGenerationComplete(socket, data);
      });

      // Handle errors
      socket.on("service_error", (data) => {
        this.handleServiceError(socket, data);
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        this.handleServiceDisconnection(socket, reason);
      });
    });

    logger.info("AI Service namespace (/ai-service) configured");
  }

  /**
   * Handle AI service registration
   */
  async handleServiceRegistration(socket, serviceInfo) {
    try {
      const { serviceId, serviceVersion, capabilities } = serviceInfo;

      // Store connection info
      this.connectedAIServices.set(socket.id, {
        serviceId: serviceId || "ai-service-1",
        serviceVersion: serviceVersion || "1.0.0",
        capabilities: capabilities || ["analysis", "generation"],
        socket,
        connectedAt: new Date(),
        lastHeartbeat: new Date(),
      });

      // Send registration confirmation
      socket.emit("registration_complete", {
        status: "success",
        serviceId: serviceId || "ai-service-1",
        timestamp: new Date().toISOString(),
      });

      logger.info("🤖 AI Service registered successfully", {
        serviceId: serviceId || "ai-service-1",
        capabilities,
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      });

      // Notify other parts of the system
      this.emit("service_connected", {
        serviceId: serviceId || "ai-service-1",
        capabilities,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error("Failed to register AI service", {
        error: error.message,
        socketId: socket.id,
      });

      socket.emit("registration_failed", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle analysis progress updates from AI service
   */
  handleAnalysisProgress(socket, data) {
    try {
      const { sessionId, progress, status, message } = data;

      // Forward to AI namespace for client distribution
      const aiNamespace = webSocketManager.getIO().of("/ai");
      aiNamespace.to(`session:${sessionId}`).emit("ai:progress", {
        sessionId,
        progress,
        status,
        message,
        timestamp: new Date().toISOString(),
      });

      logger.debug("Analysis progress forwarded to clients", {
        sessionId,
        progress,
        status,
      });
    } catch (error) {
      logger.error("Error handling analysis progress", {
        error: error.message,
        sessionId: data?.sessionId,
      });
    }
  }

  /**
   * Handle analysis completion from AI service
   */
  handleAnalysisComplete(socket, data) {
    try {
      const { sessionId, result, status } = data;

      // Forward to AI namespace for client distribution
      const aiNamespace = webSocketManager.getIO().of("/ai");
      aiNamespace.to(`session:${sessionId}`).emit("ai:analysis_complete", {
        sessionId,
        status: status || "completed",
        data: result,
        timestamp: new Date().toISOString(),
      });

      logger.info("Analysis completion forwarded to clients", {
        sessionId,
        status,
      });
    } catch (error) {
      logger.error("Error handling analysis completion", {
        error: error.message,
        sessionId: data?.sessionId,
      });
    }
  }

  /**
   * Handle generation progress updates from AI service
   */
  handleGenerationProgress(socket, data) {
    try {
      const { sessionId, progress, status, message, configType } = data;

      // Forward to AI namespace for client distribution
      const aiNamespace = webSocketManager.getIO().of("/ai");
      aiNamespace.to(`session:${sessionId}`).emit("ai:progress", {
        sessionId,
        progress,
        status,
        message,
        configType,
        timestamp: new Date().toISOString(),
      });

      logger.debug("Generation progress forwarded to clients", {
        sessionId,
        progress,
        status,
        configType,
      });
    } catch (error) {
      logger.error("Error handling generation progress", {
        error: error.message,
        sessionId: data?.sessionId,
      });
    }
  }

  /**
   * Handle generation completion from AI service
   */
  handleGenerationComplete(socket, data) {
    try {
      const { sessionId, result, status, configType } = data;

      // Forward to AI namespace for client distribution
      const aiNamespace = webSocketManager.getIO().of("/ai");
      aiNamespace.to(`session:${sessionId}`).emit("ai:generation_complete", {
        sessionId,
        status: status || "completed",
        data: result,
        configType,
        timestamp: new Date().toISOString(),
      });

      logger.info("Generation completion forwarded to clients", {
        sessionId,
        status,
        configType,
      });
    } catch (error) {
      logger.error("Error handling generation completion", {
        error: error.message,
        sessionId: data?.sessionId,
      });
    }
  }

  /**
   * Handle service errors from AI service
   */
  handleServiceError(socket, data) {
    try {
      const { sessionId, error, context } = data;

      // Forward to AI namespace for client distribution
      const aiNamespace = webSocketManager.getIO().of("/ai");

      if (sessionId) {
        aiNamespace.to(`session:${sessionId}`).emit("ai:error", {
          sessionId,
          error,
          context,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Broadcast general error
        aiNamespace.emit("ai:service_error", {
          error,
          context,
          timestamp: new Date().toISOString(),
        });
      }

      logger.error("AI service error forwarded to clients", {
        sessionId,
        error,
        context,
      });
    } catch (err) {
      logger.error("Error handling service error", {
        error: err.message,
        originalError: data?.error,
      });
    }
  }

  /**
   * Handle AI service disconnection
   */
  handleServiceDisconnection(socket, reason) {
    try {
      const serviceInfo = this.connectedAIServices.get(socket.id);

      if (serviceInfo) {
        logger.warning("AI Service disconnected", {
          serviceId: serviceInfo.serviceId,
          reason,
          socketId: socket.id,
          connectedDuration: Date.now() - serviceInfo.connectedAt.getTime(),
        });

        // Clean up
        this.connectedAIServices.delete(socket.id);

        // Notify other parts of the system
        this.emit("service_disconnected", {
          serviceId: serviceInfo.serviceId,
          reason,
          socketId: socket.id,
        });
      }
    } catch (error) {
      logger.error("Error handling service disconnection", {
        error: error.message,
        socketId: socket.id,
      });
    }
  }

  /**
   * Send request to AI service
   */
  async sendToAIService(eventName, data) {
    try {
      // Get first available AI service
      const aiService = Array.from(this.connectedAIServices.values())[0];

      if (!aiService) {
        throw new Error("No AI service connected");
      }

      aiService.socket.emit(eventName, data);

      logger.debug("Request sent to AI service", {
        eventName,
        sessionId: data.sessionId,
        serviceId: aiService.serviceId,
      });

      return true;
    } catch (error) {
      logger.error("Failed to send request to AI service", {
        error: error.message,
        eventName,
        sessionId: data?.sessionId,
      });
      return false;
    }
  }

  /**
   * Get connected AI services status
   */
  getStatus() {
    const services = Array.from(this.connectedAIServices.values()).map(
      (service) => ({
        serviceId: service.serviceId,
        serviceVersion: service.serviceVersion,
        capabilities: service.capabilities,
        connectedAt: service.connectedAt,
        socketId: service.socket.id,
      })
    );

    return {
      isInitialized: this.isInitialized,
      connectedServices: services.length,
      services,
    };
  }

  /**
   * Shutdown the bridge service
   */
  async shutdown() {
    try {
      // Disconnect all AI services
      for (const service of this.connectedAIServices.values()) {
        service.socket.disconnect();
      }

      this.connectedAIServices.clear();
      this.activeSessions.clear();
      this.isInitialized = false;

      logger.info("AI Service Bridge shutdown completed");
    } catch (error) {
      logger.error("Error during AI Service Bridge shutdown", {
        error: error.message,
      });
    }
  }
}

// Create and export singleton instance
const aiServiceBridgeService = new AIServiceBridgeService();

module.exports = aiServiceBridgeService;
