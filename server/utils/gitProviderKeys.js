/**
 * Canonical git provider keys for User.gitProviders schema paths.
 */
const PROVIDER_ALIASES = {
  github: "github",
  gitlab: "gitlab",
  azure: "azureDevOps",
  azuredevops: "azureDevOps",
  "azure-devops": "azureDevOps",
  azureDevOps: "azureDevOps",
  bitbucket: "bitbucket",
};

const API_PROVIDER_IDS = {
  github: "github",
  gitlab: "gitlab",
  azureDevOps: "azuredevops",
};

function normalizeGitProviderKey(provider) {
  const key = String(provider || "")
    .trim()
    .replace(/[^a-zA-Z0-9-]/g, "");
  if (!key) {
    return null;
  }
  return PROVIDER_ALIASES[key] || PROVIDER_ALIASES[key.toLowerCase()] || null;
}

function toApiProviderId(canonicalKey) {
  const normalized = normalizeGitProviderKey(canonicalKey);
  if (!normalized) {
    return null;
  }
  return API_PROVIDER_IDS[normalized] || normalized.toLowerCase();
}

function isSupportedGitProvider(provider) {
  return Boolean(normalizeGitProviderKey(provider));
}

module.exports = {
  normalizeGitProviderKey,
  toApiProviderId,
  isSupportedGitProvider,
  PROVIDER_ALIASES,
};
