/**
 * Normalize branch/commit from a deployment record for redeploy prefill.
 */
export function commitFromDeployment(deployment) {
  const commit = deployment?.config?.commit || deployment?.commit;
  if (!commit?.hash || String(commit.hash).length < 7) {
    return null;
  }

  const message = String(commit.message || "").trim();
  const author = String(commit.author || "").trim();
  if (message === "Auto-deploy" && author === "deployio") {
    return null;
  }

  return {
    hash: commit.hash,
    message: commit.message || "",
    author: commit.author || "",
    timestamp: commit.timestamp || commit.date || null,
    url: commit.url || null,
  };
}

export function redeployPrefillFromDeployment(deployment) {
  if (!deployment) return null;

  const environment =
    deployment.config?.environment || deployment.environment || "development";
  const branch =
    deployment.config?.branch || deployment.branch || "main";
  const commit = commitFromDeployment(deployment);
  const subdomain =
    deployment.config?.subdomain ||
    deployment.networking?.subdomain ||
    deployment.subdomain ||
    "";

  return {
    environment,
    branch,
    commit,
    subdomain,
  };
}
