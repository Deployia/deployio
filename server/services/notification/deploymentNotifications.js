const NotificationHelpers = require("./notificationHelpers");
const Project = require("../../models/Project");
const logger = require("../../config/logger");
const { projectDashboardUrl } = require("./notificationUrls");

const TERMINAL_NOTIFY_STATUSES = new Set(["running", "failed", "stopped", "cancelled"]);

function buildDeploymentPayload(deployment, project, message) {
  const projectId = project?._id ?? deployment.project;
  const projectName = project?.name ?? "Project";

  return {
    projectName,
    projectId,
    deploymentId: deployment._id,
    environment: deployment.config?.environment,
    url: deployment.networking?.fullUrl,
    logsUrl: `${projectDashboardUrl(projectId)}/deployments`,
    projectUrl: projectDashboardUrl(projectId),
    error: message,
    reason: message,
  };
}

/**
 * Fire-and-forget deployment status notification (never throws to caller).
 */
async function notifyDeploymentStatusChange({
  userId,
  previousStatus,
  newStatus,
  deployment,
  project = null,
  message = null,
}) {
  if (!userId || !deployment) return;
  if (previousStatus === newStatus) return;
  if (!TERMINAL_NOTIFY_STATUSES.has(newStatus) && newStatus !== "building" && newStatus !== "deploying") {
    return;
  }

  try {
    let resolvedProject = project;
    if (!resolvedProject?.name && deployment.project) {
      resolvedProject = await Project.findById(deployment.project).select("name").lean();
    }

    const payload = buildDeploymentPayload(deployment, resolvedProject, message);

    if (newStatus === "running") {
      await NotificationHelpers.deploymentSuccess(userId, payload);
    } else if (newStatus === "failed") {
      await NotificationHelpers.deploymentFailed(userId, payload);
    } else if (newStatus === "stopped" || newStatus === "cancelled") {
      await NotificationHelpers.deploymentStopped(userId, {
        ...payload,
        reason:
          newStatus === "cancelled"
            ? message || "Cancelled"
            : message || "Manual stop",
      });
    }
  } catch (error) {
    logger.error("Failed to send deployment status notification", {
      userId,
      deploymentId: deployment._id,
      previousStatus,
      newStatus,
      error: error.message,
    });
  }
}

/**
 * Fire-and-forget deployment started notification.
 */
function notifyDeploymentStarted(userId, deployment, project) {
  if (!userId || !deployment) return;

  const payload = buildDeploymentPayload(deployment, project);

  NotificationHelpers.deploymentStarted(userId, payload).catch((error) => {
    logger.error("Failed to send deployment started notification", {
      userId,
      deploymentId: deployment._id,
      error: error.message,
    });
  });
}

module.exports = {
  notifyDeploymentStatusChange,
  notifyDeploymentStarted,
  buildDeploymentPayload,
};
