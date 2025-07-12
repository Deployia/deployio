// Repository Service using Backend Server
// This communicates with the backend server which handles authentication and Git provider integration

import api from "../utils/api";

class RepositoryService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    this.apiEndpoint = `${this.baseURL}/api/v1/users/git-providers`;
    this.provider = "github"; // Default provider
  }

  // Check if API is configured
  isConfigured() {
    return !!this.baseURL;
  }

  // No manual authentication logic needed; api.js handles auth

  // Set provider (github, gitlab, etc.)
  setProvider(provider) {
    this.provider = provider;
  }

  // Get available providers
  async getProviders() {
    try {
      const response = await api.get(`/users/git-providers`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Error fetching providers:", error);
      throw this.handleError(error);
    }
  }

  // Get connected providers
  async getConnectedProviders() {
    try {
      const response = await api.get(`/users/git-providers/connected`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error("Error fetching connected providers:", error);
      throw this.handleError(error);
    }
  }

  // Get repository information
  async getRepository(owner, repo) {
    try {
      const response = await api.get(
        `/users/git-providers/${this.provider}/repositories/${owner}/${repo}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Error fetching repository:", error);
      throw this.handleError(error);
    }
  }

  // Get repository tree (file structure)
  async getRepositoryTree(owner, repo, branch = "main", recursive = true) {
    try {
      const response = await api.get(
        `/users/git-providers/${this.provider}/repositories/${owner}/${repo}/tree`,
        {
          params: { branch, recursive },
        }
      );
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Error fetching repository tree:", error);
      throw this.handleError(error);
    }
  }

  // Get file content
  async getFileContent(owner, repo, path, branch = "main") {
    try {
      const response = await api.get(
        `/users/git-providers/${this.provider}/repositories/${owner}/${repo}/contents/${path}`,
        {
          params: { branch },
        }
      );
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw this.handleError(error);
    }
  }

  // Get multiple files content (for initial load)
  async getMultipleFiles(owner, repo, paths, branch = "main") {
    try {
      const promises = paths.map((path) =>
        this.getFileContent(owner, repo, path, branch).catch((error) => ({
          path,
          error: error.message,
          success: false,
        }))
      );
      const results = await Promise.allSettled(promises);

      return results.map((result, index) => ({
        path: paths[index],
        success: result.status === "fulfilled" && !result.value?.error,
        data: result.status === "fulfilled" ? result.value : null,
        error:
          result.status === "rejected" ? result.reason : result.value?.error,
      }));
    } catch (error) {
      console.error("Error fetching multiple files:", error);
      throw this.handleError(error);
    }
  }

  // Transform GitHub tree to our file structure format
  transformTreeToFileStructure(tree, repositoryName) {
    if (!tree || !tree.tree) {
      return {
        id: "root",
        name: repositoryName || "Repository",
        type: "folder",
        children: [],
      };
    }

    const fileMap = new Map();
    const rootChildren = [];

    // Sort items: folders first, then files
    const sortedTree = tree.tree.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "tree" ? -1 : 1;
      }
      return a.path.localeCompare(b.path);
    });

    // Filter out duplicate paths and process only unique items
    const uniqueItems = new Map();
    sortedTree.forEach((item) => {
      if (!uniqueItems.has(item.path)) {
        uniqueItems.set(item.path, item);
      }
    });

    // First pass: create all items
    Array.from(uniqueItems.values()).forEach((item) => {
      const pathParts = item.path.split("/");
      const name = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join("/");

      const fileItem = {
        id: item.path,
        name: name,
        type: item.type === "tree" ? "folder" : "file",
        path: item.path,
        size: item.size || 0,
        ...(item.type === "blob" && {
          language: this.getLanguageFromPath(item.path),
          editable: this.isFileEditable(item.path),
        }),
        ...(item.type === "tree" && { children: [] }),
      };

      fileMap.set(item.path, fileItem);

      // Add to parent or root
      if (parentPath === "") {
        rootChildren.push(fileItem);
      }
    });

    // Second pass: build hierarchy
    Array.from(uniqueItems.values()).forEach((item) => {
      const pathParts = item.path.split("/");
      const parentPath = pathParts.slice(0, -1).join("/");

      if (parentPath !== "") {
        const parent = fileMap.get(parentPath);
        const child = fileMap.get(item.path);
        if (parent && child && parent.type === "folder") {
          // Check for duplicates before adding
          const existingChild = parent.children.find(
            (c) => c.path === child.path
          );
          if (!existingChild) {
            parent.children.push(child);
          }
        }
      }
    });

    return {
      id: "root",
      name: repositoryName || "Repository",
      type: "folder",
      children: rootChildren,
    };
  }

  // Get language from file path
  getLanguageFromPath(path) {
    const ext = path.split(".").pop()?.toLowerCase();
    const languageMap = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
      sh: "bash",
      dockerfile: "dockerfile",
    };

    if (path.toLowerCase().includes("dockerfile")) {
      return "dockerfile";
    }

    return languageMap[ext] || "text";
  }

  // Check if file is editable (DevOps configs are read-only)
  isFileEditable(path) {
    const readOnlyPatterns = [
      /dockerfile/i,
      /docker-compose\.ya?ml$/i,
      /\.dockerignore$/i,
      /\.github\/workflows\//i,
      /package\.json$/i,
      /package-lock\.json$/i,
      /yarn\.lock$/i,
      /requirements\.txt$/i,
      /pipfile$/i,
      /makefile$/i,
    ];

    return !readOnlyPatterns.some((pattern) => pattern.test(path));
  }

  // Parse repository URL to extract owner and repo
  parseRepositoryUrl(repositoryUrl) {
    try {
      const url = new URL(repositoryUrl);
      const pathParts = url.pathname.split("/").filter(Boolean);

      if (pathParts.length >= 2) {
        return {
          owner: pathParts[0],
          repo: pathParts[1].replace(/\.git$/, ""), // Remove .git suffix if present
        };
      }

      throw new Error("Invalid repository URL format");
    } catch {
      throw new Error(`Invalid repository URL: ${repositoryUrl}`);
    }
  }

  // Test provider connection
  async testConnection(provider = this.provider) {
    try {
      const response = await api.get(`/users/git-providers/${provider}/test`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Error testing connection:", error);
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Backend API error
      const { status, data } = error.response;
      return {
        type: "api_error",
        status,
        message: data.message || "Backend API error",
        details: data.error,
      };
    } else if (error.request) {
      // Network error
      return {
        type: "network_error",
        message: "Network error - please check your connection",
      };
    } else {
      // Other error
      return {
        type: "unknown_error",
        message: error.message || "An unknown error occurred",
      };
    }
  }

  // Check service health
  async checkHealth() {
    try {
      const response = await api.get(`/users/git-providers`);
      return response.data.success;
    } catch (error) {
      console.error("Repository service health check failed:", error);
      return false;
    }
  }
}

// Create singleton instance
const repositoryService = new RepositoryService();

export default repositoryService;
export { RepositoryService };
