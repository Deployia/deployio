/**
 * Deployment Orchestrator
 *
 * Bridges the gap between deploymentService (DB records) and the Agent
 * (actual Docker container management). When a deployment is created,
 * this module sends the deployment:trigger event to the connected agent
 * via AgentBridgeService. It also handles incoming status_update and
 * build_log events from the agent and persists them to the DB.
 */

const Deployment = require("@models/Deployment");
const Project = require("@models/Project");
const logger = require("@config/logger");

class DeploymentOrchestrator {
  constructor() {
    this.bridgeService = null;
    this.isInitialized = false;
    // Default agent for single-agent setup
    this.defaultAgentId = process.env.DEFAULT_AGENT_ID || "agent-ec2-2";
  }

  /**
   * Initialize with a reference to AgentBridgeService
   * Called during server startup after WebSocket init.
   */
  initialize(bridgeService) {
    this.bridgeService = bridgeService;
    this.isInitialized = true;
    logger.info("DeploymentOrchestrator initialized", {
      defaultAgent: this.defaultAgentId,
    });
  }

  /**
   * Trigger a deployment on the agent.
   * Called from deploymentService.createDeployment() after the DB record is saved.
   *
   * @param {Object} deployment — Mongoose deployment document (or plain object)
   * @param {Object} project — Mongoose project document (or plain object)
   * @returns {boolean} — whether the trigger was sent successfully
   */
  async triggerDeploy(deployment, project) {
    if (!this.isInitialized || !this.bridgeService) {
      logger.error(
        "DeploymentOrchestrator not initialized — cannot trigger deployment",
      );
      return false;
    }

    try {
      const deploymentId =
        deployment.deploymentId || deployment._id?.toString();
      const subdomain =
        deployment.networking?.subdomain ||
        deployment.config?.subdomain ||
        deploymentId;

      // Determine Docker image — projects seeded via pipeline have a dockerImage field
      const dockerImage =
        project.dockerImage ||
        deployment.dockerImage ||
        `${project.slug || project.name.toLowerCase().replace(/\s+/g, "-")}:latest`;

      // Determine container port from project stack or default
      const containerPort =
        deployment.containerPort || project.stack?.containerPort || 3000;

      // Environment variables from deployment config
      const envVars = {
        NODE_ENV: deployment.config?.environment || "production",
        PORT: String(containerPort),
        ...(deployment.config?.envVars || {}),
        ...(project.deploymentConfig?.envVars || {}),
      };

      const payload = {
        deploymentId,
        image: dockerImage,
        subdomain,
        port: containerPort,
        envVars,
        projectName: project.name,
        environment: deployment.config?.environment || "production",
      };

      logger.info("Sending deployment:trigger to agent", {
        deploymentId,
        agent: this.defaultAgentId,
        image: dockerImage,
        subdomain,
      });

      // Update status to "queued" while we wait for the agent
      await Deployment.findOneAndUpdate(
        { deploymentId },
        {
          status: "queued",
          "timeline.queuedAt": new Date(),
        },
      );

      // Send to connected agent via WebSocket bridge
      const sent = await this.bridgeService.sendToAgent(
        this.defaultAgentId,
        "deployment_trigger",
        payload,
      );

      if (!sent) {
        logger.error("Agent not connected — deployment stuck in queued", {
          deploymentId,
          agent: this.defaultAgentId,
        });

        await Deployment.findOneAndUpdate(
          { deploymentId },
          {
            status: "failed",
            "error.message": "Agent not connected",
            "error.code": "AGENT_OFFLINE",
            "timeline.failedAt": new Date(),
          },
        );
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error in triggerDeploy:", error);
      return false;
    }
  }

  /**
   * Handle deployment:status_update from agent.
   * Updates the DB record with the new status and optional container metadata.
   */
  async handleStatusUpdate(data) {
    try {
      const { deploymentId, status, message, container_id, url } = data;

      if (!deploymentId) {
        logger.warn("Received status_update without deploymentId");
        return;
      }

      logger.info("Deployment status update received", {
        deploymentId,
        status,
        message,
      });

      const updateFields = { status };

      // Map agent status to timeline fields
      const timelineMap = {
        building: "timeline.buildStartedAt",
        deploying: "timeline.deployStartedAt",
        running: "timeline.completedAt",
        failed: "timeline.failedAt",
        stopped: "timeline.stoppedAt",
      };

      if (timelineMap[status]) {
        updateFields[timelineMap[status]] = new Date();
      }

      // If container info provided, store it
      if (container_id) {
        updateFields["container.containerId"] = container_id;
      }
      if (url) {
        updateFields["networking.fullUrl"] = url;
        updateFields["networking.isAccessible"] = status === "running";
      }

      // If failed, record error
      if (status === "failed" && message) {
        updateFields["error.message"] = message;
        updateFields["error.timestamp"] = new Date();
      }

      const deployment = await Deployment.findOneAndUpdate(
        { deploymentId },
        { $set: updateFields },
        { new: true },
      );

      if (!deployment) {
        logger.warn("Deployment not found for status update", { deploymentId });
        return;
      }

      // If deployment succeeded, update project stats
      if (status === "running") {
        try {
          const project = await Project.findById(deployment.project);
          if (project) {
            await project.incrementDeploymentCount(true);
            project.lastDeployedAt = new Date();
            await project.save();
          }
        } catch (err) {
          logger.error("Error updating project stats after deploy", err);
        }
      }

      logger.info("Deployment record updated", {
        deploymentId,
        status,
        dbId: deployment._id,
      });
    } catch (error) {
      logger.error("Error handling status update:", error);
    }
  }

  /**
   * Handle deployment:build_log from agent.
   * Appends a build log entry to the deployment record.
   */
  async handleBuildLog(data) {
    try {
      const { deploymentId, level, message } = data;
      if (!deploymentId) return;

      await Deployment.findOneAndUpdate(
        { deploymentId },
        {
          $push: {
            buildLogs: {
              timestamp: new Date(),
              level: level || "info",
              message: message || "",
            },
          },
        },
      );
    } catch (error) {
      logger.error("Error handling build log:", error);
    }
  }

  /**
   * Stop a deployment via the agent.
   */
  async stopDeploy(deploymentId) {
    if (!this.isInitialized || !this.bridgeService) return false;

    try {
      const sent = await this.bridgeService.sendToAgent(
        this.defaultAgentId,
        "deployment_stop",
        { deploymentId },
      );

      if (sent) {
        await Deployment.findOneAndUpdate(
          { deploymentId },
          { status: "stopping" },
        );
      }

      return sent;
    } catch (error) {
      logger.error("Error in stopDeploy:", error);
      return false;
    }
  }

  /**
   * Restart a deployment via the agent.
   */
  async restartDeploy(deploymentId) {
    if (!this.isInitialized || !this.bridgeService) return false;

    try {
      const sent = await this.bridgeService.sendToAgent(
        this.defaultAgentId,
        "deployment_restart",
        { deploymentId },
      );

      return sent;
    } catch (error) {
      logger.error("Error in restartDeploy:", error);
      return false;
    }
  }

  /**
   * Get orchestrator status.
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      defaultAgent: this.defaultAgentId,
      bridgeConnected: this.bridgeService
        ? this.bridgeService.connectedAgents?.size > 0
        : false,
    };
  }
}

// Singleton
const deploymentOrchestrator = new DeploymentOrchestrator();

module.exports = deploymentOrchestrator;
