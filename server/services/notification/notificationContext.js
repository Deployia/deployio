/**
 * Build notification context that persists template fields in context.data
 * while storing ObjectId refs for project/deployment.
 */
function buildDeploymentNotificationContext({
  projectId,
  deploymentId,
  projectName,
  environment,
  url,
  logsUrl,
  duration,
  reason,
  error,
  extra = {},
}) {
  const data = {
    projectName: projectName || "Project",
    projectId: projectId ? String(projectId) : undefined,
    environment: environment || "production",
    deploymentUrl: url,
    url,
    logsUrl,
    duration,
    reason: reason || error,
    error,
    ...extra,
  };

  return {
    project: projectId || undefined,
    deployment: deploymentId || undefined,
    data,
  };
}

module.exports = {
  buildDeploymentNotificationContext,
};
