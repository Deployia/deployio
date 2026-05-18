const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const logger = require("@config/logger");
const deploymentService = require("./deploymentService");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
];

function parseBranchFromRef(ref) {
  if (!ref || !ref.startsWith("refs/heads/")) {
    return null;
  }
  return ref.replace("refs/heads/", "");
}

function buildCommitFromPush(payload) {
  const head = payload.head_commit || payload.commits?.[payload.commits.length - 1];
  if (!head?.id) {
    return null;
  }

  return {
    hash: head.id,
    message: head.message || "Auto-deploy",
    author: head.author?.username || head.author?.name || "github",
    timestamp: head.timestamp ? new Date(head.timestamp) : new Date(),
    url: head.url || payload.compare || null,
  };
}

async function findAutoDeployProjects(repositoryFullName) {
  if (!repositoryFullName || !repositoryFullName.includes("/")) {
    return [];
  }

  const [owner, name] = repositoryFullName.split("/");

  return Project.find({
    status: { $ne: "archived" },
    "settings.autoDeployment.enabled": true,
    "repository.provider": "github",
    $or: [
      { "repository.owner": owner, "repository.name": name },
      {
        "repository.url": {
          $regex: new RegExp(
            `github\\.com/${owner}/${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i",
          ),
        },
      },
    ],
  })
    .select("name owner settings.autoDeployment repository")
    .lean();
}

async function getCurrentDeploymentForEnv(projectId, environment) {
  return Deployment.findOne({
    project: projectId,
    "config.environment": environment,
    status: { $in: [...ACTIVE_DEPLOYMENT_STATUSES, "stopped", "failed", "cancelled"] },
  })
    .sort({ revisionNumber: -1, createdAt: -1 })
    .select("_id status")
    .lean();
}

async function triggerAutoDeployForProject(project, { branch, commit }) {
  const settings = project.settings?.autoDeployment || {};
  const environments = Array.isArray(settings.environments)
    ? settings.environments
    : ["production"];

  const deployUserId = project.owner;
  const results = [];

  for (const environment of environments) {
    try {
      const current = await getCurrentDeploymentForEnv(project._id, environment);
      const deploymentData = {
        environment,
        branch,
        commit,
        trigger: { type: "auto", branch, commitSha: commit.hash, at: new Date() },
      };

      if (current?._id) {
        deploymentData.redeployFromDeploymentId = String(current._id);
      }

      const deployment = await deploymentService.createDeployment(
        project._id,
        deploymentData,
        deployUserId,
      );

      results.push({ environment, deploymentId: deployment.deploymentId, ok: true });
    } catch (error) {
      logger.error("Auto-deploy failed for environment", {
        projectId: project._id,
        environment,
        error: error.message,
      });
      results.push({ environment, ok: false, error: error.message });
    }
  }

  return results;
}

const isAutoDeployEnabled = () =>
  String(process.env.AUTO_DEPLOY_ENABLED || "").toLowerCase() === "true";

async function handleGitHubPush(payload) {
  if (!isAutoDeployEnabled()) {
    logger.info("GitHub auto-deploy skipped (AUTO_DEPLOY_ENABLED is not true)", {
      repository: payload.repository?.full_name,
      ref: payload.ref,
    });
    return { skipped: true, reason: "auto-deploy-disabled" };
  }

  const branch = parseBranchFromRef(payload.ref);
  const repositoryFullName = payload.repository?.full_name;
  const commit = buildCommitFromPush(payload);

  if (!branch || !repositoryFullName || !commit) {
    logger.info("Skipping GitHub push — missing branch, repo, or commit", {
      ref: payload.ref,
      repository: repositoryFullName,
    });
    return { skipped: true, reason: "incomplete-payload" };
  }

  const projects = await findAutoDeployProjects(repositoryFullName);
  if (!projects.length) {
    return { skipped: true, reason: "no-matching-projects" };
  }

  const outcomes = [];

  for (const project of projects) {
    const configuredBranch =
      project.settings?.autoDeployment?.branch ||
      project.repository?.branch ||
      "main";

    if (branch !== configuredBranch) {
      outcomes.push({
        projectId: project._id,
        skipped: true,
        reason: "branch-mismatch",
        branch,
        configuredBranch,
      });
      continue;
    }

    const results = await triggerAutoDeployForProject(project, { branch, commit });
    outcomes.push({
      projectId: project._id,
      projectName: project.name,
      results,
    });
  }

  return { outcomes };
}

module.exports = {
  handleGitHubPush,
  parseBranchFromRef,
  findAutoDeployProjects,
};
