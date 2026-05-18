// Git Provider Service - Database Operations
// Handles all database operations for Git provider connections

const User = require("@models/User");
const GitProviderFactory = require("@services/gitProviders/ProviderFactory");
const RepositoryDataFetcher = require("./RepositoryDataFetcher");
const { getRedisClient } = require("@config/redisClient");
const {
  normalizeGitProviderKey,
  toApiProviderId,
} = require("@utils/gitProviderKeys");
const {
  encryptProviderTokenFields,
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
} = require("@utils/gitProviderTokens");

class GitProviderService {
  static _canonicalProvider(provider) {
    const canonical = normalizeGitProviderKey(provider);
    if (!canonical) {
      throw new Error(`Unsupported git provider: ${provider}`);
    }
    return canonical;
  }

  static _apiProviderId(provider) {
    return toApiProviderId(this._canonicalProvider(provider));
  }

  static _tokenSelectFields(canonical) {
    return `+gitProviders.${canonical}.accessToken +gitProviders.${canonical}.refreshToken +gitProviders`;
  }

  /** Move legacy azuredevops subdocument to gitProviders.azureDevOps */
  static _migrateLegacyProviderKeys(user) {
    if (!user.gitProviders) {
      return;
    }
    const legacy = user.gitProviders.azuredevops;
    if (legacy && !user.gitProviders.azureDevOps) {
      user.gitProviders.azureDevOps = legacy;
      user.gitProviders.azuredevops = undefined;
      user.markModified("gitProviders");
    }
  }

  static _providerData(user, provider) {
    const canonical = this._canonicalProvider(provider);
    this._migrateLegacyProviderKeys(user);
    return user.gitProviders?.[canonical] || null;
  }

  /**
   * Helper method to check if user has valid token for provider
   */
  static _hasValidGitProviderToken(user, provider) {
    const providerData = this._providerData(user, provider);
    if (!providerData) {
      return false;
    }
    return (
      providerData.isConnected &&
      providerData.accessToken &&
      (!providerData.tokenExpiry || providerData.tokenExpiry > new Date())
    );
  }

  /**
   * Helper method to get git provider token with playground fallback
   */
  static _getGitProviderToken(user, provider, isPlaygroundRequest = false) {
    const canonical = this._canonicalProvider(provider);
    const providerData = this._providerData(user, provider);
    if (providerData?.accessToken) {
      return getDecryptedAccessToken(providerData);
    }

    // Fallback: use environment token for github if available
    if (canonical === "github") {
      const envToken =
        process.env.GITHUB_TOKEN || process.env.GITHUB_PLAYGROUND_TOKEN;
      if (envToken && envToken !== "your_github_token_here") {
        console.log(
          `Using environment GitHub token as fallback for user ${user._id}`,
        );
        return envToken;
      }
    }

    throw new Error(
      `No ${provider} provider connected and no environment token available`,
    );
  }

  /**
   * Helper method to check if user has valid token or playground fallback is available
   */
  static _hasValidGitProviderTokenOrFallback(
    user,
    provider,
    isPlaygroundRequest = false,
  ) {
    // Check if user has their own valid token
    if (this._hasValidGitProviderToken(user, provider)) {
      return true;
    }

    // Fallback: check if environment token is available for github
    if (this._canonicalProvider(provider) === "github") {
      const envToken =
        process.env.GITHUB_TOKEN || process.env.GITHUB_PLAYGROUND_TOKEN;
      return !!(envToken && envToken !== "your_github_token_here");
    }

    return false;
  }

