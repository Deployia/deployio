const GitHubProvider = require("./GitHubProvider");
const GitLabProvider = require("./GitLabProvider");
// const AzureDevOpsProvider = require('./AzureDevOpsProvider'); // Will implement later
// const BitbucketProvider = require('./BitbucketProvider'); // Will implement later

/**
 * Git Provider Factory
 * Creates and manages git provider instances
 */
class GitProviderFactory {
  static SUPPORTED_PROVIDERS = ["github", "gitlab"]; // Will add 'azuredevops', 'bitbucket' later

  /**
   * Create a git provider instance
   * @param {string} provider - Provider name (github, gitlab, azuredevops, bitbucket)
   * @param {string} accessToken - Access token for the provider
   * @returns {BaseGitProvider} Provider instance
   */
  static createProvider(provider, accessToken) {
    if (!provider || !accessToken) {
      throw new Error("Provider and access token are required");
    }

    const providerLower = provider.toLowerCase();

    switch (providerLower) {
      case "github":
        return new GitHubProvider(accessToken);

      case "gitlab":
        return new GitLabProvider(accessToken);

      // case 'azuredevops':
      //   return new AzureDevOpsProvider(accessToken);

      // case 'bitbucket':
      //   return new BitbucketProvider(accessToken);

      default:
        throw new Error(`Unsupported git provider: ${provider}`);
    }
  }

  /**
   * Create provider from user model
   * @param {Object} user - User model instance
   * @param {string} preferredProvider - Preferred provider name (optional)
   * @returns {Object} { provider: BaseGitProvider, providerName: string }
   */
  static createProviderFromUser(user, preferredProvider = null) {
    if (!user.gitProviders) {
      throw new Error("User has no connected git providers");
    }

    // If preferred provider specified and connected, use it
    if (
      preferredProvider &&
      user.gitProviders[preferredProvider]?.isConnected
    ) {
      const accessToken = user.gitProviders[preferredProvider].accessToken;
      if (!accessToken) {
        throw new Error(`No access token found for ${preferredProvider}`);
      }

      return {
        provider: this.createProvider(preferredProvider, accessToken),
        providerName: preferredProvider,
      };
    }

    // Find first connected provider (prioritize GitHub)
    const connectedProviders = this.SUPPORTED_PROVIDERS.filter(
      (providerName) =>
        user.gitProviders[providerName]?.isConnected &&
        user.gitProviders[providerName]?.accessToken
    );

    if (connectedProviders.length === 0) {
      throw new Error("No connected git providers found");
    }

    // Prioritize GitHub, then others
    const selectedProvider = connectedProviders.includes("github")
      ? "github"
      : connectedProviders[0];

    const accessToken = user.gitProviders[selectedProvider].accessToken;

    return {
      provider: this.createProvider(selectedProvider, accessToken),
      providerName: selectedProvider,
    };
  }

  /**
   * Get all connected providers for a user
   * @param {Object} user - User model instance
   * @returns {Array} Array of { provider: BaseGitProvider, providerName: string }
   */
  static getAllProvidersFromUser(user) {
    if (!user.gitProviders) {
      return [];
    }

    const providers = [];

    for (const providerName of this.SUPPORTED_PROVIDERS) {
      const providerData = user.gitProviders[providerName];

      if (providerData?.isConnected && providerData?.accessToken) {
        try {
          providers.push({
            provider: this.createProvider(
              providerName,
              providerData.accessToken
            ),
            providerName,
            connectedAt: providerData.connectedAt,
            lastUsed: providerData.lastUsed,
          });
        } catch (error) {
          console.error(`Error creating provider ${providerName}:`, error);
        }
      }
    }

    return providers;
  }

  /**
   * Check if provider is supported
   * @param {string} provider - Provider name
   * @returns {boolean}
   */
  static isProviderSupported(provider) {
    return this.SUPPORTED_PROVIDERS.includes(provider.toLowerCase());
  }

  /**
   * Get supported providers list
   * @returns {Array} Array of supported provider names
   */
  static getSupportedProviders() {
    return [...this.SUPPORTED_PROVIDERS];
  }

  /**
   * Validate provider credentials
   * @param {string} provider - Provider name
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} User info if valid, throws error if invalid
   */
  static async validateProviderCredentials(provider, accessToken) {
    try {
      const providerInstance = this.createProvider(provider, accessToken);
      const user = await providerInstance.getUser();
      return {
        valid: true,
        user,
        provider,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        provider,
      };
    }
  }

  /**
   * Get provider-specific configuration
   * @param {string} provider - Provider name
   * @returns {Object} Provider configuration
   */
  static getProviderConfig(provider) {
    const configs = {
      github: {
        name: "GitHub",
        baseUrl: "https://github.com",
        apiUrl: "https://api.github.com",
        scopes: ["user:email", "repo", "workflow", "admin:repo_hook"],
        webhookEvents: ["push", "pull_request"],
        supportsPrivateRepos: true,
        supportsOrganizations: true,
        supportsActions: true,
      },
      gitlab: {
        name: "GitLab",
        baseUrl: "https://gitlab.com",
        apiUrl: "https://gitlab.com/api/v4",
        scopes: ["read_user", "read_repository", "api", "read_registry"],
        webhookEvents: ["push_events", "merge_requests_events"],
        supportsPrivateRepos: true,
        supportsOrganizations: true,
        supportsActions: true, // GitLab CI/CD
      },
      azuredevops: {
        name: "Azure DevOps",
        baseUrl: "https://dev.azure.com",
        apiUrl: "https://dev.azure.com",
        scopes: ["vso.code", "vso.identity", "vso.project", "vso.build"],
        webhookEvents: ["git.push", "git.pullrequest.created"],
        supportsPrivateRepos: true,
        supportsOrganizations: true,
        supportsActions: true, // Azure Pipelines
      },
      bitbucket: {
        name: "Bitbucket",
        baseUrl: "https://bitbucket.org",
        apiUrl: "https://api.bitbucket.org/2.0",
        scopes: ["account", "repository", "repository:write", "pullrequest"],
        webhookEvents: ["repo:push", "pullrequest:created"],
        supportsPrivateRepos: true,
        supportsOrganizations: true,
        supportsActions: true, // Bitbucket Pipelines
      },
    };

    return configs[provider.toLowerCase()] || null;
  }
}

module.exports = GitProviderFactory;
