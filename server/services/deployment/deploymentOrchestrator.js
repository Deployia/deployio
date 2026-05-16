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
const webSocketManager = require("@config/webSocketManager");
const {
  notifyDeploymentStatusChange,
} = require("../notification/deploymentNotifications");

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
   * Get the appropriate agent for deployment
   * Resolves agent dynamically, falling back to available agents
   */
  _getDeploymentAgent() {
    // Try to get from environment variable first
    let preferredAgentId = process.env.DEFAULT_AGENT_ID;

    // Ask bridge service for an available agent (prefers the requested one)
    const availableAgent =
      this.bridgeService.getAvailableAgent(preferredAgentId);

    if (!availableAgent) {
      logger.error("No agents available for deployment", {
        preferredAgent: preferredAgentId,
      });
      return null;
    }

    if (availableAgent !== preferredAgentId && preferredAgentId) {
      logger.info("Agent ID mismatch — using available agent", {
        preferred: preferredAgentId,
        actual: availableAgent,
      });
    }

    return availableAgent;
  }

  /**
   * Map Docker engine / bridge statuses onto Deployment schema values.
   */
  _normalizeAgentStatus(raw) {
    if (raw == null || typeof raw !== "string") return "pending";
    const s = raw.toLowerCase();
    const platform = new Set([
      "pending",
      "queued",
      "cloning",
      "detecting",
      "building",
      "deploying",
      "running",
      "stopping",
      "failed",
      "stopped",
      "cancelled",
      "deleted",
      "error",
    ]);
    if (platform.has(s)) return s;
    const docker = {
      created: "deploying",
      restarting: "deploying",
      removing: "stopping",
      paused: "stopped",
      exited: "stopped",
      dead: "failed",
      not_found: "stopped",
      unknown: "deploying",
    };
    return docker[s] || "deploying";
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

      // Resolve agent dynamically
      const agentId = this._getDeploymentAgent();
      if (!agentId) {
        logger.error("Cannot trigger deployment — no agent available", {
          deploymentId,
        });
        return false;
      }
      const subdomain =
        deployment.networking?.subdomain ||
        deployment.config?.subdomain ||
        deploymentId;

      // Determine Docker image — projects seeded via pipeline may have a dockerImage field
      const dockerImage = project.dockerImage || deployment.dockerImage || null;

      // Repo/branch info for agent-side build when image not provided
      const repoUrl =
        project.repository?.url || project.repository?.git || null;
      const branch =
        deployment.config?.branch || project.repository?.branch || "main";

      const deploymentEnvironment =
        deployment.config?.environment || "production";
      const deploymentEnvVars = Array.isArray(deployment.environmentVariables)
        ? deployment.environmentVariables
        : [];
      const projectEnvVars = Array.isArray(
        project.deployment?.environment?.[deploymentEnvironment],
      )
        ? project.deployment.environment[deploymentEnvironment]
        : [];

      const { normalizeEnvVarValue } = require("../../utils/envVarNormalize");
      const mergedEnvVars = [...projectEnvVars, ...deploymentEnvVars].reduce(
        (acc, envVar) => {
          if (!envVar?.key) return acc;
          acc[envVar.key] = normalizeEnvVarValue(
            envVar.key,
            envVar.value ?? "",
          );
          return acc;
        },
        {},
      );

      // Determine container port from deployment config or project defaults
      const containerPort =
        deployment.containerPort ||
        project.deployment?.buildConfig?.port ||
        project.deployment?.runtime?.port ||
        3000;

      // Environment variables from deployment config
      const envVars = {
        NODE_ENV: deploymentEnvironment,
        PORT: String(containerPort),
        ...mergedEnvVars,
      };

      const payload = {
        deploymentId,
        // If an image is provided, agent can directly run it; otherwise agent should clone+build
        image: dockerImage,
        repoUrl,
        branch,
        subdomain,
        port: containerPort,
        envVars,
        projectName: project.name,
        environment: deploymentEnvironment,
        // instruct agent to build if no image is available
        buildIfMissing: !dockerImage,
        // dockerfile path selected by the user (relative to repo root)
        dockerfilePath: project.deployment?.dockerfile?.path || "Dockerfile",
      };

      logger.info("Sending deployment:trigger to agent", {
        deploymentId,
        agent: agentId,
        image: dockerImage,
        subdomain,
      });

      // Update status to "queued" while we wait for the agent
      await Deployment.findOneAndUpdate(
        { deploymentId },
        {
          status: "queued",
          queuedAt: new Date(),
        },
      );
      // Send to connected agent via WebSocket bridge
      const sent = await this.bridgeService.sendToAgent(
        agentId,
        "deployment_trigger",
        payload,
      );

      if (!sent) {
        // Agent is offline; leave the deployment queued so it can be retried
        logger.warn("Agent not connected — leaving deployment queued", {
          deploymentId,
          agent: agentId,
        });

        // Update queue attempt metadata, keep status as queued
        await Deployment.findOneAndUpdate(
          { deploymentId },
          {
            status: "queued",
            queuedAt: new Date(),
          },
          { new: true },
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
      let { deploymentId, status, message, container_id, url } = data;

      if (!deploymentId) {
        logger.warn("Received status_update without deploymentId");
        return;
      }

      status = this._normalizeAgentStatus(status);

      // Align agent terminal state with dashboard filters (failed vs error).
      if (status === "error") {
        status = "failed";
      }

      logger.info("Deployment status update received", {
        deploymentId,
        status,
        message,
      });

      const setFields = { status, updatedAt: new Date() };
      let pushFields = null;

      // Map agent status to schema lifecycle fields
      const lifecycleMap = {
        queued: "queuedAt",
        cloning: "buildStartedAt",
        detecting: "buildStartedAt",
        building: "buildStartedAt",
        deploying: "deployStartedAt",
        running: "deployCompletedAt",
        failed: "stoppedAt",
        stopped: "stoppedAt",
        error: "stoppedAt",
      };

      if (lifecycleMap[status]) {
        setFields[lifecycleMap[status]] = new Date();
      }
      if (status === "deploying") {
        setFields.buildCompletedAt = new Date();
      }

      // If container info provided, store it
      if (container_id) {
        setFields["runtime.containerId"] = container_id;
      }
      if (url) {
        setFields["networking.fullUrl"] = url;
      }

      // If failed, record error
      if (status === "failed" && message) {
        pushFields = {
          "build.logs": {
            timestamp: new Date(),
            level: "error",
            source: "deploy",
            message,
          },
        };
      }

      const existing = await Deployment.findOne({ deploymentId }).select(
        "status deployedBy project",
      );

      if (!existing) {
        logger.warn("Deployment not found for status update", { deploymentId });
        return;
      }

      const previousStatus = existing.status;

      const buildPipelineStatuses = new Set([
        "pending",
        "queued",
        "cloning",
        "detecting",
        "building",
        "deploying",
      ]);
      if (
        buildPipelineStatuses.has(previousStatus) &&
        status === "stopped" &&
        !existing.runtime?.containerId
      ) {
        logger.debug("Ignoring spurious stopped status during build pipeline", {
          deploymentId,
          previousStatus,
        });
        return;
      }

      const deployment = await Deployment.findOneAndUpdate(
        { deploymentId },
        { $set: setFields, ...(pushFields ? { $push: pushFields } : {}) },
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

      const logsNs = webSocketManager.getNamespace("/logs");
      if (logsNs) {
        logsNs.to(`deployment:${deploymentId}`).emit("deployment:status_update", {
          deploymentId,
          status,
          message,
          url: deployment.networking?.fullUrl,
          timestamp: new Date().toISOString(),
        });
      }

      if (previousStatus !== status && existing.deployedBy) {
        notifyDeploymentStatusChange({
          userId: existing.deployedBy.toString(),
          previousStatus,
          newStatus: status,
          deployment,
          message,
        });
      }
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
      const normalizedLevel = ["info", "warn", "error", "debug"].includes(level)
        ? level
        : "info";
      const source = level === "build" ? "build" : "deploy";

      await Deployment.findOneAndUpdate(
        { deploymentId },
        {
          $push: {
            "build.logs": {
              $each: [
                {
                  timestamp: new Date(),
                  level: normalizedLevel,
                  message: message || "",
                  source,
                },
              ],
              $slice: -2000,
            },
          },
        },
      );

      const logsNs = webSocketManager.getNamespace("/logs");
      if (logsNs) {
        logsNs.to(`deployment:${deploymentId}`).emit("deployment:log_update", {
          deploymentId,
          level: normalizedLevel,
          source,
          message: message || "",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error("Error handling build log:", error);
    }
  }

  async handleRuntimeMetrics(data) {
    try {
      const { deploymentId, metrics = {} } = data || {};
      if (!deploymentId) return;

      await Deployment.findOneAndUpdate(
        { deploymentId },
        {
          $set: {
            "runtime.resources": metrics.resources || {},
            "runtime.lastSeenAt": new Date(),
            "runtime.uptimeSeconds":
              metrics.uptime?.seconds ?? metrics.uptimeSeconds ?? 0,
            "metrics.requests.total":
              metrics.requests?.total ?? metrics.http?.requests ?? 0,
            "metrics.errors.total":
              metrics.errors?.total ?? metrics.http?.errors ?? 0,
            "metrics.uptime.percentage":
              metrics.uptime?.percentage ?? metrics.uptime ?? 0,
            "metrics.lastUpdatedAt": new Date(),
          },
        },
      );

      const logsNs = webSocketManager.getNamespace("/logs");
      if (logsNs) {
        logsNs
          .to(`deployment:${deploymentId}`)
          .emit("deployment:metrics_update", {
            deploymentId,
            metrics,
            timestamp: new Date().toISOString(),
          });
      }
    } catch (error) {
      logger.error("Error handling runtime metrics:", error);
    }
  }

  async handleRuntimeLogsResponse(data) {
    try {
      const { deploymentId, logs, error } = data || {};
      if (!deploymentId) return;
      if (error) {
        const logsNs = webSocketManager.getNamespace("/logs");
        if (logsNs) {
          logsNs.to(`deployment:${deploymentId}`).emit("deployment:runtime_log_update", {
            deploymentId,
            level: "error",
            source: "runtime",
            message: `Runtime log fetch failed: ${error}`,
            timestamp: new Date().toISOString(),
          });
        }
        return;
      }
      if (typeof logs !== "string") return;

      const entries = logs
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-120)
        .map((line) => ({
          deploymentId,
          level: "info",
          source: "runtime",
          message: line,
          timestamp: new Date().toISOString(),
        }));

      const logsNs = webSocketManager.getNamespace("/logs");
      if (logsNs) {
        entries.forEach((entry) => {
          logsNs
            .to(`deployment:${deploymentId}`)
            .emit("deployment:runtime_log_update", entry);
        });
      }
    } catch (error) {
      logger.error("Error handling runtime logs response:", error);
    }
  }

  /**
   * Stop a deployment via the agent.
   */
  async stopDeploy(deploymentId) {
    if (!this.isInitialized || !this.bridgeService) return false;

    try {
      const agentId = this._getDeploymentAgent();
      if (!agentId) {
        logger.error("Cannot stop deployment — no agent available", {
          deploymentId,
        });
        return false;
      }

      const sent = await this.bridgeService.sendToAgent(
        agentId,
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
      const agentId = this._getDeploymentAgent();
      if (!agentId) {
        logger.error("Cannot restart deployment — no agent available", {
          deploymentId,
        });
        return false;
      }

      const sent = await this.bridgeService.sendToAgent(
        agentId,
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
    const connectedAgents = this.bridgeService
      ? Array.from(this.bridgeService.connectedAgents.keys())
      : [];
    return {
      initialized: this.isInitialized,
      connectedAgents,
      totalAgentsConnected: connectedAgents.length,
      availableForDeployment: connectedAgents.length > 0,
      bridgeConnected: this.bridgeService
        ? this.bridgeService.connectedAgents?.size > 0
        : false,
    };
  }
}

// Singleton
const deploymentOrchestrator = new DeploymentOrchestrator();

module.exports = deploymentOrchestrator;
