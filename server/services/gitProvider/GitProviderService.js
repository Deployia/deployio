// Git Provider Service - Database Operations
// Handles all database operations for Git provider connections

const User = require("@models/User");
const GitProviderFactory = require("@services/gitProviders/ProviderFactory");

class GitProviderService {
  /**
   * Helper method to check if user has valid token for provider
   */
  static _hasValidGitProviderToken(user, provider) {
    console.log(`Checking token validity for ${provider}:`, {
      hasGitProviders: !!user.gitProviders,
      hasProvider: !!(user.gitProviders && user.gitProviders[provider]),
      providerData:
        user.gitProviders && user.gitProviders[provider]
          ? {
              isConnected: user.gitProviders[provider].isConnected,
              hasAccessToken: !!user.gitProviders[provider].accessToken,
              tokenExpiry: user.gitProviders[provider].tokenExpiry,
              isTokenExpired: user.gitProviders[provider].tokenExpiry
                ? user.gitProviders[provider].tokenExpiry <= new Date()
                : false,
            }
          : null,
    });

    if (!user.gitProviders || !user.gitProviders[provider]) {
      return false;
    }
    const providerData = user.gitProviders[provider];
    return (
      providerData.isConnected &&
      providerData.accessToken &&
      (!providerData.tokenExpiry || providerData.tokenExpiry > new Date())
    );
  }

  /**
   * Helper method to get git provider token
   */
  static _getGitProviderToken(user, provider) {
    if (!user.gitProviders || !user.gitProviders[provider]) {
      throw new Error(`No ${provider} provider connected`);
    }
    return user.gitProviders[provider].accessToken;
  }

  /**
   * Helper method to update provider last used timestamp
   */
  static _updateProviderLastUsed(user, provider) {
    if (user.gitProviders && user.gitProviders[provider]) {
      user.gitProviders[provider].lastUsed = new Date();
    }
  }

