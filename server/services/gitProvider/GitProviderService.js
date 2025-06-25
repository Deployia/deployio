// Git Provider Service - Database Operations
// Handles all database operations for Git provider connections

const User = require("@models/User");
const GitProviderFactory = require("@services/gitProviders/ProviderFactory");

class GitProviderService {
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
          hasValidToken: user.hasValidGitProviderToken(providerName),
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

      // Store provider connection
      await user.setGitProviderToken(
        provider,
        tokenData.accessToken,
        tokenData.refreshToken
      );
      await user.updateGitProviderInfo(provider, userInfo);

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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.hasValidGitProviderToken(provider)) {
        throw new Error("No valid token for provider");
      }

      const providerInstance = GitProviderFactory.createProvider(provider);
      const token = await user.getGitProviderToken(provider);

      // Test connection by fetching user info
      const userInfo = await providerInstance.getCurrentUser(token);

      // Update last used timestamp
      await user.updateLastUsed(provider);

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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.hasValidGitProviderToken(provider)) {
        throw new Error("No valid token for provider");
      }

      const providerInstance = GitProviderFactory.createProvider(provider);
      const token = await user.getGitProviderToken(provider);

      const repositories = await providerInstance.getRepositories(
        token,
        options
      );

      // Update last used timestamp
      await user.updateLastUsed(provider);

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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.hasValidGitProviderToken(provider)) {
        throw new Error("No valid token for provider");
      }

      const providerInstance = GitProviderFactory.createProvider(provider);
      const token = await user.getGitProviderToken(provider);

      const repository = await providerInstance.getRepository(
        token,
        repoFullName
      );

      // Update last used timestamp
      await user.updateLastUsed(provider);

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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.hasValidGitProviderToken(provider)) {
        throw new Error("No valid token for provider");
      }

      const providerInstance = GitProviderFactory.createProvider(provider);
      const token = await user.getGitProviderToken(provider);

      const branches = await providerInstance.getBranches(token, repoFullName);

      // Update last used timestamp
      await user.updateLastUsed(provider);

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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.hasValidGitProviderToken(provider)) {
        throw new Error("No valid token for provider");
      }

      const providerInstance = GitProviderFactory.createProvider(provider);
      const token = await user.getGitProviderToken(provider);

      const analysis = await providerInstance.analyzeRepository(
        token,
        repoFullName,
        branch
      );

      // Update last used timestamp
      await user.updateLastUsed(provider);

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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const refreshToken = await user.getGitProviderRefreshToken(provider);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const providerInstance = GitProviderFactory.createProvider(provider);
      const newTokens = await providerInstance.refreshToken(refreshToken);

      // Update stored tokens
      await user.setGitProviderToken(
        provider,
        newTokens.accessToken,
        newTokens.refreshToken
      );

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
        hasValidToken: user.hasValidGitProviderToken(provider),
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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (!user.hasValidGitProviderToken(provider)) {
        throw new Error("No valid token for provider");
      }

      const providerInstance = GitProviderFactory.createProvider(provider);
      const token = await user.getGitProviderToken(provider);

      const userInfo = await providerInstance.getCurrentUser(token);
      await user.updateGitProviderInfo(provider, userInfo);

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
}

module.exports = GitProviderService;
