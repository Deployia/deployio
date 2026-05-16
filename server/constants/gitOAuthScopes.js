/**
 * OAuth scopes requested at connect time (minimal).
 * Elevate later when shipping: webhooks, branch/Dockerfile commits, Actions dispatch.
 *
 * GitHub elevation (add to connect + update OAuth app):
 *   - workflow — read Actions workflows / runs
 *   - admin:repo_hook — register repo webhooks for auto-deploy
 *   - (repo already includes read/write for private repos when pushing branches)
 *
 * GitLab elevation:
 *   - api or read_api — project hooks, some write APIs
 */

const GITHUB_CONNECT_SCOPES = ["user:email", "repo", "read:org"];
const GITLAB_CONNECT_SCOPES = ["read_user", "read_repository"];

module.exports = {
  GITHUB_CONNECT_SCOPES,
  GITLAB_CONNECT_SCOPES,
};
