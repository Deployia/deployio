const path = require("path");

/**
 * Derive a human-readable service label from a Dockerfile path.
 * e.g. apps/frontend/Dockerfile -> frontend, Dockerfile.prod -> prod
 */
function deriveServiceLabel(dockerfilePath) {
  if (!dockerfilePath || typeof dockerfilePath !== "string") {
    return "service";
  }

  const normalized = dockerfilePath.replace(/\\/g, "/");
  const base = path.posix.basename(normalized);
  const dir = path.posix.dirname(normalized);

  const variantMatch = base.match(/^Dockerfile\.(.+)$/i);
  if (variantMatch) {
    return variantMatch[1].toLowerCase();
  }

  if (!dir || dir === ".") {
    return "app";
  }

  const segments = dir.split("/").filter(Boolean);
  return segments[segments.length - 1] || "app";
}

/**
 * Directory containing the Dockerfile (posix), or "" for repo root.
 */
function dockerfileDirectory(dockerfilePath) {
  if (!dockerfilePath) return "";
  const normalized = dockerfilePath.replace(/\\/g, "/");
  const dir = path.posix.dirname(normalized);
  return dir === "." ? "" : dir;
}

function slugifySegment(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 40);
}

/**
 * Build a suggested project name: {repoName}-{serviceLabel}
 * Handles duplicate labels via optional existingNames set.
 */
function suggestProjectName(repoName, dockerfilePath, options = {}) {
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

/**
 * Validate Dockerfile has minimum deployable instructions.
 * CMD or ENTRYPOINT satisfies runtime (ENTRYPOINT-only images are valid).
 */
function isValidDockerfileContent(content) {
  if (!content || typeof content !== "string") return false;
  const upper = content.toUpperCase();
  const hasFrom = upper.includes("FROM");
  const hasCmd = upper.includes("CMD") || upper.includes("ENTRYPOINT");
  return hasFrom && hasCmd;
}

module.exports = {
  deriveServiceLabel,
  dockerfileDirectory,
  suggestProjectName,
  slugifySegment,
  isValidDockerfileContent,
};
