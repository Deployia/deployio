const BaseGitProvider = require("./BaseProvider");

class GitLabProvider extends BaseGitProvider {
  constructor(accessToken) {
    super(accessToken, {
      name: "GitLab",
      apiVersion: "v4",
    });
  }

  getBaseURL() {
    return "https://gitlab.com/api/v4";
  }

  getDefaultHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async getRepositories(options = {}) {
    const {
      membership = true,
      owned = true,
      starred = false,
      visibility = "private", // private, internal, public
      orderBy = "updated_at",
      sort = "desc",
      perPage = 30,
      maxPages = 5,
    } = options;

    const endpoint = "/projects";
    const params = {
      membership,
      owned,
      starred,
      visibility,
      order_by: orderBy,
      sort,
      per_page: perPage,
    };

    const projects = await this.getAllPages(endpoint, { params, maxPages });
    return projects.map((project) => this.normalizeRepository(project));
  }

  async getRepository(projectId) {
    // GitLab uses project ID or namespace/project-name
    const endpoint = `/projects/${encodeURIComponent(projectId)}`;
    const project = await this.makeRequest(endpoint);
    return this.normalizeRepository(project);
  }

  async getBranches(projectId) {
    const endpoint = `/projects/${encodeURIComponent(
      projectId
    )}/repository/branches`;
    const branches = await this.getAllPages(endpoint, { maxPages: 3 });
    return branches.map((branch) => this.normalizeBranch(branch));
  }

  async getRepositoryContent(projectId, path = "", branch = "main") {
    const endpoint = `/projects/${encodeURIComponent(
      projectId
    )}/repository/files/${encodeURIComponent(path)}`;
    const params = { ref: branch };

    return await this.makeRequest(endpoint, { params });
  }

  async getRepositoryStructure(projectId, branch = "main") {
    try {
      // Get important files for analysis
      const files = {
        "package.json": await this.getFileContent(
          projectId,
          "package.json",
          branch
        ),
        "README.md": await this.getFileContent(projectId, "README.md", branch),
        Dockerfile: await this.getFileContent(projectId, "Dockerfile", branch),
        "docker-compose.yml": await this.getFileContent(
          projectId,
          "docker-compose.yml",
          branch
        ),
        ".env.example": await this.getFileContent(
          projectId,
          ".env.example",
          branch
        ),
        "requirements.txt": await this.getFileContent(
          projectId,
          "requirements.txt",
          branch
        ),
        "pom.xml": await this.getFileContent(projectId, "pom.xml", branch),
        Gemfile: await this.getFileContent(projectId, "Gemfile", branch),
        "composer.json": await this.getFileContent(
          projectId,
          "composer.json",
          branch
        ),
      };

      // Get repository tree to understand structure
      const tree = await this.getRepositoryTree(projectId, branch);

      return {
        files: Object.fromEntries(
          Object.entries(files).filter(([_, content]) => content !== null)
        ),
        structure: tree,
        analysisTimestamp: new Date(),
      };
    } catch (error) {
      console.error("Error getting GitLab repository structure:", error);
      throw error;
    }
  }

