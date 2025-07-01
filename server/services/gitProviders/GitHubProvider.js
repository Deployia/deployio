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
      sort = "updated",
      direction = "desc",
      visibility = "all", // all, public, private
      affiliation = "owner,collaborator", // owner, collaborator, organization_member
      page = 1,
      per_page = 30,
    } = options;

    const endpoint = "/user/repos";
    const params = {
      sort,
      direction,
      visibility,
      affiliation,
      page,
      per_page,
    };

    const response = await this.makeRequest(endpoint, { params });

    // GitHub API returns an array of repositories
    const repositories = Array.isArray(response) ? response : [];

    return {
      repositories: repositories.map((repo) => this.normalizeRepository(repo)),
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total_count: repositories.length,
        has_more: repositories.length === parseInt(per_page),
      },
    };
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
      // Get repository tree to understand structure first
      const tree = await this.getRepositoryTree(owner, repo, branch);

      // Define important file patterns for comprehensive analysis
      const importantPatterns = [
        // Package/dependency files
        "package.json",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "requirements.txt",
        "setup.py",
        "pyproject.toml",
        "Pipfile",
        "poetry.lock",
        "pom.xml",
        "build.gradle",
        "gradle.properties",
        "Gemfile",
        "Gemfile.lock",
        "composer.json",
        "composer.lock",
        "go.mod",
        "go.sum",
        "Cargo.toml",
        "Cargo.lock",

        // Configuration files
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
        ".env.example",
        ".env.template",
        "webpack.config.js",
        "vite.config.js",
        "tsconfig.json",
        "babel.config.js",
        "rollup.config.js",
        "tailwind.config.js",
        "postcss.config.js",

        // Framework-specific files
        "next.config.js",
        "nuxt.config.js",
        "vue.config.js",
        "angular.json",
        "ng-package.json",
        "svelte.config.js",

        // Infrastructure and deployment
        "k8s",
        "kubernetes",
        "helm",
        "terraform",
        "docker-compose.prod.yml",
        "docker-compose.dev.yml",
        ".github/workflows",
        ".gitlab-ci.yml",
        "azure-pipelines.yml",
        "Jenkinsfile",
        "buildspec.yml",

        // Documentation
        "README.md",
        "README.rst",
        "CHANGELOG.md",
        "CONTRIBUTING.md",

        // IDE/Editor configs that can indicate tech stack
        ".vscode/settings.json",
        ".idea/modules.xml",
      ];

      // Find all relevant files from the tree
      const relevantFiles = new Map();

      for (const file of tree.files || []) {
        const path = file.path;

        // Check if file matches any important pattern
        const isImportant = importantPatterns.some((pattern) => {
          if (pattern.includes("/")) {
            // Directory or path pattern
            return path.includes(pattern);
          } else {
            // Exact filename or extension pattern
            return (
              path === pattern ||
              path.endsWith(`/${pattern}`) ||
              path.endsWith(pattern)
            );
          }
        });

        if (isImportant) {
          relevantFiles.set(path, null); // Will fetch content below
        }
      }

      // Also include the original hardcoded important files
      const hardcodedFiles = [
        "package.json",
        "README.md",
        "Dockerfile",
        "docker-compose.yml",
        ".env.example",
        "requirements.txt",
        "pom.xml",
        "Gemfile",
        "composer.json",
      ];

      for (const fileName of hardcodedFiles) {
        if (!relevantFiles.has(fileName)) {
          relevantFiles.set(fileName, null);
        }
      }

      // Fetch content for all relevant files (in parallel for efficiency)
      const filePromises = Array.from(relevantFiles.keys()).map(
        async (filePath) => {
          try {
            const content = await this.getFileContent(
              owner,
              repo,
              filePath,
              branch
            );
            return [filePath, content];
          } catch (error) {
            // File doesn't exist or can't be fetched
            return [filePath, null];
          }
        }
      );

      const fileResults = await Promise.all(filePromises);

      // Build final files object with only successful fetches
      const files = {};
      for (const [filePath, content] of fileResults) {
        if (content !== null) {
          files[filePath] = content;
        }
      }

      return {
        files,
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
