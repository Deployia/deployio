/**
 * Base Git Provider Class
 * Abstract class that defines the interface for all git providers
 */

class BaseGitProvider {
  constructor(accessToken, providerConfig = {}) {
    this.accessToken = accessToken;
    this.config = providerConfig;
    this.baseURL = this.getBaseURL();
    this.headers = this.getDefaultHeaders();
  }

  // Abstract methods that must be implemented by each provider
  getBaseURL() {
    throw new Error("getBaseURL must be implemented by provider");
  }

  getDefaultHeaders() {
    throw new Error("getDefaultHeaders must be implemented by provider");
  }

  async getRepositories(options = {}) {
    throw new Error("getRepositories must be implemented by provider");
  }

  async getRepository(owner, repo) {
    throw new Error("getRepository must be implemented by provider");
  }

  async getBranches(owner, repo) {
    throw new Error("getBranches must be implemented by provider");
  }

  async getRepositoryContent(owner, repo, path = "", branch = "main") {
    throw new Error("getRepositoryContent must be implemented by provider");
  }

  async createWebhook(owner, repo, webhookUrl, events = []) {
    throw new Error("createWebhook must be implemented by provider");
  }

  async searchRepositories(query, options = {}) {
    throw new Error("searchRepositories must be implemented by provider");
  }

  // Common utility methods
  normalizeRepository(repo) {
    return {
      id: repo.id,
      name: repo.name,
      fullName:
        repo.full_name ||
        `${repo.owner?.login || repo.owner?.username}/${repo.name}`,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch || repo.defaultBranch,
      htmlUrl: repo.html_url || repo.web_url,
      cloneUrl: repo.clone_url || repo.http_url_to_repo,
      sshUrl: repo.ssh_url || repo.ssh_url_to_repo,
      stars: repo.stargazers_count || repo.star_count || 0,
      forks: repo.forks_count || repo.forks || 0,
      language: repo.language,
      topics: repo.topics || [],
      lastUpdated: repo.updated_at || repo.last_activity_at,
      createdAt: repo.created_at,
      owner: {
        login: repo.owner?.login || repo.owner?.username,
        avatar: repo.owner?.avatar_url,
        type: repo.owner?.type,
      },
      permissions: repo.permissions || {},
    };
  }

  normalizeBranch(branch) {
    return {
      name: branch.name,
      commitSha: branch.commit?.sha || branch.commit?.id,
      isDefault: branch.default || false,
      protected: branch.protected || false,
      lastCommit: {
        sha: branch.commit?.sha || branch.commit?.id,
        message: branch.commit?.commit?.message || branch.commit?.message,
        author: branch.commit?.commit?.author || branch.commit?.author,
        date:
          branch.commit?.commit?.author?.date || branch.commit?.authored_date,
      },
    };
  }

  normalizeUser(user) {
    return {
      id: user.id,
      login: user.login || user.username,
      name: user.name || user.display_name,
      email: user.email,
      avatar: user.avatar_url,
      profileUrl: user.html_url || user.web_url,
      type: user.type || "User",
    };
  }

  // HTTP request helper
  async makeRequest(endpoint, options = {}) {
    const axios = require("axios");

    const config = {
      method: options.method || "GET",
      url: `${this.baseURL}${endpoint}`,
      headers: {
        ...this.headers,
        ...options.headers,
      },
      params: options.params,
      data: options.data,
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`${this.constructor.name} API Error:`, {
        endpoint,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
      throw error;
    }
  }

  // Pagination helper
  async getAllPages(endpoint, options = {}) {
    const results = [];
    let page = 1;
    const perPage = options.perPage || 100;
    let hasNextPage = true;

    while (hasNextPage && page <= (options.maxPages || 10)) {
      const pageOptions = {
        ...options,
        params: {
          ...options.params,
          page,
          per_page: perPage,
        },
      };

      const data = await this.makeRequest(endpoint, pageOptions);

      if (Array.isArray(data)) {
        results.push(...data);
        hasNextPage = data.length === perPage;
      } else {
        // Handle different pagination structures
        const items = data.items || data.values || data;
        if (Array.isArray(items)) {
          results.push(...items);
          hasNextPage = items.length === perPage;
        } else {
          hasNextPage = false;
        }
      }

      page++;
    }

    return results;
  }

  // File content helper
  async getFileContent(owner, repo, path, branch = "main") {
    try {
      const content = await this.getRepositoryContent(
        owner,
        repo,
        path,
        branch
      );

      if (content.encoding === "base64") {
        return {
          content: Buffer.from(content.content, "base64").toString("utf8"),
          encoding: "utf8",
          path: content.path,
          sha: content.sha,
        };
      }

      return content;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // File not found
      }
      throw error;
    }
  }

  // Common validation
  validateRepositoryAccess(repo, requiredPermissions = []) {
    if (!repo.permissions) return true; // Assume access if no permissions info

    return requiredPermissions.every(
      (permission) => repo.permissions[permission] === true
    );
  }
}

module.exports = BaseGitProvider;
