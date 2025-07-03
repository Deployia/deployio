/**
 * Repository Data Fetcher Utility
 * Centralizes repository data fetching logic for both authenticated and public repositories
 */

const axios = require("axios");
const logger = require("@config/logger");

class RepositoryDataFetcher {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  /**
   * Fetch comprehensive repository data with enhanced file content extraction
   */
  async fetchRepositoryData(repositoryUrl, branch = "main", isPublic = false) {
    try {
      // Parse repository URL
      const parsedRepo = this._parseRepositoryUrl(repositoryUrl);
      const { owner, repo } = parsedRepo;

      // Log parsed values for debugging
      logger.info("Parsed repository info", {
        repositoryUrl,
        owner,
        repo,
        branch,
      });

      // Configure axios for GitHub API
      const axiosConfig = this.githubToken
        ? { headers: { Authorization: `token ${this.githubToken}` } }
        : {};

      // Log the URLs being fetched
      const repoInfoUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const branchInfoUrl = `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`;
      logger.info("Fetching repo info", { repoInfoUrl });
      logger.info("Fetching branch info", { branchInfoUrl });

      // Fetch basic repository info
      const repoResponse = await axios.get(repoInfoUrl, axiosConfig);
      const repository = repoResponse.data;

      // Fetch branch info to get commit SHA
      const branchResponse = await axios.get(branchInfoUrl, axiosConfig);
      const commitSha = branchResponse.data.commit.sha;
      logger.info("Fetched branch commit SHA", { commitSha });

      // Fetch comprehensive file tree using commit SHA
      const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`;
      logger.info("Fetching repo tree", { treeUrl });
      const treeResponse = await axios.get(treeUrl, axiosConfig);
      const fileTree = treeResponse.data.tree || [];

      // Get comprehensive file content for analysis
      const { keyFiles, enhancedFileTree } = await this._fetchKeyFiles(
        owner,
        repo,
        branch,
        fileTree,
        axiosConfig
      );

      // Format repository data for AI service
      const repositoryData = {
        repository: {
          name: repository.name,
          full_name: repository.full_name,
          description: repository.description,
          default_branch: repository.default_branch,
          language: repository.language,
          private: repository.private,
          html_url: repository.html_url,
          clone_url: repository.clone_url,
          ssh_url: repository.ssh_url,
          topics: repository.topics || [],
          stars: repository.stargazers_count || 0,
          forks: repository.forks_count || 0,
          created_at: repository.created_at,
          updated_at: repository.updated_at,
          owner: {
            login: repository.owner.login,
            avatar_url: repository.owner.avatar_url,
            type: repository.owner.type,
          },
        },
        files: keyFiles, // File content strings for AI analysis
        file_tree: enhancedFileTree,
        metadata: {
          provider: "github",
          branch,
          fetched_at: new Date().toISOString(),
          is_public: isPublic,
          total_files: fileTree.length,
          analyzed_files: Object.keys(keyFiles).length,
        },
        repository_url: repositoryUrl,
      };

      logger.info(
        `Successfully fetched comprehensive repository data for ${repository.full_name}`,
        {
          totalFiles: fileTree.length,
          keyFiles: Object.keys(keyFiles).length,
          fileTree: enhancedFileTree.length,
        }
      );

      return repositoryData;
    } catch (error) {
      this._handleFetchError(error, repositoryUrl);
    }
  }

  /**
   * Fetch key files with comprehensive content extraction
   */
  async _fetchKeyFiles(owner, repo, branch, fileTree, axiosConfig) {
    const keyFiles = {};

    // Enhanced list of important files for comprehensive analysis
    const importantFilePatterns = [
      // Package managers and dependencies
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "requirements.txt",
      "setup.py",
      "pyproject.toml",
      "Pipfile",
      "Pipfile.lock",
      "poetry.lock",
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "composer.json",
      "composer.lock",
      "Gemfile",
      "Gemfile.lock",
      "Cargo.toml",
      "Cargo.lock",
      "go.mod",
      "go.sum",

      // Docker and containerization
      "Dockerfile",
      "docker-compose.yml",
      "docker-compose.yaml",
      ".dockerignore",

      // Build and configuration files
      "tsconfig.json",
      "webpack.config.js",
      "vite.config.js",
      "rollup.config.js",
      "next.config.js",
      "nuxt.config.js",
      "vue.config.js",
      "angular.json",
      ".eslintrc.js",
      ".eslintrc.json",
      "babel.config.js",
      "jest.config.js",
      "tailwind.config.js",

      // Environment and configuration
      ".env",
      ".env.example",
      ".env.local",
      "config.json",
      "app.json",
      "vercel.json",
      "netlify.toml",

      // Documentation
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      "CONTRIBUTING.md",

      // CI/CD files
      ".github/workflows/*.yml",
      ".github/workflows/*.yaml",
      ".gitlab-ci.yml",
      "azure-pipelines.yml",
      "jenkins.yml",
      "travis.yml",

      // Framework and application specific
      "manifest.json",
      "index.html",
      "main.py",
      "app.py",
      "wsgi.py",
      "asgi.py",
      "server.js",
      "index.js",
      "manage.py",
      "settings.py",
      "urls.py",
      "models.py",
      "views.py",

      // Common entry points for deeper analysis
      "src/index.js",
      "src/index.ts",
      "src/main.js",
      "src/main.ts",
      "src/App.js",
      "src/App.tsx",
      "src/App.vue",
      "src/app.module.ts",
      "app/main.py",
      "app/__init__.py",
      "app/app.py",
      "main.go",
      "cmd/main.go",
      "src/main.java",
      "index.php",
      "app.php",
    ];

    // Collect files to fetch
    const filesToFetch = new Set();

    // Direct file matches
    for (const pattern of importantFilePatterns) {
      if (pattern.includes("*")) {
        // Handle wildcard patterns
        const basePattern = pattern.replace("*", "");
        const matchingFiles = fileTree.filter(
          (item) =>
            item.type === "blob" &&
            item.path.includes(
              basePattern.replace("*.yml", "").replace("*.yaml", "")
            ) &&
            (item.path.endsWith(".yml") || item.path.endsWith(".yaml"))
        );
        matchingFiles.forEach((f) => filesToFetch.add(f.path));
      } else {
        // Exact and partial matches
        const exactMatch = fileTree.find(
          (item) =>
            item.type === "blob" &&
            (item.path === pattern || item.path.endsWith("/" + pattern))
        );
        if (exactMatch) {
          filesToFetch.add(exactMatch.path);
        }
      }
    }

    // Look for nested package/config files (monorepos)
    const additionalConfigFiles = fileTree.filter(
      (item) =>
        item.type === "blob" &&
        (item.path.includes("package.json") ||
          item.path.includes("requirements.txt") ||
          item.path.includes("setup.py") ||
          item.path.includes("Dockerfile") ||
          item.path.includes("docker-compose") ||
          item.path.includes("pom.xml") ||
          item.path.includes("build.gradle")) &&
        !filesToFetch.has(item.path)
    );
    additionalConfigFiles.forEach((f) => filesToFetch.add(f.path));

    // Add representative source files for code analysis
    const sourceFileExtensions = [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".vue",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".php",
      ".rb",
      ".swift",
      ".kt",
      ".cs",
      ".cpp",
      ".c",
    ];

    const sourceFiles = fileTree
      .filter(
        (item) =>
          item.type === "blob" &&
          sourceFileExtensions.some((ext) => item.path.endsWith(ext)) &&
          item.size < 100000 && // Limit to files under 100KB
          !filesToFetch.has(item.path)
      )
      .sort((a, b) => {
        // Prioritize important files
        const aImportant = this._isImportantSourceFile(a.path);
        const bImportant = this._isImportantSourceFile(b.path);
        if (aImportant && !bImportant) return -1;
        if (!aImportant && bImportant) return 1;
        return a.path.localeCompare(b.path);
      })
      .slice(0, 15); // Increased limit for better analysis

    sourceFiles.forEach((f) => filesToFetch.add(f.path));

    // Convert to array and limit total files
    const uniqueFiles = Array.from(filesToFetch).slice(0, 50);

    logger.info(
      `Fetching ${uniqueFiles.length} key files for comprehensive analysis`,
      { files: uniqueFiles }
    );

    // Fetch file contents in parallel with error handling
    const filePromises = uniqueFiles.map(async (filePath) => {
      try {
        const fileResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          axiosConfig
        );

        if (fileResponse.data.content) {
          const content = Buffer.from(
            fileResponse.data.content,
            "base64"
          ).toString("utf8");
          return { path: filePath, content, size: fileResponse.data.size };
        }
      } catch (err) {
        logger.debug(`Could not fetch ${filePath}: ${err.message}`);
        return null;
      }
    });

    const fileResults = await Promise.all(filePromises);

    // Build key files object
    fileResults.forEach((result) => {
      if (result) {
        keyFiles[result.path] = result.content;
      }
    });

    // Enhanced file tree with metadata
    const enhancedFileTree = fileTree
      .filter((item) => item.type === "blob" && item.size < 1000000)
      .map((item) => ({
        path: item.path,
        size: item.size,
        type: item.type,
      }))
      .sort((a, b) => {
        // Sort by importance
        const aImportant = importantFilePatterns.some((pattern) =>
          a.path.includes(pattern.replace("*", ""))
        );
        const bImportant = importantFilePatterns.some((pattern) =>
          b.path.includes(pattern.replace("*", ""))
        );
        if (aImportant && !bImportant) return -1;
        if (!aImportant && bImportant) return 1;
        return a.path.localeCompare(b.path);
      });

    return { keyFiles, enhancedFileTree };
  }

  /**
   * Check if a source file is important for analysis
   */
  _isImportantSourceFile(filePath) {
    const importantPatterns = [
      "index",
      "main",
      "app",
      "server",
      "api",
      "config",
      "routes",
      "models",
      "controllers",
      "services",
      "components",
      "utils",
    ];
    return importantPatterns.some((pattern) =>
      filePath.toLowerCase().includes(pattern)
    );
  }

  /**
   * Parse repository URL to extract owner and repo
   */
  _parseRepositoryUrl(repositoryUrl) {
    try {
      let cleanUrl = repositoryUrl;

      // Convert SSH to HTTPS format
      if (repositoryUrl.startsWith("git@")) {
        cleanUrl = repositoryUrl
          .replace("git@", "https://")
          .replace(".com:", ".com/")
          .replace(".git", "");
      }

      // Remove .git suffix
      cleanUrl = cleanUrl.replace(/\.git$/, "");

      const url = new URL(cleanUrl);
      const pathParts = url.pathname
        .split("/")
        .filter((part) => part.length > 0);

      if (pathParts.length < 2) {
        throw new Error("Invalid repository URL format");
      }

      return {
        owner: pathParts[0],
        repo: pathParts[1],
      };
    } catch (error) {
      throw new Error(`Invalid repository URL: ${repositoryUrl}`);
    }
  }

  /**
   * Handle fetch errors with specific context
   */
  _handleFetchError(error, repositoryUrl) {
    if (error.response?.status === 404) {
      throw new Error("Repository not found or is private");
    } else if (error.response?.status === 403) {
      throw new Error("API rate limit exceeded or repository access denied");
    } else if (error.response?.status === 401) {
      throw new Error("GitHub authentication failed");
    }
    throw new Error(`Failed to fetch repository data: ${error.message}`);
  }
}

module.exports = RepositoryDataFetcher;
