/**
 * AI Service Bridge Service
 * Manages WebSocket communication between AI Service and Server
 */

const EventEmitter = require("events");
const logger = require("@config/logger");
const webSocketManager = require("@config/webSocketManager");
const AIStreamRouter = require("./AIStreamRouter");

class AIServiceBridgeService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.streamRouter = new AIStreamRouter();
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

      // Initialize stream router
      await this.streamRouter.initialize();

      // Setup AI service namespace for receiving connections
      await this._setupAIServiceNamespace();

      this.isInitialized = true;

      logger.info("AI Service Bridge initialized successfully", {
        namespace: "/ai-service",
        streamRouter: this.streamRouter.isInitialized,
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

      // Handle service registration with handshake
      socket.on("register_service", async (data) => {
        await this.handleServiceRegistration(socket, data);
      });

      // Handle bridge handshake - similar to agent bridge
      socket.on("bridge_handshake", async (data) => {
        logger.info("Received bridge handshake from AI service", {
          handshakeId: data.handshake_id,
          serviceId: data.service_id,
          capabilities: data.capabilities,
          serviceVersion: data.service_version,
        });

        const serviceInfo = this.connectedAIServices.get(socket.id);
        if (serviceInfo) {
          serviceInfo.handshakeCompleted = true;
          serviceInfo.connectionStatus = "established";
          serviceInfo.capabilities = data.capabilities;
          serviceInfo.serviceVersion = data.service_version;
        }

        // Send handshake response back to AI service
        socket.emit("bridge_handshake_ack", {
          handshakeId: data.handshake_id,
          serverTime: new Date().toISOString(),
          status: "handshake_complete",
          bridgeReady: true,
        });

        logger.info("Bridge handshake completed successfully", {
          serviceId: data.service_id,
          status: "fully_connected",
          capabilities: data.capabilities,
        });
      });

      // Handle connection ACK - AI service confirms connection establishment
      socket.on("connection_ack", async (data) => {
        logger.info("Received connection ACK from AI service", {
          serviceId: data.service_id,
          clientTime: data.client_time,
          status: data.status,
          message: data.message,
        });

        const serviceInfo = this.connectedAIServices.get(socket.id);
        if (serviceInfo) {
          serviceInfo.connectionAcked = true;
          serviceInfo.lastAck = new Date();
        }
      });

      // Heartbeat
      socket.on("heartbeat", (data) => {
        const serviceInfo = this.connectedAIServices.get(socket.id);
        if (serviceInfo) {
          serviceInfo.lastHeartbeat = new Date();
        }
      });

      // Bridge pong - health check response
      socket.on("bridge_pong", (data) => {
        logger.debug("📡 Received bridge pong from AI service", {
          pingId: data.ping_id,
          timestamp: data.timestamp,
        });

        const serviceInfo = this.connectedAIServices.get(socket.id);
        if (serviceInfo) {
          serviceInfo.lastPong = new Date();
          serviceInfo.healthStatus = "healthy";
        }
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

      // Check if only one AI service should be connected
      if (this.connectedAIServices.size > 0) {
        logger.warn(
          "Multiple AI services attempting to connect - only one allowed",
          {
            existingServices: this.connectedAIServices.size,
            newServiceId: serviceId || "ai-service-1",
          }
        );
      }

      // Store connection info
      const connectionInfo = {
        serviceId: serviceId || "ai-service-1",
        serviceVersion: serviceVersion || "1.0.0",
        capabilities: capabilities || ["analysis", "generation"],
        socket,
        connectedAt: new Date(),
        lastHeartbeat: new Date(),
        connectionStatus: "establishing",
        handshakeCompleted: false,
        connectionAcked: false,
        healthStatus: "unknown",
      };

      this.connectedAIServices.set(socket.id, connectionInfo);

      // Send connection establishment with verification data
      const establishmentData = {
        serviceId: serviceId || "ai-service-1",
        serverTime: new Date().toISOString(),
        availableFeatures: [
          "analysis_processing",
          "generation_processing",
          "progress_streaming",
          "error_handling",
        ],
        bridgeStatus: "connected",
        connectionId: socket.id,
      };

      socket.emit("connection_established", establishmentData);

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

      // Start periodic health check for this AI service
      this._startServiceHealthCheck(serviceId || "ai-service-1");
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

      // Route through stream router
      this.streamRouter.routeStream({
        event: "analysis_progress",
        data: {
          session_id: sessionId,
          progress,
          status,
          message,
        },
        serviceId: this._getServiceId(socket),
        timestamp: new Date().toISOString(),
      });

      logger.debug("Analysis progress routed through stream router", {
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

      // Route through stream router
      this.streamRouter.routeStream({
        event: "analysis_complete",
        data: {
          session_id: sessionId,
          result,
          status: status || "completed",
        },
        serviceId: this._getServiceId(socket),
        timestamp: new Date().toISOString(),
      });

      logger.info("Analysis completion routed through stream router", {
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

      // Route through stream router
      this.streamRouter.routeStream({
        event: "generation_progress",
        data: {
          session_id: sessionId,
          progress,
          status,
          message,
          config_type: configType,
        },
        serviceId: this._getServiceId(socket),
        timestamp: new Date().toISOString(),
      });

      logger.debug("Generation progress routed through stream router", {
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

      // Route through stream router
      this.streamRouter.routeStream({
        event: "generation_complete",
        data: {
          session_id: sessionId,
          result,
          status: status || "completed",
          config_type: configType,
        },
        serviceId: this._getServiceId(socket),
        timestamp: new Date().toISOString(),
      });

      logger.info("Generation completion routed through stream router", {
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

      // Route through stream router
      this.streamRouter.routeStream({
        event: "service_error",
        data: {
          session_id: sessionId,
          error,
          context,
        },
        serviceId: this._getServiceId(socket),
        timestamp: new Date().toISOString(),
      });

      logger.error("AI service error routed through stream router", {
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
        logger.warn("AI Service disconnected", {
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
   * Start periodic health check for AI service
   */
  _startServiceHealthCheck(serviceId) {
    const healthCheckInterval = setInterval(() => {
      const serviceInfo = Array.from(this.connectedAIServices.values()).find(
        (s) => s.serviceId === serviceId
      );

      if (!serviceInfo) {
        clearInterval(healthCheckInterval);
        return;
      }

      // Send ping to AI service
      serviceInfo.socket.emit("bridge_ping", {
        ping_id: `ping_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });

      logger.debug("📡 Sent bridge ping to AI service", {
        serviceId,
        socketId: serviceInfo.socket.id,
      });
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Get AI service bridge status
   */
  getStatus() {
    const services = Array.from(this.connectedAIServices.values()).map(
      (service) => ({
        serviceId: service.serviceId,
        status: service.connectionStatus,
        capabilities: service.capabilities,
        connectedAt: service.connectedAt,
        handshakeCompleted: service.handshakeCompleted,
        connectionAcked: service.connectionAcked,
        lastHeartbeat: service.lastHeartbeat,
        healthStatus: service.healthStatus,
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
      // Shutdown stream router
      if (this.streamRouter) {
        await this.streamRouter.shutdown();
      }

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

  /**
   * Get service ID from socket
   */
  _getServiceId(socket) {
    const serviceInfo = this.connectedAIServices.get(socket.id);
    return serviceInfo ? serviceInfo.serviceId : "unknown";
  }
}

// Create and export singleton instance
const aiServiceBridgeService = new AIServiceBridgeService();

module.exports = aiServiceBridgeService;
