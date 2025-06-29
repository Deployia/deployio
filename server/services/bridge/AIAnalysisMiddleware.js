/**
 * AI Analysis Middleware
 * Sends agent logs and metrics to AI service for analysis
 * Handles AI insights and anomaly detection
 */

const logger = require("@config/logger");
const axios = require("axios");

class AIAnalysisMiddleware {
  constructor() {
    this.isInitialized = false;
    this.aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    this.aiServiceEnabled = process.env.AI_ANALYSIS_ENABLED !== "false";
    this.batchSize = parseInt(process.env.AI_BATCH_SIZE) || 50;
    this.batchInterval = parseInt(process.env.AI_BATCH_INTERVAL) || 10000; // 10 seconds
    this.pendingAnalysis = [];
    this.batchTimer = null;
    this.analysisStats = {
      totalSent: 0,
      totalErrors: 0,
      insightsReceived: 0,
      anomaliesDetected: 0,
    };
  }

  /**
   * Initialize AI analysis middleware
   */
  async initialize() {
    try {
      logger.info("Initializing AI Analysis Middleware...");

      if (!this.aiServiceEnabled) {
        logger.info("AI Analysis disabled by configuration");
        this.isInitialized = true;
        return true;
      }

      // Test AI service connectivity
      const isConnected = await this._testAIServiceConnection();
      if (!isConnected) {
        logger.warning(
          "AI Service not reachable, continuing without AI analysis"
        );
        this.aiServiceEnabled = false;
      }

      // Start batch processing timer
      this._startBatchProcessing();

      this.isInitialized = true;

      logger.info("✅ AI Analysis Middleware initialized", {
        enabled: this.aiServiceEnabled,
        aiServiceUrl: this.aiServiceUrl,
        batchSize: this.batchSize,
        batchInterval: this.batchInterval,
      });

      return true;
    } catch (error) {
      logger.error("Failed to initialize AI Analysis Middleware", {
        error: error.message,
      });
      // Continue without AI analysis
      this.aiServiceEnabled = false;
      this.isInitialized = true;
      return true;
    }
  }

  /**
   * Process log data through AI analysis
   */
  async processLogData(data, metadata) {
    try {
      if (!this.aiServiceEnabled || !this.isInitialized) {
        return;
      }

      // Prepare data for AI analysis
      const analysisPayload = this._prepareAnalysisPayload(data, metadata);

      // Add to batch queue
      this.pendingAnalysis.push(analysisPayload);

      // Process immediately if batch is full
      if (this.pendingAnalysis.length >= this.batchSize) {
        await this._processBatch();
      }
    } catch (error) {
      logger.error("Error processing log data for AI analysis", {
        error: error.message,
        metadata,
      });
    }
  }

  /**
   * Test AI service connection
   */
  async _testAIServiceConnection() {
    try {
      const response = await httpx.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.status === 200;
    } catch (error) {
      logger.debug("AI Service connection test failed", {
        error: error.message,
        aiServiceUrl: this.aiServiceUrl,
      });
      return false;
    }
  }

