const BaseGitProvider = require("./BaseProvider");

class GitHubProvider extends BaseGitProvider {
  constructor(accessToken) {
    super(accessToken, {
      name: "GitHub",
      apiVersion: "v3",
    });
  }

  getBaseURL() {
    return "https://api.github.com";
  }

  getDefaultHeaders() {
    return {
      Authorization: `token ${this.accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DeployIO-Platform",
    };
  }

  async getRepositories(options = {}) {
    const {
      type = "owner", // owner, member, public, private
      sort = "updated",
      direction = "desc",
      visibility = "all", // all, public, private
      affiliation = "owner,collaborator", // owner, collaborator, organization_member
      perPage = 30,
      maxPages = 5,
    } = options;

    const endpoint = "/user/repos";
    const params = {
      type,
      sort,
      direction,
      visibility,
      affiliation,
      per_page: perPage,
    };

    const repos = await this.getAllPages(endpoint, { params, maxPages });
    return repos.map((repo) => this.normalizeRepository(repo));
  }

  async getRepository(owner, repo) {
    const endpoint = `/repos/${owner}/${repo}`;
    const repository = await this.makeRequest(endpoint);
    return this.normalizeRepository(repository);
  }

  async getBranches(owner, repo) {
    const endpoint = `/repos/${owner}/${repo}/branches`;
    const branches = await this.getAllPages(endpoint, { maxPages: 3 });
    return branches.map((branch) => this.normalizeBranch(branch));
  }

  async getRepositoryContent(owner, repo, path = "", branch = "main") {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
    const params = { ref: branch };

    return await this.makeRequest(endpoint, { params });
  }

  async getRepositoryStructure(owner, repo, branch = "main") {
    try {
      // Get important files for analysis
      const files = {
        "package.json": await this.getFileContent(
          owner,
          repo,
          "package.json",
          branch
        ),
        "README.md": await this.getFileContent(
          owner,
          repo,
          "README.md",
          branch
        ),
        Dockerfile: await this.getFileContent(
          owner,
          repo,
          "Dockerfile",
          branch
        ),
        "docker-compose.yml": await this.getFileContent(
          owner,
          repo,
          "docker-compose.yml",
          branch
        ),
        ".env.example": await this.getFileContent(
          owner,
          repo,
          ".env.example",
          branch
        ),
        "requirements.txt": await this.getFileContent(
          owner,
          repo,
          "requirements.txt",
          branch
        ),
        "pom.xml": await this.getFileContent(owner, repo, "pom.xml", branch),
        Gemfile: await this.getFileContent(owner, repo, "Gemfile", branch),
        "composer.json": await this.getFileContent(
          owner,
          repo,
          "composer.json",
          branch
        ),
      };

      // Get repository tree to understand structure
      const tree = await this.getRepositoryTree(owner, repo, branch);

      return {
        files: Object.fromEntries(
          Object.entries(files).filter(([_, content]) => content !== null)
        ),
        structure: tree,
        analysisTimestamp: new Date(),
      };
    } catch (error) {
      console.error("Error getting repository structure:", error);
      throw error;
    }
  }

  async getRepositoryTree(owner, repo, branch = "main") {
    try {
      const endpoint = `/repos/${owner}/${repo}/git/trees/${branch}`;
      const params = { recursive: 1 };

      const tree = await this.makeRequest(endpoint, { params });

      return {
        sha: tree.sha,
        truncated: tree.truncated,
        files: tree.tree.map((item) => ({
          path: item.path,
          type: item.type,
          size: item.size,
          mode: item.mode,
        })),
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { files: [] };
      }
      throw error;
    }
  }

  async createWebhook(
    owner,
    repo,
    webhookUrl,
    events = ["push", "pull_request"]
  ) {
    const endpoint = `/repos/${owner}/${repo}/hooks`;
    const data = {
      name: "web",
      active: true,
      events: events,
      config: {
        url: webhookUrl,
        content_type: "json",
        insecure_ssl: "0",
      },
    };

    return await this.makeRequest(endpoint, { method: "POST", data });
  }

  async deleteWebhook(owner, repo, hookId) {
    const endpoint = `/repos/${owner}/${repo}/hooks/${hookId}`;
    return await this.makeRequest(endpoint, { method: "DELETE" });
  }

  async searchRepositories(query, options = {}) {
    const {
      sort = "updated",
      order = "desc",
      perPage = 30,
      maxPages = 3,
    } = options;

    const endpoint = "/search/repositories";
    const params = {
      q: query,
      sort,
      order,
      per_page: perPage,
    };

    const results = await this.getAllPages(endpoint, { params, maxPages });

    return {
      totalCount: results[0]?.total_count || 0,
      repositories: results.flatMap((result) =>
        (result.items || []).map((repo) => this.normalizeRepository(repo))
      ),
    };
  }

  async getUser() {
    const endpoint = "/user";
    const user = await this.makeRequest(endpoint);
    return this.normalizeUser(user);
  }

  async getUserRepositories(username, options = {}) {
    const {
      type = "owner",
      sort = "updated",
      direction = "desc",
      perPage = 30,
      maxPages = 5,
    } = options;

    const endpoint = `/users/${username}/repos`;
    const params = {
      type,
      sort,
      direction,
      per_page: perPage,
    };

    const repos = await this.getAllPages(endpoint, { params, maxPages });
    return repos.map((repo) => this.normalizeRepository(repo));
  }

  async getOrganizationRepositories(org, options = {}) {
    const {
      type = "all",
      sort = "updated",
      direction = "desc",
      perPage = 30,
      maxPages = 5,
    } = options;

    const endpoint = `/orgs/${org}/repos`;
    const params = {
      type,
      sort,
      direction,
      per_page: perPage,
    };

    const repos = await this.getAllPages(endpoint, { params, maxPages });
    return repos.map((repo) => this.normalizeRepository(repo));
  }

  // GitHub-specific methods
  async triggerWorkflow(owner, repo, workflowId, ref = "main", inputs = {}) {
    const endpoint = `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
    const data = {
      ref,
      inputs,
    };

    return await this.makeRequest(endpoint, { method: "POST", data });
  }

  async getWorkflowRuns(owner, repo, workflowId, options = {}) {
    const { branch, status, perPage = 30 } = options;

    const endpoint = `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`;
    const params = {
      branch,
      status,
      per_page: perPage,
    };

    const runs = await this.makeRequest(endpoint, { params });
    return runs.workflow_runs || [];
  }
}

module.exports = GitHubProvider;
