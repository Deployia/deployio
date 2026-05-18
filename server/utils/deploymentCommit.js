/**
 * Helpers for deployment commit metadata (legacy placeholders vs real git SHAs).
 */

const PLACEHOLDER_AUTHOR = "deployio";
const PLACEHOLDER_MESSAGE = "Auto-deploy";
const GIT_SHA_RE = /^[0-9a-f]{7,40}$/i;

/**
 * Legacy creates stored a random 40-char hex when no commit was supplied.
 */
function isPlaceholderCommit(commit) {
  if (!commit || typeof commit !== "object") {
    return true;
  }

  const hash = String(commit.hash || "").trim();
  if (!hash || !GIT_SHA_RE.test(hash)) {
    return true;
  }

  const message = String(commit.message || "").trim();
  const author = String(commit.author || "").trim();

  if (message === PLACEHOLDER_MESSAGE && author === PLACEHOLDER_AUTHOR) {
    return true;
  }

  return false;
}

/**
 * Commit SHA to send to the agent. Omits legacy placeholders so clone uses branch HEAD.
 */
function resolveCommitShaForAgent(deployment) {
  const commit = deployment?.config?.commit;
  if (isPlaceholderCommit(commit)) {
    return null;
  }
  return String(commit.hash).trim();
}

module.exports = {
  isPlaceholderCommit,
  resolveCommitShaForAgent,
  PLACEHOLDER_AUTHOR,
  PLACEHOLDER_MESSAGE,
};
