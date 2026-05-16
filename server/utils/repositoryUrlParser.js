const { toApiProviderId, normalizeGitProviderKey } = require("./gitProviderKeys");

function normalizeProviderApi(provider) {
  const canonical = normalizeGitProviderKey(provider);
  if (canonical) {
    return toApiProviderId(canonical);
  }
  return String(provider || "github").toLowerCase().replace(/-/g, "");
}

function parseRepositoryUrl(repositoryUrl, provider = "github") {
  const apiProvider = normalizeProviderApi(provider);
  const url = String(repositoryUrl || "").trim();

  if (apiProvider === "github") {
    const repoMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)/i);
    if (!repoMatch) {
      throw new Error("Invalid GitHub repository URL");
    }
    return {
      provider: "github",
      owner: repoMatch[1],
      repo: repoMatch[2],
      projectId: null,
    };
  }

  if (apiProvider === "gitlab") {
    const repoMatch = url.match(/gitlab\.com\/(.+?)(?:\.git)?\/?$/i);
    if (!repoMatch) {
      throw new Error("Invalid GitLab repository URL");
    }
    const projectPath = repoMatch[1].replace(/\/$/, "");
    const segments = projectPath.split("/");
    return {
      provider: "gitlab",
      owner: segments[0],
      repo: segments[segments.length - 1],
      projectId: projectPath,
    };
  }

  if (apiProvider === "azuredevops") {
    const repoMatch = url.match(
      /dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/.]+)/i,
    );
    if (!repoMatch) {
      throw new Error("Invalid Azure DevOps repository URL");
    }
    return {
      provider: "azuredevops",
      organization: repoMatch[1],
      project: repoMatch[2],
      repo: repoMatch[3],
      owner: `${repoMatch[1]}/${repoMatch[2]}`,
      projectId: null,
    };
  }

  throw new Error(`Unsupported repository provider: ${provider}`);
}

module.exports = {
  normalizeProviderApi,
  parseRepositoryUrl,
};
