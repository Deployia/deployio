const Deployment = require("@models/Deployment");
const deploymentService = require("@services/deployment/deploymentService");
const deploymentOrchestrator = require("@services/deployment/deploymentOrchestrator");
const { buildDeploymentLookup } = require("@utils/deploymentLookup");
const {
  notifyDeploymentStatusChange,
} = require("@services/notification/deploymentNotifications");
const logger = require("@config/logger");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
];

const TERMINAL_DEPLOYMENT_STATUSES = [
  "stopped",
  "failed",
  "cancelled",
  "error",
  "deleted",
];

const findDeployment = async (deploymentId) => {
  const lookup = buildDeploymentLookup(deploymentId);
  if (!lookup) {
    return null;
  }

  return Deployment.findOne(lookup)
    .populate("project", "name slug owner repository.url")
    .populate("deployedBy", "username email firstName lastName");
};

const getAllDeployments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status || "";
    const projectId = req.query.projectId || "";
    const search = req.query.search || "";

    const query = { status: { $ne: "deleted" } };
    if (status) {
      query.status = status;
    }
    if (projectId) {
      query.project = projectId;
    }
    if (search) {
      query.$or = [
        { "config.subdomain": { $regex: search, $options: "i" } },
        { deploymentId: { $regex: search, $options: "i" } },
        { "config.commit.message": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [deployments, total] = await Promise.all([
      Deployment.find(query)
        .populate("project", "name slug")
        .populate("deployedBy", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-build.logs")
        .lean(),
      Deployment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        deployments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting all deployments", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving deployments",
    });
  }
};

const getDeploymentById = async (req, res) => {
  try {
    const deployment = await findDeployment(req.params.deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: "Deployment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { deployment },
    });
  } catch (error) {
    logger.error("Error getting deployment by id", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      deploymentId: req.params.deploymentId,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving deployment",
    });
  }
};

const cancelDeployment = async (req, res) => {
  try {
    const deployment = await findDeployment(req.params.deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: "Deployment not found",
      });
    }

    if (
      deployment.status === "cancelled" ||
      deployment.status === "deleted" ||
      TERMINAL_DEPLOYMENT_STATUSES.includes(deployment.status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a deployment in ${deployment.status} state`,
      });
    }

    if (!ACTIVE_DEPLOYMENT_STATUSES.includes(deployment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a deployment in ${deployment.status} state`,
      });
    }

    try {
      await deploymentOrchestrator.stopDeploy(deployment.deploymentId);
    } catch (orchErr) {
      logger.warn("Orchestrator stop trigger failed (non-blocking):", orchErr.message);
    }

    const previousStatus = deployment.status;
    await deployment.updateStatus("cancelled", {
      cancelled: true,
      cancelledAt: new Date(),
    });

    notifyDeploymentStatusChange({
      userId: deployment.deployedBy?._id || deployment.deployedBy,
      previousStatus,
      newStatus: "cancelled",
      deployment,
      message: "Cancelled by admin",
    });

    logger.info("Deployment cancelled by admin", {
      adminId: req.user._id,
      deploymentId: deployment.deploymentId,
    });

    res.status(200).json({
      success: true,
      message: "Deployment cancelled",
      data: { deployment },
    });
  } catch (error) {
    logger.error("Error cancelling deployment", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      deploymentId: req.params.deploymentId,
    });

    res.status(500).json({
      success: false,
      message: error.message || "Error cancelling deployment",
    });
  }
};

const stopDeployment = async (req, res) => {
  try {
    const deployment = await findDeployment(req.params.deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: "Deployment not found",
      });
    }

    if (["stopped", "deleted"].includes(deployment.status)) {
      return res.status(200).json({
        success: true,
        message: "Deployment already stopped",
        data: { deployment },
      });
    }

    if (deployment.status !== "running") {
      return res.status(400).json({
        success: false,
        message: "Only running deployments can be stopped",
      });
    }

    const previousStatus = deployment.status;
    await deployment.updateStatus("stopping", { stoppingAt: new Date() });

    try {
      await deploymentOrchestrator.stopDeploy(deployment.deploymentId);
    } catch (orchErr) {
      logger.warn("Orchestrator stop trigger failed (non-blocking):", orchErr.message);
    }

    await deployment.updateStatus("stopped", { stoppedAt: new Date() });

    notifyDeploymentStatusChange({
      userId: deployment.deployedBy?._id || deployment.deployedBy,
      previousStatus,
      newStatus: "stopped",
      deployment,
      message: "Stopped by admin",
    });

    logger.info("Deployment stopped by admin", {
      adminId: req.user._id,
      deploymentId: deployment.deploymentId,
    });

    res.status(200).json({
      success: true,
      message: "Deployment stopped",
      data: { deployment },
    });
  } catch (error) {
    logger.error("Error stopping deployment", {
      error: { message: error.message, stack: error.stack },
      adminId: req.user._id,
      deploymentId: req.params.deploymentId,
    });

    res.status(500).json({
      success: false,
      message: error.message || "Error stopping deployment",
    });
  }
};

module.exports = {
  getAllDeployments,
  getDeploymentById,
  cancelDeployment,
  stopDeployment,
};