  /**
   * Prepare data for AI analysis
   */
  _prepareAnalysisPayload(data, metadata) {
    return {
      id: `${metadata.agentId}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: {
        agentId: metadata.agentId,
        namespace: metadata.namespace,
        event: metadata.event,
        room: metadata.room,
      },
      data: {
        ...data,
        // Ensure we have essential fields for AI analysis
        level: data.level || "INFO",
        message: data.message || data.logs?.[0]?.message || "No message",
        timestamp: data.timestamp || new Date().toISOString(),
      },
      analysisType: this._determineAnalysisType(metadata.namespace, data),
      priority: this._determinePriority(data),
    };
  }

  /**
   * Determine analysis type based on namespace and data
   */
  _determineAnalysisType(namespace, data) {
    if (namespace === "/agent-logs") {
      if (data.log_type === "system") {
        return "system_log_analysis";
      } else if (data.log_type === "container") {
        return "container_log_analysis";
      }
      return "general_log_analysis";
    }

    if (namespace === "/agent-metrics") {
      return "metrics_analysis";
    }

    if (namespace === "/agent-builds") {
      return "build_analysis";
    }

    if (namespace === "/agent-deployments") {
      return "deployment_analysis";
    }

    return "general_analysis";
  }

  /**
   * Determine priority based on log data
   */
  _determinePriority(data) {
    const level = (data.level || "INFO").toLowerCase();

    if (level === "error" || level === "critical") {
      return "high";
    }

    if (level === "warning" || level === "warn") {
      return "medium";
    }

    // Check for error keywords in message
    const message = (data.message || "").toLowerCase();
    const errorKeywords = [
      "error",
      "exception",
      "failed",
      "timeout",
      "connection",
      "refused",
    ];

    if (errorKeywords.some((keyword) => message.includes(keyword))) {
      return "medium";
    }

    return "low";
  }

  /**
   * Start batch processing timer
   */
  _startBatchProcessing() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(async () => {
      if (this.pendingAnalysis.length > 0) {
        await this._processBatch();
      }
    }, this.batchInterval);

    logger.debug("✅ AI batch processing timer started", {
      interval: this.batchInterval,
    });
  }

  /**
   * Process batch of log data
   */
  async _processBatch() {
    if (this.pendingAnalysis.length === 0) {
      return;
    }

    try {
      const batch = this.pendingAnalysis.splice(0, this.batchSize);

      logger.debug("Processing AI analysis batch", {
        batchSize: batch.length,
      });

      // Send to AI service
      const response = await httpx.post(
        `${this.aiServiceUrl}/api/v1/analyze/batch`,
        {
          json: {
            batch,
            requestId: `batch-${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN || ""}`,
          },
        }
      );

      if (response.status === 200) {
        this.analysisStats.totalSent += batch.length;

        // Process AI response
        const analysisResults = response.data;
        await this._handleAnalysisResults(analysisResults);

        logger.debug("✅ AI analysis batch processed successfully", {
          batchSize: batch.length,
          totalSent: this.analysisStats.totalSent,
        });
      } else {
        throw new Error(`AI Service returned status ${response.status}`);
      }
    } catch (error) {
      logger.error("Error processing AI analysis batch", {
        error: error.message,
        batchSize: this.pendingAnalysis.length,
      });

      this.analysisStats.totalErrors++;

      // Optionally retry or handle failed batch
      // For now, we'll just log and continue
    }
  }

  /**
   * Handle AI analysis results
   */
  async _handleAnalysisResults(results) {
    try {
      if (!results || !results.insights) {
        return;
      }

      this.analysisStats.insightsReceived += results.insights.length || 0;

      // Process insights
      for (const insight of results.insights) {
        await this._processInsight(insight);
      }

      // Process anomalies
      if (results.anomalies) {
        this.analysisStats.anomaliesDetected += results.anomalies.length;

        for (const anomaly of results.anomalies) {
          await this._processAnomaly(anomaly);
        }
      }
    } catch (error) {
      logger.error("Error handling AI analysis results", {
        error: error.message,
      });
    }
  }

  /**
   * Process AI insight
   */
  async _processInsight(insight) {
    try {
      logger.info("AI Insight received", {
        type: insight.type,
        severity: insight.severity,
        message: insight.message,
        agentId: insight.agentId,
      });

      // TODO: Send insights to relevant users/admins via WebSocket
      // For now, just log the insight
    } catch (error) {
      logger.error("Error processing AI insight", {
        error: error.message,
        insight,
      });
    }
  }

  /**
   * Process AI anomaly detection
   */
  async _processAnomaly(anomaly) {
    try {
      logger.info("AI Anomaly detected", {
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        agentId: anomaly.agentId,
        confidence: anomaly.confidence,
      });

      // TODO: Send anomaly alerts to admins
      // TODO: Trigger automated responses if configured
    } catch (error) {
      logger.error("Error processing AI anomaly", {
        error: error.message,
        anomaly,
      });
    }
  }

  /**
   * Get AI middleware status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.aiServiceEnabled,
      aiServiceUrl: this.aiServiceUrl,
      pendingAnalysis: this.pendingAnalysis.length,
      stats: this.analysisStats,
    };
  }

  /**
   * Get AI analysis statistics
   */
  getStats() {
    return {
      ...this.analysisStats,
      pendingBatch: this.pendingAnalysis.length,
      batchSize: this.batchSize,
      batchInterval: this.batchInterval,
    };
  }

  /**
   * Cleanup AI middleware
   */
  async cleanup() {
    logger.info("Cleaning up AI Analysis Middleware...");

    // Stop batch processing
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Process remaining batch
    if (this.pendingAnalysis.length > 0) {
      try {
        await this._processBatch();
      } catch (error) {
        logger.error("Error processing final batch during cleanup", {
          error: error.message,
        });
      }
    }

    this.pendingAnalysis = [];
    this.isInitialized = false;

    logger.info("✅ AI Analysis Middleware cleanup completed");
  }
}

module.exports = AIAnalysisMiddleware;
