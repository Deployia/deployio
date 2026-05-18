const User = require("../models/User");
const logger = require("@config/logger");
const { normalizeGitProviderKey } = require("./gitProviderKeys");
const { getDecryptedAccessToken } = require("./gitProviderTokens");
const { parseRepositoryUrl } = require("./repositoryUrlParser");

/** Platform PAT / service tokens (same fallbacks as GitProviderService). */
const ENV_TOKEN_KEYS = {
  github: ["GITHUB_TOKEN", "GITHUB_PLAYGROUND_TOKEN"],
  gitlab: ["GITLAB_TOKEN", "GITLAB_PLAYGROUND_TOKEN"],
};

const PLACEHOLDER_PATTERNS = [
  /^your_/i,
  /^replace_me/i,
  /^changeme/i,
];

function isUsableEnvToken(value) {
  if (!value || typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.length < 10) {
    return false;
  }
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function getEnvTokenForProvider(canonical) {
  const keys = ENV_TOKEN_KEYS[canonical] || [];
  for (const key of keys) {
    const candidate = process.env[key];
    if (isUsableEnvToken(candidate)) {
      return candidate.trim();
    }
  }
  return null;
}

function tokenSelectFields(canonical) {
  return `+gitProviders.${canonical}.accessToken +gitProviders.${canonical}.isConnected`;
}

async function getUserProviderToken(userId, canonical) {
  if (!userId || !canonical) {
    return null;
  }

  try {
    const user = await User.findById(userId).select(tokenSelectFields(canonical));
    if (!user?.gitProviders?.[canonical]?.isConnected) {
      return null;
    }
    return getDecryptedAccessToken(user.gitProviders[canonical]) || null;
  } catch (error) {
    logger.warn("Failed to load git token for user", {
      userId: String(userId),
      provider: canonical,
      error: error.message,
    });
    return null;
  }
}

function resolveOwnerId(project) {
  if (!project?.owner) {
    return null;
  }
  if (project.owner._id) {
    return project.owner._id.toString();
  }
  return project.owner.toString();
}

/**
 * Resolve git credentials for agent clone (private repos).
 * Order: deployer OAuth → project owner OAuth → platform env PAT (GITHUB_TOKEN, etc.).
 *
 * @returns {Promise<{ token: string|null, source: string|null, provider: string|null }>}
 */
async function resolveDeployGitToken({ deployUserId, project }) {
  if (!project?.repository?.url) {
    return { token: null, source: null, provider: null };
  }

  let canonical;
  try {
    const parsed = parseRepositoryUrl(
      project.repository.url,
      project.repository.provider || "github",
    );
    canonical = normalizeGitProviderKey(parsed.provider);
  } catch (error) {
    logger.warn("Could not parse repository for deploy token", {
      error: error.message,
    });
    return { token: null, source: null, provider: null };
  }

  if (!canonical) {
    return { token: null, source: null, provider: null };
  }

  const ownerId = resolveOwnerId(project);
  const candidates = [
    { userId: deployUserId, source: "deployer_oauth" },
    { userId: ownerId, source: "project_owner_oauth" },
  ];

  for (const { userId, source } of candidates) {
    if (!userId) {
      continue;
    }
    if (
      ownerId &&
      deployUserId &&
      source === "project_owner_oauth" &&
      userId === deployUserId.toString()
    ) {
      continue;
    }

    const token = await getUserProviderToken(userId, canonical);
    if (token) {
      return { token, source, provider: canonical };
    }
  }

  const envToken = getEnvTokenForProvider(canonical);
  if (envToken) {
    logger.info("Using platform git token for deployment clone", {
      provider: canonical,
      source: "platform_env",
    });
    return { token: envToken, source: "platform_env", provider: canonical };
  }

  logger.warn("No git token available for private repository clone", {
    provider: canonical,
    deployUserId: deployUserId ? String(deployUserId) : null,
    ownerId,
    repoUrl: project.repository.url,
  });

  return { token: null, source: null, provider: canonical };
}

module.exports = {
  resolveDeployGitToken,
  getEnvTokenForProvider,
  getUserProviderToken,
};
