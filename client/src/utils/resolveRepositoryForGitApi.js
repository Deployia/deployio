import projectCreationService from "@/services/projectCreationService";
import { toApiProviderId } from "@/utils/gitProviderIds";

/**
 * Resolve owner/repo/fullName for git-provider API routes from a selected repository.
 */
export function resolveRepositoryForGitApi(provider, repository) {
  if (!repository) {
    return null;
  }

  const apiProvider = toApiProviderId(provider || "github") || "github";

  const url =
    repository.htmlUrl ||
    repository.cloneUrl ||
    repository.url ||
    repository.git;

  if (url) {
    try {
      const parsed = projectCreationService.extractRepositoryInfo(url);
      if (parsed?.owner) {
        const repoName = parsed.repo || parsed.name || repository.name;
        return {
          provider: apiProvider,
          owner: parsed.owner,
          repo: repoName,
          fullName:
            repository.fullName ||
            (parsed.organization
              ? `${parsed.organization}/${parsed.project}/${repoName}`
              : `${parsed.owner}/${repoName}`),
        };
      }
    } catch {
      // fall through to fullName / owner fields
    }
  }

  const fullName = repository.fullName;
  if (fullName) {
    if (apiProvider === "gitlab") {
      const parts = fullName.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return {
          provider: apiProvider,
          owner: parts[0],
          repo: parts.slice(1).join("/"),
          fullName,
        };
      }
    }

    if (apiProvider === "azuredevops") {
      const parts = fullName.split("/").filter(Boolean);
      if (parts.length >= 3) {
        const repo = parts.pop();
        const owner = parts.join("/");
        return { provider: apiProvider, owner, repo, fullName };
      }
      if (parts.length === 2) {
        return {
          provider: apiProvider,
          owner: parts[0],
          repo: parts[1],
          fullName,
        };
      }
    }

    const parts = fullName.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return {
        provider: apiProvider,
        owner: parts[0],
        repo: parts.slice(1).join("/"),
        fullName,
      };
    }
  }

  let owner;
  if (repository.owner && typeof repository.owner === "object") {
    owner = repository.owner.login || repository.owner.username;
  } else if (typeof repository.owner === "string") {
    owner = repository.owner;
  }

  const repo = repository.name;
  if (owner && repo) {
    return {
      provider: apiProvider,
      owner,
      repo,
      fullName: fullName || `${owner}/${repo}`,
    };
  }

  return null;
}
