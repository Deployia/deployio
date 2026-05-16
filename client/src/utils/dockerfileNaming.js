/**
 * Client-side mirror of server/utils/dockerfileNaming.js for UI previews.
 */

export function deriveServiceLabel(dockerfilePath) {
  if (!dockerfilePath || typeof dockerfilePath !== "string") {
    return "service";
  }

  const normalized = dockerfilePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const base = parts[parts.length - 1] || "Dockerfile";
  const dirParts = parts.slice(0, -1).filter(Boolean);

  const variantMatch = base.match(/^Dockerfile\.(.+)$/i);
  if (variantMatch) {
    return variantMatch[1].toLowerCase();
  }

  if (dirParts.length === 0) {
    return "app";
  }

  return dirParts[dirParts.length - 1] || "app";
}

export function slugifySegment(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 40);
}

export function suggestProjectName(repoName, dockerfilePath, options = {}) {
  const { stackHint, existingNames = new Set() } = options;
  const repoSlug = slugifySegment(repoName || "project") || "project";
  let label = deriveServiceLabel(dockerfilePath);

  if (label === "app" && stackHint) {
    label = slugifySegment(stackHint) || label;
  }

  let candidate = `${repoSlug}-${slugifySegment(label) || "service"}`;
  if (!existingNames.has(candidate)) {
    return candidate;
  }

  let counter = 2;
  while (existingNames.has(`${candidate}-${counter}`)) {
    counter += 1;
  }
  return `${candidate}-${counter}`;
}

export function isValidDockerfileContent(content) {
  if (!content || typeof content !== "string") return false;
  const upper = content.toUpperCase();
  const hasFrom = upper.includes("FROM");
  const hasCmd = upper.includes("CMD") || upper.includes("ENTRYPOINT");
  return hasFrom && hasCmd;
}