  /**
   * Helper method to update provider last used timestamp
   */
  static _updateProviderLastUsed(user, provider) {
    const canonical = this._canonicalProvider(provider);
    if (user.gitProviders?.[canonical]) {
      user.gitProviders[canonical].lastUsed = new Date();
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
          provider: toApiProviderId(providerName),
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

      const canonical = this._canonicalProvider(provider);
      const apiId = toApiProviderId(canonical);

      if (!GitProviderFactory.getSupportedProviders().includes(apiId)) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      this._migrateLegacyProviderKeys(user);

      if (!user.gitProviders) {
        user.gitProviders = {};
      }

      if (!user.gitProviders[canonical]) {
        user.gitProviders[canonical] = {};
      }
      const providerData = user.gitProviders[canonical];

      if (tokenData.accessToken) {
        providerData.accessToken = tokenData.accessToken;
      }
      if (tokenData.refreshToken) {
        providerData.refreshToken = tokenData.refreshToken;
      }
      encryptProviderTokenFields(providerData);
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
        provider: apiId,
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

      const canonical = this._canonicalProvider(provider);
      this._migrateLegacyProviderKeys(user);

      if (!user.gitProviders?.[canonical]) {
        throw new Error("Provider not connected");
      }

      user.gitProviders[canonical] = undefined;
      if (canonical === "azureDevOps" && user.gitProviders.azuredevops) {
        user.gitProviders.azuredevops = undefined;
      }
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
      const canonical = this._canonicalProvider(provider);
      const user = await User.findById(userId).select(
        this._tokenSelectFields(canonical),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const apiId = this._apiProviderId(provider);
      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(apiId, token);

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
      const isPlaygroundRequest = options.isPlayground || false;

      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) {
        throw new Error("User not found");
      }

      console.log(`Getting repositories for ${provider}:`, {
        userId,
        isPlaygroundRequest,
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

      if (
        !this._hasValidGitProviderTokenOrFallback(
          user,
          provider,
          isPlaygroundRequest,
        )
      ) {
        throw new Error(
          "No valid token for provider and no playground fallback available",
        );
      }

      const token = this._getGitProviderToken(
        user,
        provider,
        isPlaygroundRequest,
      );
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token,
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
  static async getRepository(userId, provider, repoFullName, options = {}) {
    try {
      const isPlaygroundRequest = options.isPlayground || false;

      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (
        !this._hasValidGitProviderTokenOrFallback(
          user,
          provider,
          isPlaygroundRequest,
        )
      ) {
        throw new Error(
          "No valid token for provider and no playground fallback available",
        );
      }

      const token = this._getGitProviderToken(
        user,
        provider,
        isPlaygroundRequest,
      );
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token,
      );

      const canonical = this._canonicalProvider(provider);
      let repository;

      if (canonical === "gitlab") {
        repository = await providerInstance.getRepository(repoFullName);
      } else if (canonical === "azureDevOps") {
        const parts = repoFullName.split("/");
        if (parts.length < 3) {
          throw new Error(
            "Invalid Azure DevOps repository format. Expected 'organization/project/repository'",
          );
        }
        const repoName = parts.pop();
        const ownerName = parts.join("/");
        repository = await providerInstance.getRepository(ownerName, repoName);
      } else {
        const [ownerName, repoName] = repoFullName.split("/");
        if (!ownerName || !repoName) {
          throw new Error(`Invalid repository full name: ${repoFullName}`);
        }
        repository = await providerInstance.getRepository(ownerName, repoName);
      }

      // Only update last used timestamp if user has their own token
      if (this._hasValidGitProviderToken(user, provider)) {
        this._updateProviderLastUsed(user, provider);
        await user.save();
      }

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
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const apiId = this._apiProviderId(provider);
      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(apiId, token);

      const canonical = this._canonicalProvider(provider);
      let branches;

      if (canonical === "gitlab") {
        branches = await providerInstance.getBranches(repoFullName);
      } else if (canonical === "azureDevOps") {
        const parts = repoFullName.split("/");
        if (parts.length < 3) {
          throw new Error(
            "Invalid Azure DevOps repository format. Expected 'organization/project/repository'",
          );
        }
        const repo = parts.pop();
        const owner = parts.join("/");
        branches = await providerInstance.getBranches(owner, repo);
      } else {
        const [owner, repo] = repoFullName.split("/");
        if (!owner || !repo) {
          throw new Error("Invalid repository format. Expected 'owner/repo'");
        }
        branches = await providerInstance.getBranches(owner, repo);
      }

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      return branches;
    } catch (error) {
      throw new Error(`Failed to get branches: ${error.message}`);
    }
  }

  /**
   * Get commits for a repository branch
   */
  static async getCommits(userId, provider, repoFullName, branch = "main", options = {}) {
    try {
      const user = await User.findById(userId).select(
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const apiId = this._apiProviderId(provider);
      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(apiId, token);

      const canonical = this._canonicalProvider(provider);
      const perPage = options.per_page || options.perPage || 30;

      let commits;
      if (canonical === "gitlab") {
        if (typeof providerInstance.getCommits !== "function") {
          throw new Error("Commits are not supported for this Git provider yet");
        }
        commits = await providerInstance.getCommits(repoFullName, {
          sha: branch,
          per_page: perPage,
        });
      } else if (canonical === "azureDevOps") {
        throw new Error("Commits listing is not supported for Azure DevOps yet");
      } else {
        const [owner, repo] = repoFullName.split("/");
        if (!owner || !repo) {
          throw new Error("Invalid repository format. Expected 'owner/repo'");
        }
        if (typeof providerInstance.getCommits !== "function") {
          throw new Error("Commits are not supported for this Git provider yet");
        }
        commits = await providerInstance.getCommits(owner, repo, {
          sha: branch,
          per_page: perPage,
        });
      }

      this._updateProviderLastUsed(user, provider);
      await user.save();

      return commits;
    } catch (error) {
      throw new Error(`Failed to get commits: ${error.message}`);
    }
  }

  /**
   * Get repository data for analysis
   */
  static async getRepositoryData(
    userId,
    provider,
    repoFullName,
    branch = "main",
  ) {
    const redisClient = getRedisClient();
    const cacheKey = `repo_data:${provider}:${Buffer.from(
      repoFullName,
    ).toString("base64")}:${branch}`;
    // Check Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
    try {
      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) throw new Error("User not found");
      if (!this._hasValidGitProviderToken(user, provider))
        throw new Error("No valid token");
      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token,
      );
      const [owner, repo] = repoFullName.split("/");
      const repository = await providerInstance.getRepository(owner, repo);
      const repositoryStructure = await this._getComprehensiveRepositoryData(
        providerInstance,
        owner,
        repo,
        branch,
      );
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
        files: repositoryStructure.key_files,
        file_tree: repositoryStructure.file_tree,
        metadata: {
          branch: branch,
          analyzed_at: new Date().toISOString(),
          provider: provider,
          total_files: repositoryStructure.file_tree.length,
          analyzed_files: Object.keys(repositoryStructure.key_files).length,
        },
        repository_url:
          repository.htmlUrl || `https://github.com/${repoFullName}`,
      };
      this._updateProviderLastUsed(user, provider);
      await user.save();
      // Cache in Redis for 10 minutes
      await redisClient.setEx(cacheKey, 600, JSON.stringify(repositoryData));
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
      const canonical = this._canonicalProvider(provider);
      const apiId = this._apiProviderId(provider);
      const user = await User.findById(userId).select(
        this._tokenSelectFields(canonical),
      );
      if (!user) {
        throw new Error("User not found");
      }

      this._migrateLegacyProviderKeys(user);
      const providerData = user.gitProviders[canonical];
      const refreshTokenPlain = getDecryptedRefreshToken(providerData);
      if (!refreshTokenPlain) {
        throw new Error("No refresh token available");
      }

      const providerInstance = GitProviderFactory.createProvider(
        apiId,
        refreshTokenPlain,
      );
      const newTokens = await providerInstance.refreshToken();

      if (!user.gitProviders) {
        user.gitProviders = {};
      }
      if (!user.gitProviders[canonical]) {
        user.gitProviders[canonical] = {};
      }

      user.gitProviders[canonical].accessToken = newTokens.accessToken;
      if (newTokens.refreshToken) {
        user.gitProviders[canonical].refreshToken = newTokens.refreshToken;
      }
      if (newTokens.tokenExpiry) {
        user.gitProviders[canonical].tokenExpiry = newTokens.tokenExpiry;
      }
      encryptProviderTokenFields(user.gitProviders[canonical]);

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

      const canonical = this._canonicalProvider(provider);
      const providerData = user.gitProviders[canonical];
      if (!providerData) {
        return null;
      }

      return {
        provider: this._apiProviderId(provider),
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
      const canonical = this._canonicalProvider(provider);
      const user = await User.findById(userId).select(
        this._tokenSelectFields(canonical),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const apiId = this._apiProviderId(provider);
      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(apiId, token);

      const userInfo = await providerInstance.getCurrentUser();

      // Update provider info directly
      if (!user.gitProviders) {
        user.gitProviders = {};
      }
      if (!user.gitProviders[canonical]) {
        user.gitProviders[canonical] = {};
      }

      const providerData = user.gitProviders[canonical];
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
    branch = "main",
  ) {
    try {
      // Parse repository URL to get owner and repo
      const parsedUrl = this._parseRepositoryUrl(repositoryUrl);
      const { owner, repo } = parsedUrl;

      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (!this._hasValidGitProviderToken(user, provider)) {
        throw new Error("No valid token for provider");
      }

      const apiId = this._apiProviderId(provider);
      const token = this._getGitProviderToken(user, provider);
      const providerInstance = GitProviderFactory.createProvider(apiId, token);

      // Get basic repository info
      const repository = await providerInstance.getRepository(owner, repo);

      // Get comprehensive repository structure with key files
      const structure = await this._getComprehensiveRepositoryData(
        providerInstance,
        owner,
        repo,
        branch,
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
   * Get comprehensive repository data using the centralized fetcher
   */
  static async _getComprehensiveRepositoryData(
    providerInstance,
    owner,
    repo,
    branch,
  ) {
    try {
      const repositoryUrl = `https://github.com/${owner}/${repo}`;
      const fetcher = new RepositoryDataFetcher();

      // Use the centralized fetcher for consistent data extraction
      const repositoryData = await fetcher.fetchRepositoryData(
        repositoryUrl,
        branch,
        false, // Not a public-only fetch
      );

      return {
        key_files: repositoryData.files,
        file_tree: repositoryData.file_tree,
      };
    } catch (error) {
      console.error("Error fetching comprehensive repository data:", error);

      // Fallback to basic structure if comprehensive fetch fails
      try {
        const treeData = await providerInstance.getRepositoryTree(
          owner,
          repo,
          branch,
        );
        const fileTree = treeData.files || [];

        return {
          key_files: {},
          file_tree: fileTree.map((item) => ({
            path: item.path,
            size: item.size || 0,
            type: item.type || "blob",
          })),
        };
      } catch (fallbackError) {
        console.error(
          "Fallback repository data fetch also failed:",
          fallbackError,
        );
        return {
          key_files: {},
          file_tree: [],
        };
      }
    }
  }

  /**
   * Get repository tree (file structure)
   */
  static async getRepositoryTree(
    userId,
    provider,
    owner,
    repo,
    branch = "main",
    recursive = true,
    options = {},
  ) {
    try {
      const isPlaygroundRequest = options.isPlayground || false;

      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (
        !this._hasValidGitProviderTokenOrFallback(
          user,
          provider,
          isPlaygroundRequest,
        )
      ) {
        throw new Error(
          `No valid ${provider} token found and no playground fallback available`,
        );
      }

      const token = this._getGitProviderToken(
        user,
        provider,
        isPlaygroundRequest,
      );
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token,
      );

      // Only update last used timestamp if user has their own token
      if (this._hasValidGitProviderToken(user, provider)) {
        this._updateProviderLastUsed(user, provider);
        await user.save();
      }

      const tree = await providerInstance.getRepositoryTree(
        owner,
        repo,
        branch,
      );

      return {
        sha: tree.sha,
        truncated: tree.truncated,
        tree: tree.files || tree.tree || [],
      };
    } catch (error) {
      throw new Error(`Failed to get repository tree: ${error.message}`);
    }
  }

  /**
   * Get file content
   */
  static async getFileContent(
    userId,
    provider,
    owner,
    repo,
    filePath,
    branch = "main",
    options = {},
  ) {
    try {
      const isPlaygroundRequest = options.isPlayground || false;

      // Make sure to select the access tokens since they have select: false in schema
      const user = await User.findById(userId).select(
        this._tokenSelectFields(this._canonicalProvider(provider)),
      );
      if (!user) {
        throw new Error("User not found");
      }

      if (
        !this._hasValidGitProviderTokenOrFallback(
          user,
          provider,
          isPlaygroundRequest,
        )
      ) {
        throw new Error(
          `No valid ${provider} token found and no playground fallback available`,
        );
      }

      const token = this._getGitProviderToken(
        user,
        provider,
        isPlaygroundRequest,
      );
      const providerInstance = GitProviderFactory.createProvider(
        provider,
        token,
      );

      // Only update last used timestamp if user has their own token
      if (this._hasValidGitProviderToken(user, provider)) {
        this._updateProviderLastUsed(user, provider);
        await user.save();
      }

      const content = await providerInstance.getFileContent(
        owner,
        repo,
        filePath,
        branch,
      );

      return content;
    } catch (error) {
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }
}

module.exports = GitProviderService;
