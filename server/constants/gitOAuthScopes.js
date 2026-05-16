/**
 * OAuth scopes requested at connect time (minimal).
 * Elevate later when shipping: webhooks, branch/Dockerfile commits, Actions dispatch.
 *
 * GitHub elevation (add to connect + update OAuth app):
 *   - workflow — read Actions workflows / runs
 *   - admin:repo_hook — register repo webhooks for auto-deploy
 *   - (repo already includes read/write for private repos when pushing branches)
 *
 * GitLab elevation (add to connect + enable on GitLab OAuth app):
 *   - api — read/write API (only if read_api is insufficient)
 *   - write_repository — push branches
 *
 * GitLab authorize URL requires space-separated scopes (scopeSeparator: " " in gitlabStrategy.js).
 */

const GITHUB_CONNECT_SCOPES = ["user:email", "repo", "read:org"];
// read_api: list projects; read_repository: private repo file/tree API (no write)
const GITLAB_CONNECT_SCOPES = ["read_user", "read_repository", "read_api"];

module.exports = {
  GITHUB_CONNECT_SCOPES,
  GITLAB_CONNECT_SCOPES,
};
