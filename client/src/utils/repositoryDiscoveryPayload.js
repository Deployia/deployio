import { toApiProviderId } from "@/utils/gitProviderIds";

/**
 * Build an HTTPS repository URL suitable for creation API routes.
 */
export function buildRepositoryUrl(repository, provider) {
  if (!repository) return null;

  const htmlUrl = repository.htmlUrl || repository.web_url;
  if (htmlUrl && /^https?:\/\//i.test(htmlUrl)) {
    return htmlUrl.replace(/\.git\/?$/i, "");
  }

  const cloneUrl = repository.cloneUrl || repository.clone_url;
  if (cloneUrl && /^https?:\/\//i.test(cloneUrl)) {
    return cloneUrl.replace(/\.git\/?$/i, "");
  }

  const apiProvider = toApiProviderId(provider);

  if (apiProvider === "gitlab" && repository.fullName) {
    return `https://gitlab.com/${repository.fullName.replace(/^\//, "")}`;
  }

  if (
    apiProvider === "azuredevops" &&
    (repository.fullName || (repository.organization && repository.project))
  ) {
    const orgProject =
      repository.fullName?.split("/").slice(0, 2).join("/") ||
      `${repository.organization}/${repository.project}`;
    return `https://dev.azure.com/${orgProject}/_git/${repository.name}`;
  }

  const owner =
    typeof repository.owner === "object"
      ? repository.owner?.login
      : repository.owner;
  if (owner && repository.name) {
    return `https://github.com/${owner}/${repository.name}`;
  }

  return null;
}

export function buildRepositoryDiscoveryPayload({
  repository,
  branch,
  provider,
}) {
  const repositoryUrl = buildRepositoryUrl(repository, provider);
  if (!repositoryUrl) {
    return null;
  }

  const branchName =
    typeof branch === "object" && branch !== null ? branch.name : branch;

  return {
    repositoryUrl,
    branch: branchName || "main",
    provider: toApiProviderId(provider) || "github",
  };
}
