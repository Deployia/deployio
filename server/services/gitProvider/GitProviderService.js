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
   * Analyze repository
   */
  static async analyzeRepository(
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

      const analysis = await providerInstance.analyzeRepository(
        repoFullName,
        branch
      );

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze repository: ${error.message}`);
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

      // Get repository structure (files and content)
      const structure = await providerInstance.getRepositoryStructure(
        owner,
        repo,
        branch
      );

      // Get branches
      const branches = await providerInstance.getBranches(owner, repo);

      // Update last used timestamp
      this._updateProviderLastUsed(user, provider);
      await user.save();

      // Format the data for AI service
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
        files: structure.files || {},
        structure: structure.structure || {},
        branches: branches.map((branch) => ({
          name: branch.name,
          sha: branch.sha,
          protected: branch.protected,
        })),
        metadata: {
          provider,
          branch,
          fetched_at: new Date().toISOString(),
          analysis_timestamp: structure.analysisTimestamp || new Date(),
        },
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
}

module.exports = GitProviderService;
