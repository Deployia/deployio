const User = require("@models/User");
const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const logger = require("@config/logger");
const NotificationHelpers = require("../notification/notificationHelpers");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
];

const getLimits = (user) => ({
  maxProjects: user.resourceLimits?.maxProjects ?? 2,
  maxDeployments: user.resourceLimits?.maxDeployments ?? 6,
});

const countUserProjects = (userId) =>
  Project.countDocuments({ owner: userId, status: { $ne: "deleted" } });

const countUserActiveDeployments = (userId) =>
  Deployment.countDocuments({
    deployedBy: userId,
    status: { $in: ACTIVE_DEPLOYMENT_STATUSES },
  });

const maybeSendQuotaWarning = async (userId, quotaType, current, limit) => {
  if (limit <= 0) return;
  const usagePercentage = Math.round((current / limit) * 100);
  if (usagePercentage < 80) return;
  try {
    await NotificationHelpers.systemQuotaWarning(userId, {
      quotaType,
      currentUsage: current,
      quotaLimit: limit,
      usagePercentage,
    });
  } catch (error) {
    logger.warn("Failed to send quota warning", {
      userId,
      quotaType,
      error: error.message,
    });
  }
};

const syncUserResourceUsage = async (userId) => {
  const [projectCount, activeDeployments] = await Promise.all([
    countUserProjects(userId),
    countUserActiveDeployments(userId),
  ]);

  await User.findByIdAndUpdate(userId, {
    $set: {
      "currentUsage.projects": projectCount,
      "currentUsage.activeDeployments": activeDeployments,
    },
  });

  return { projectCount, activeDeployments };
};

const assertCanCreateProject = async (userId) => {
  const user = await User.findById(userId).select("resourceLimits currentUsage");
  if (!user) {
    throw new Error("User not found");
  }

  const { maxProjects } = getLimits(user);
  const projectCount = await countUserProjects(userId);

  if (projectCount >= maxProjects) {
    await NotificationHelpers.systemQuotaExceeded(userId, {
      quotaType: "projects",
      currentUsage: projectCount,
      quotaLimit: maxProjects,
    }).catch(() => {});

    const err = new Error(
      `Project limit reached (${maxProjects} projects per account)`,
    );
    err.statusCode = 403;
    throw err;
  }

  await maybeSendQuotaWarning(
    userId,
    "projects",
    projectCount + 1,
    maxProjects,
  );

  return { projectCount, maxProjects };
};

const assertCanDeploy = async (userId) => {
  const user = await User.findById(userId).select("resourceLimits currentUsage");
  if (!user) {
    throw new Error("User not found");
  }

  const { maxDeployments } = getLimits(user);
  const activeCount = await countUserActiveDeployments(userId);

  if (activeCount >= maxDeployments) {
    await NotificationHelpers.systemQuotaExceeded(userId, {
      quotaType: "concurrent deployments",
      currentUsage: activeCount,
      quotaLimit: maxDeployments,
    }).catch(() => {});

    const err = new Error(
      `Deployment limit reached (${maxDeployments} concurrent deployments per account)`,
    );
    err.statusCode = 403;
    throw err;
  }

  await maybeSendQuotaWarning(
    userId,
    "concurrent deployments",
    activeCount + 1,
    maxDeployments,
  );

  return { activeCount, maxDeployments };
};

module.exports = {
  ACTIVE_DEPLOYMENT_STATUSES,
  assertCanCreateProject,
  assertCanDeploy,
  syncUserResourceUsage,
  countUserProjects,
  countUserActiveDeployments,
};