  async getRepositoryTree(projectId, branch = "main") {
    try {
      const endpoint = `/projects/${encodeURIComponent(
        projectId
      )}/repository/tree`;
      const params = { ref: branch, recursive: true };

      const tree = await this.getAllPages(endpoint, { params, maxPages: 3 });

      return {
        files: tree.map((item) => ({
          path: item.path,
          type: item.type,
          mode: item.mode,
          name: item.name,
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
    projectId,
    webhookUrl,
    events = ["push_events", "merge_requests_events"]
  ) {
    const endpoint = `/projects/${encodeURIComponent(projectId)}/hooks`;
    const data = {
      url: webhookUrl,
      push_events: events.includes("push_events"),
      merge_requests_events: events.includes("merge_requests_events"),
      issues_events: events.includes("issues_events"),
      tag_push_events: events.includes("tag_push_events"),
      pipeline_events: events.includes("pipeline_events"),
      enable_ssl_verification: true,
    };

    return await this.makeRequest(endpoint, { method: "POST", data });
  }

  async deleteWebhook(projectId, hookId) {
    const endpoint = `/projects/${encodeURIComponent(
      projectId
    )}/hooks/${hookId}`;
    return await this.makeRequest(endpoint, { method: "DELETE" });
  }

  async searchRepositories(query, options = {}) {
    const {
      orderBy = "updated_at",
      sort = "desc",
      perPage = 30,
      maxPages = 3,
    } = options;

    const endpoint = "/projects";
    const params = {
      search: query,
      order_by: orderBy,
      sort,
      per_page: perPage,
    };

    const projects = await this.getAllPages(endpoint, { params, maxPages });

    return {
      totalCount: projects.length,
      repositories: projects.map((project) =>
        this.normalizeRepository(project)
      ),
    };
  }

  async getUser() {
    const endpoint = "/user";
    const user = await this.makeRequest(endpoint);
    return this.normalizeUser(user);
  }

  async getUserRepositories(userId, options = {}) {
    const {
      owned = true,
      orderBy = "updated_at",
      sort = "desc",
      perPage = 30,
      maxPages = 5,
    } = options;

    const endpoint = `/users/${userId}/projects`;
    const params = {
      owned,
      order_by: orderBy,
      sort,
      per_page: perPage,
    };

    const projects = await this.getAllPages(endpoint, { params, maxPages });
    return projects.map((project) => this.normalizeRepository(project));
  }

  async getGroupRepositories(groupId, options = {}) {
    const {
      orderBy = "updated_at",
      sort = "desc",
      perPage = 30,
      maxPages = 5,
    } = options;

    const endpoint = `/groups/${groupId}/projects`;
    const params = {
      order_by: orderBy,
      sort,
      per_page: perPage,
    };

    const projects = await this.getAllPages(endpoint, { params, maxPages });
    return projects.map((project) => this.normalizeRepository(project));
  }

  // Override file content helper for GitLab's API structure
  async getFileContent(projectId, path, branch = "main") {
    try {
      const content = await this.getRepositoryContent(projectId, path, branch);

      if (content.encoding === "base64") {
        return {
          content: Buffer.from(content.content, "base64").toString("utf8"),
          encoding: "utf8",
          path: content.file_path,
          sha: content.commit_id,
        };
      }

      return {
        content: content.content,
        encoding: content.encoding,
        path: content.file_path,
        sha: content.commit_id,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // File not found
      }
      throw error;
    }
  }

  // Override repository normalization for GitLab's structure
  normalizeRepository(project) {
    return {
      id: project.id,
      name: project.name,
      fullName: project.path_with_namespace,
      description: project.description,
      private: project.visibility !== "public",
      defaultBranch: project.default_branch,
      htmlUrl: project.web_url,
      cloneUrl: project.http_url_to_repo,
      sshUrl: project.ssh_url_to_repo,
      stars: project.star_count || 0,
      forks: project.forks_count || 0,
      language: project.languages ? Object.keys(project.languages)[0] : null,
      topics: project.tag_list || [],
      lastUpdated: project.last_activity_at,
      createdAt: project.created_at,
      owner: {
        login: project.namespace?.path || project.owner?.username,
        avatar: project.namespace?.avatar_url || project.owner?.avatar_url,
        type: project.namespace?.kind === "group" ? "Organization" : "User",
      },
      permissions: {
        admin: project.permissions?.project_access?.access_level >= 40,
        push: project.permissions?.project_access?.access_level >= 30,
        pull: project.permissions?.project_access?.access_level >= 10,
      },
    };
  }

  // Override branch normalization for GitLab's structure
  normalizeBranch(branch) {
    return {
      name: branch.name,
      commitSha: branch.commit?.id,
      isDefault: branch.default || false,
      protected: branch.protected || false,
      lastCommit: {
        sha: branch.commit?.id,
        message: branch.commit?.message,
        author: branch.commit?.author_name,
        email: branch.commit?.author_email,
        date: branch.commit?.authored_date,
      },
    };
  }

  // GitLab-specific methods
  async triggerPipeline(projectId, ref = "main", variables = {}) {
    const endpoint = `/projects/${encodeURIComponent(projectId)}/pipeline`;
    const data = {
      ref,
      variables: Object.entries(variables).map(([key, value]) => ({
        key,
        value,
      })),
    };

    return await this.makeRequest(endpoint, { method: "POST", data });
  }

  async getPipelines(projectId, options = {}) {
    const {
      ref,
      status,
      orderBy = "updated_at",
      sort = "desc",
      perPage = 30,
    } = options;

    const endpoint = `/projects/${encodeURIComponent(projectId)}/pipelines`;
    const params = {
      ref,
      status,
      order_by: orderBy,
      sort,
      per_page: perPage,
    };

    const pipelines = await this.makeRequest(endpoint, { params });
    return pipelines || [];
  }
}

module.exports = GitLabProvider;
