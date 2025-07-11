import axios from "axios";

// TODO: Move this to backend with proper authentication and token management
// This is a temporary client-side implementation for development

const GITHUB_API_BASE = "https://api.github.com";

class GitHubService {
  constructor(token = null) {
    this.token = token;
    this.owner = "vasudevshetty";
    this.repo = "mern";
    this.branch = "main";

    // Create axios instance with default config
    this.api = axios.create({
      baseURL: GITHUB_API_BASE,
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(this.token && { Authorization: `token ${this.token}` }),
      },
    });
  }

  // Set GitHub token
  setToken(token) {
    this.token = token;
    this.api.defaults.headers["Authorization"] = `token ${token}`;
  }

  // Set repository (owner and repo name)
  setRepository(owner, repo, branch = "main") {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
  }

  // Get repository information
  async getRepository() {
    try {
      const response = await this.api.get(`/repos/${this.owner}/${this.repo}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching repository:", error);
      throw this.handleError(error);
    }
  }

  // Get repository tree (file structure)
  async getRepositoryTree(recursive = true) {
    try {
      const response = await this.api.get(
        `/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=${
          recursive ? 1 : 0
        }`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching repository tree:", error);
      throw this.handleError(error);
    }
  }

  // Get file content
  async getFileContent(path) {
    try {
      const response = await this.api.get(
        `/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`
      );

      // Decode base64 content if it's a file
      if (response.data.type === "file" && response.data.content) {
        return {
          ...response.data,
          decodedContent: atob(response.data.content.replace(/\n/g, "")),
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw this.handleError(error);
    }
  }

  // Get multiple files content (for initial load)
  async getMultipleFiles(paths) {
    try {
      const promises = paths.map((path) => this.getFileContent(path));
      const results = await Promise.allSettled(promises);

      return results.map((result, index) => ({
        path: paths[index],
        success: result.status === "fulfilled",
        data: result.status === "fulfilled" ? result.value : null,
        error: result.status === "rejected" ? result.reason : null,
      }));
    } catch (error) {
      console.error("Error fetching multiple files:", error);
      throw this.handleError(error);
    }
  }

  // Transform GitHub tree to our file structure format
  transformTreeToFileStructure(tree) {
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
        sha: item.sha,
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
      name: this.repo,
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

  // Error handling
  handleError(error) {
    if (error.response) {
      // GitHub API error
      const { status, data } = error.response;
      return {
        type: "api_error",
        status,
        message: data.message || "GitHub API error",
        documentation_url: data.documentation_url,
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
}

// Create singleton instance
const gitHubService = new GitHubService();

export default gitHubService;
export { GitHubService };