  /**
   * Get user's connected Git providers
   */
  static async getConnectedProviders(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const connectedProviders = user.getConnectedGitProviders();

      return connectedProviders.map((providerName) => {
        const providerData = user.gitProviders[providerName];
        return {
          provider: providerName,
          displayName: GitProviderFactory.getProviderConfig(providerName).name,
          username: providerData.username || providerData.displayName,
          email: providerData.email,
          avatar: providerData.avatarUrl,
          connectedAt: providerData.connectedAt,
          lastUsed: providerData.lastUsed,
          hasValidToken: this._hasValidGitProviderToken(user, providerName),
          scopes: providerData.scopes || [],
        };
      });
    } catch (error) {
      throw new Error(`Failed to get connected providers: ${error.message}`);
    }
  }

  /**
   * Connect a Git provider
   */
  static async connectProvider(userId, provider, tokenData, userInfo) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Validate provider
      if (!GitProviderFactory.getSupportedProviders().includes(provider)) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Initialize gitProviders object if it doesn't exist
      if (!user.gitProviders) {
        user.gitProviders = {};
      }

      // Initialize provider object if it doesn't exist
      if (!user.gitProviders[provider]) {
        user.gitProviders[provider] = {};
      } // Store provider connection data
      const providerData = user.gitProviders[provider];

      console.log(`Storing token data for ${provider}:`, {
        hasAccessToken: !!tokenData.accessToken,
        hasRefreshToken: !!tokenData.refreshToken,
        tokenExpiry: tokenData.tokenExpiry,
        scopes: tokenData.scopes,
      });

      // Update token data
      providerData.accessToken = tokenData.accessToken;
      if (tokenData.refreshToken) {
        providerData.refreshToken = tokenData.refreshToken;
      }
      if (tokenData.tokenExpiry) {
        providerData.tokenExpiry = tokenData.tokenExpiry;
      }
      if (tokenData.scopes) {
        providerData.scopes = tokenData.scopes;
      }

      // Update user info
      if (userInfo) {
        if (userInfo.id) providerData.id = userInfo.id;
        if (userInfo.username) providerData.username = userInfo.username;
        if (userInfo.email) providerData.email = userInfo.email;
        if (userInfo.name || userInfo.displayName) {
          providerData.name = userInfo.name || userInfo.displayName;
        }
        if (userInfo.avatarUrl) providerData.avatarUrl = userInfo.avatarUrl;
        if (userInfo.profileUrl) providerData.profileUrl = userInfo.profileUrl;
      }

      // Mark as connected
      providerData.isConnected = true;
      providerData.connectedAt = new Date();

      // Save the user
      await user.save();

      return {
        success: true,
        provider,
        connectedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to connect provider: ${error.message}`);
    }
  }

  /**
   * Disconnect a Git provider
   */
  static async disconnectProvider(userId, provider) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.gitProviders[provider]) {
        throw new Error("Provider not connected");
      }

      // Remove provider data
      user.gitProviders[provider] = undefined;
      await user.save();

      return {
        success: true,
        provider,
        disconnectedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to disconnect provider: ${error.message}`);
    }
  }

  /**
   * Test provider connection
   */
  static async testConnection(userId, provider) {
    try {
      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token
      );

      // Test connection by fetching user info
      const userInfo = await providerInstance.getCurrentUser();

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      return {
        success: true,
        provider,
        userInfo,
        lastTested: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        provider,
        error: error.message,
        lastTested: new Date().toISOString(),
      };
    }
  }

  /**
   * Get repositories for a provider
   */
  static async getRepositories(userId, provider, options = {}) {
    try {
      // Make sure to select the access tokens since they have select: false in schema
      // For nested fields with select: false, we need to explicitly include them
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      console.log(`Getting repositories for ${provider}:`, {
        userId,
        hasGitProviders: !!user.gitProviders,
        hasProvider: !!(user.gitProviders && user.gitProviders[provider]),
        providerKeys: user.gitProviders ? Object.keys(user.gitProviders) : [],
        providerData:
          user.gitProviders && user.gitProviders[provider]
            ? {
                isConnected: user.gitProviders[provider].isConnected,
                hasAccessToken: !!user.gitProviders[provider].accessToken,
                accessTokenLength: user.gitProviders[provider].accessToken
                  ? user.gitProviders[provider].accessToken.length
                  : 0,
              }
            : null,
      });

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token
      );

      const repositories = await providerInstance.getRepositories(options);

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      return repositories;
    } catch (error) {
      throw new Error(`Failed to get repositories: ${error.message}`);
    }
  }

  /**
   * Get specific repository details
   */
  static async getRepository(userId, provider, repoFullName) {
    try {
      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token
      );

      const repository = await providerInstance.getRepository(repoFullName);

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      return repository;
    } catch (error) {
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  }

  /**
   * Get branches for a repository
   */
  static async getBranches(userId, provider, repoFullName) {
    try {
      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token
      );

      const branches = await providerInstance.getBranches(repoFullName);

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      return branches;
    } catch (error) {
      throw new Error(`Failed to get branches: ${error.message}`);
    }
  }

  /**
   * Get repository data for analysis
   */
  static async getRepositoryData(
    userId,
    provider,
    repoFullName,
    branch = "main"
  ) {
    try {
      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token
      );

      // Extract owner and repo from fullName
      const [owner, repo] = repoFullName.split("/");

      // Fetch repository data using the provider
      const repository = await providerInstance.getRepository(owner, repo);

      // Get comprehensive repository structure with key files
      const repositoryStructure = await this._getComprehensiveRepositoryData(
        providerInstance,
        owner,
        repo,
        branch
      );

      // Prepare repository data for AI service in the expected format
      const repositoryData = {
        repository: {
          name: repository.name,
          full_name: repository.fullName,
          description: repository.description,
          private: repository.private,
          default_branch: repository.defaultBranch,
          language: repository.language,
          topics: repository.topics,
          stars: repository.stars,
          forks: repository.forks,
          clone_url: repository.cloneUrl,
          html_url: repository.htmlUrl,
          ssh_url: repository.sshUrl,
          created_at: repository.createdAt,
          updated_at: repository.lastUpdated,
          owner: {
            login: repository.owner?.login,
            avatar_url: repository.owner?.avatar,
            type: repository.owner?.type,
          },
        },
        files: repositoryStructure.key_files, // Changed from 'key_files' to 'files'
        file_tree: repositoryStructure.file_tree,
        metadata: {
          branch: branch,
          analyzed_at: new Date().toISOString(),
          provider: provider,
          total_files: repositoryStructure.file_tree.length,
          analyzed_files: Object.keys(repositoryStructure.key_files).length,
        },
        // Add repository URL for generators
        repository_url:
          repository.htmlUrl || `https://github.com/${repoFullName}`,
      };

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      return repositoryData;
    } catch (error) {
      throw new Error(`Failed to get repository data: ${error.message}`);
    }
  }

  /**
   * Refresh provider token
   */
  static async refreshToken(userId, provider) {
    try {
      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      const refreshToken = user.gitProviders[provider]?.refreshToken;
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const providerInstance = GitProviderFactory.createProvider(
        provider,
        refreshToken
      );
      const newTokens = await providerInstance.refreshToken();

      // Update stored tokens
      if (!user.gitProviders) {
        user.gitProviders = {};
      }
      if (!user.gitProviders[provider]) {
        user.gitProviders[provider] = {};
      }

      user.gitProviders[provider].accessToken = newTokens.accessToken;
      if (newTokens.refreshToken) {
        user.gitProviders[provider].refreshToken = newTokens.refreshToken;
      }
      if (newTokens.tokenExpiry) {
        user.gitProviders[provider].tokenExpiry = newTokens.tokenExpiry;
      }

      await user.save();

      return {
        success: true,
        provider,
        refreshedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Get provider statistics
   */
  static async getProviderStats(userId, provider) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const providerData = user.gitProviders[provider];
      if (!providerData) {
        return null;
      }

      return {
        provider,
        connectedAt: providerData.connectedAt,
        lastUsed: providerData.lastUsed,
        totalRepositories: providerData.repositoryCount || 0,
        organizationCount: providerData.organizationCount || 0,
        hasValidToken: this._hasValidGitProviderToken(user, provider),
      };
    } catch (error) {
      throw new Error(`Failed to get provider stats: ${error.message}`);
    }
  }

  /**
   * Update provider user info
   */
  static async updateProviderInfo(userId, provider) {
    try {
      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token
      );

      const userInfo = await providerInstance.getCurrentUser();

      // Update provider info directly
      if (!user.gitProviders) {
        user.gitProviders = {};
      }
      if (!user.gitProviders[provider]) {
        user.gitProviders[provider] = {};
      }

      const providerData = user.gitProviders[provider];
      if (userInfo.id) providerData.id = userInfo.id;
      if (userInfo.username) providerData.username = userInfo.username;
      if (userInfo.email) providerData.email = userInfo.email;
      if (userInfo.name || userInfo.displayName) {
        providerData.name = userInfo.name || userInfo.displayName;
      }
      if (userInfo.avatarUrl) providerData.avatarUrl = userInfo.avatarUrl;
      if (userInfo.profileUrl) providerData.profileUrl = userInfo.profileUrl;

      await user.save();

      return {
        success: true,
        provider,
        userInfo,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to update provider info: ${error.message}`);
    }
  }

  /**
   * Fetch repository data for AI analysis
   * This method fetches comprehensive repository data including files and structure
   */
  static async fetchRepositoryData(
    userId,
    provider,
    repositoryUrl,
    branch = "main"
  ) {
    try {
      // Parse repository URL to get owner and repo
      const parsedUrl = this._parseRepositoryUrl(repositoryUrl);
      const { owner, repo } = parsedUrl;

      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        `+gitProviders.${provider}.accessToken +gitProviders.${provider}.refreshToken +gitProviders`
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token
      );

      // Get basic repository info
      const repository = await providerInstance.getRepository(owner, repo);

      // Get comprehensive repository structure with key files
      const structure = await this._getComprehensiveRepositoryData(
        providerInstance,
        owner,
        repo,
        branch
      );

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      // Format the data for AI service - match the expected format
      const repositoryData = {
        repository: {
          name: repository.name,
          full_name: repository.fullName,
          description: repository.description,
          default_branch: repository.defaultBranch,
          language: repository.language,
          private: repository.private,
          html_url: repository.htmlUrl,
          clone_url: repository.cloneUrl,
          ssh_url: repository.sshUrl,
          topics: repository.topics || [],
          stars: repository.stars || 0,
          forks: repository.forks || 0,
          created_at: repository.createdAt,
          updated_at: repository.lastUpdated,
          owner: {
            login: repository.owner?.login,
            avatar_url: repository.owner?.avatar,
            type: repository.owner?.type,
          },
        },
        files: structure.key_files, // Changed from 'key_files' to 'files'
        file_tree: structure.file_tree,
        metadata: {
          provider,
          branch,
          fetched_at: new Date().toISOString(),
          total_files: structure.file_tree.length,
          analyzed_files: Object.keys(structure.key_files).length,
        },
        // Add repository URL for generators
        repository_url: repositoryUrl,
      };

      return repositoryData;
    } catch (error) {
      throw new Error(`Failed to fetch repository data: ${error.message}`);
    }
  }

  /**
   * Parse repository URL to extract owner and repo name
   */
  static _parseRepositoryUrl(repositoryUrl) {
    try {
      // Handle different URL formats
      // https://github.com/owner/repo
      // https://github.com/owner/repo.git
      // git@github.com:owner/repo.git

      let cleanUrl = repositoryUrl;

      // Convert SSH to HTTPS format for parsing
      if (repositoryUrl.startsWith("git@")) {
        cleanUrl = repositoryUrl
          .replace("git@", "https://")
          .replace(".com:", ".com/")
          .replace(".git", "");
      }

      // Remove .git suffix if present
      cleanUrl = cleanUrl.replace(/\.git$/, "");

      const url = new URL(cleanUrl);
      const pathParts = url.pathname
        .split("/")
        .filter((part) => part.length > 0);

      if (pathParts.length < 2) {
        throw new Error("Invalid repository URL format");
      }

      const owner = pathParts[0];
      const repo = pathParts[1];

      return { owner, repo };
    } catch (error) {
      throw new Error(`Invalid repository URL: ${repositoryUrl}`);
    }
  }

  /**
   * Get comprehensive repository data similar to demo fetch
   * This ensures we get enough files and content for accurate analysis
   */
  static async _getComprehensiveRepositoryData(
    providerInstance,
    owner,
    repo,
    branch
  ) {
    try {
      // Get file tree first
      const treeData = await providerInstance.getRepositoryTree(
        owner,
        repo,
        branch
      );
      const fileTree = treeData.files || [];

      // Define important files for analysis (same as demo)
      const importantFilePatterns = [
        // Package managers
        "package.json",
        "package-lock.json",
        "yarn.lock",
        "requirements.txt",
        "setup.py",
        "pyproject.toml",
        "Pipfile",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "composer.json",
        "Gemfile",
        "Gemfile.lock",
        "Cargo.toml",
        "go.mod",
        "go.sum",

        // Docker & deployment
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
        ".dockerignore",

        // Configuration files
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

        // Environment & config
        ".env",
        ".env.example",
        "config.json",
        "app.json",

        // Documentation
        "README.md",
        "CHANGELOG.md",
        "LICENSE",

        // Framework specific
        "manifest.json",
        "index.html",
        "main.py",
        "app.py",
        "server.js",
        "index.js",
        "manage.py",
        "settings.py",

        // Common source file patterns for analysis
        "src/index.js",
        "src/index.ts",
        "src/main.js",
        "src/main.ts",
        "src/App.js",
        "src/App.tsx",
        "src/App.vue",
        "app/main.py",
        "app/__init__.py",
        "main.go",
        "cmd/main.go",
        "src/main.java",
        "index.php",
        "app.php",
      ];

      // Find files matching important patterns
      const filesToFetch = [];

      // Direct file matches
      for (const pattern of importantFilePatterns) {
        const matchingFiles = fileTree.filter(
          (file) =>
            file.path === pattern ||
            file.path.endsWith("/" + pattern) ||
            (pattern.includes(".") && file.path.includes(pattern))
        );
        filesToFetch.push(...matchingFiles.map((f) => f.path));
      }

      // Also look for nested package.json files (important for monorepos)
      const additionalPackageFiles = fileTree.filter(
        (file) =>
          file.path.includes("package.json") &&
          !filesToFetch.includes(file.path)
      );
      filesToFetch.push(...additionalPackageFiles.map((f) => f.path));

      // Also look for nested requirements.txt, setup.py, etc.
      const additionalConfigFiles = fileTree.filter(
        (file) =>
          (file.path.includes("requirements.txt") ||
            file.path.includes("setup.py") ||
            file.path.includes("Dockerfile") ||
            file.path.includes("docker-compose")) &&
          !filesToFetch.includes(file.path)
      );
      filesToFetch.push(...additionalConfigFiles.map((f) => f.path));

      // Also include some representative source files for code analysis
      const sourceFileExtensions = [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".py",
        ".java",
        ".php",
        ".go",
        ".rs",
      ];
      const sourceFiles = fileTree.filter(
        (file) =>
          sourceFileExtensions.some((ext) => file.path.endsWith(ext)) &&
          (file.size || 0) < 50000 && // Limit to files under 50KB
          !filesToFetch.includes(file.path)
      );

      // Add up to 10 representative source files
      const representativeSourceFiles = sourceFiles
        .sort((a, b) => {
          // Prefer root level files and common patterns
          const aRoot = !a.path.includes("/");
          const bRoot = !b.path.includes("/");
          if (aRoot && !bRoot) return -1;
          if (!aRoot && bRoot) return 1;

          // Prefer main/index files
          const aMain =
            a.path.includes("index") ||
            a.path.includes("main") ||
            a.path.includes("app");
          const bMain =
            b.path.includes("index") ||
            b.path.includes("main") ||
            b.path.includes("app");
          if (aMain && !bMain) return -1;
          if (!aMain && bMain) return 1;

          return a.path.localeCompare(b.path);
        })
        .slice(0, 10);

      filesToFetch.push(...representativeSourceFiles.map((f) => f.path));

      // Remove duplicates and limit to reasonable number
      const uniqueFiles = [...new Set(filesToFetch)].slice(0, 40); // Increased limit to accommodate source files

      // Fetch content for all identified key files using getRepositoryContent
      const key_files = {};
      const filePromises = uniqueFiles.map(async (filePath) => {
        try {
          const fileContent = await providerInstance.getRepositoryContent(
            owner,
            repo,
            filePath,
            branch
          );
          // getRepositoryContent should return an array, find the file
          const file = Array.isArray(fileContent)
            ? fileContent.find((f) => f.name === filePath.split("/").pop())
            : fileContent;

          if (file && file.content && file.type === "file") {
            // Decode base64 content
            const content = Buffer.from(file.content, "base64").toString(
              "utf-8"
            );
            return {
              path: filePath,
              content: content,
              size: file.size || 0,
              encoding: "utf-8",
            };
          }
        } catch (error) {
          // Silently skip files that can't be fetched
          console.debug(`Could not fetch ${filePath}:`, error.message);
          return null;
        }
      });

      const fileResults = await Promise.all(filePromises);

      // Build key_files object with content strings only
      fileResults.forEach((result) => {
        if (result) {
          key_files[result.path] = result.content; // Send only the content string
        }
      });

      // Enhanced file tree with more metadata
      const enhancedFileTree = fileTree
        .filter((item) => item.type === "blob" && item.size < 1000000) // Filter files under 1MB
        .map((item) => ({
          path: item.path,
          size: item.size || 0,
          type: "blob",
        }))
        .sort((a, b) => {
          // Sort by importance - config files first
          const aImportant = importantFilePatterns.some((pattern) =>
            a.path.includes(pattern.replace("*", ""))
          );
          const bImportant = importantFilePatterns.some((pattern) =>
            b.path.includes(pattern.replace("*", ""))
          );

          if (aImportant && !bImportant) return -1;
          if (!aImportant && bImportant) return 1;
          return 0;
        });

      console.log(
        `GitProviderService: Fetched ${
          Object.keys(key_files).length
        } key files:`,
        Object.keys(key_files)
      );

      return {
        key_files,
        file_tree: enhancedFileTree,
      };
    } catch (error) {
      // Fallback to basic structure
      console.error("Error fetching comprehensive repository data:", error);
      try {
        const basicStructure = await providerInstance.getRepositoryStructure(
          owner,
          repo,
          branch
        );
        return {
          key_files: basicStructure.files || {}, // Internal structure for file content strings
          file_tree: basicStructure.structure?.files || [],
        };
      } catch (fallbackError) {
        return {
          key_files: {}, // Internal structure for file content strings
          file_tree: [],
        };
      }
    }
  }
}

module.exports = GitProviderService;
