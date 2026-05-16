const GitHubProvider = require("./GitHubProvider");
const GitLabProvider = require("./GitLabProvider");
const AzureDevOpsProvider = require("./AzureDevOpsProvider");
const {
  GITHUB_CONNECT_SCOPES,
  GITLAB_CONNECT_SCOPES,
} = require("../../constants/gitOAuthScopes");
const {
  normalizeGitProviderKey,
  toApiProviderId,
} = require("../../utils/gitProviderKeys");
const { getDecryptedAccessToken } = require("../../utils/gitProviderTokens");

/**
 * Git Provider Factory
 * Creates and manages git provider instances
 */
class GitProviderFactory {
  static SUPPORTED_PROVIDERS = ["github", "gitlab", "azuredevops"];
  static CANONICAL_PROVIDERS = ["github", "gitlab", "azureDevOps"];

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

    const apiId = toApiProviderId(provider) || String(provider).toLowerCase();

    switch (apiId) {
      case "github":
        return new GitHubProvider(accessToken);

      case "gitlab":
        return new GitLabProvider(accessToken);

      case "azuredevops":
        return new AzureDevOpsProvider(accessToken);

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
    const preferredCanonical = preferredProvider
      ? normalizeGitProviderKey(preferredProvider)
      : null;

    if (
      preferredCanonical &&
      user.gitProviders[preferredCanonical]?.isConnected
    ) {
      const accessToken = getDecryptedAccessToken(
        user.gitProviders[preferredCanonical],
      );
      if (!accessToken) {
        throw new Error(`No access token found for ${preferredProvider}`);
      }

      return {
        provider: this.createProvider(preferredCanonical, accessToken),
        providerName: toApiProviderId(preferredCanonical),
      };
    }

    const connectedCanonical = this.CANONICAL_PROVIDERS.filter(
      (canonical) =>
        user.gitProviders[canonical]?.isConnected &&
        user.gitProviders[canonical]?.accessToken,
    );

    if (connectedCanonical.length === 0) {
      throw new Error("No connected git providers found");
    }

    const selectedCanonical = connectedCanonical.includes("github")
      ? "github"
      : connectedCanonical[0];

    const accessToken = getDecryptedAccessToken(
      user.gitProviders[selectedCanonical],
    );

    return {
      provider: this.createProvider(selectedCanonical, accessToken),
      providerName: toApiProviderId(selectedCanonical),
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

    for (const canonical of this.CANONICAL_PROVIDERS) {
      const providerData = user.gitProviders[canonical];

      if (providerData?.isConnected && providerData?.accessToken) {
        try {
          const accessToken = getDecryptedAccessToken(providerData);
          providers.push({
            provider: this.createProvider(canonical, accessToken),
            providerName: toApiProviderId(canonical),
            connectedAt: providerData.connectedAt,
            lastUsed: providerData.lastUsed,
          });
        } catch (error) {
          console.error(`Error creating provider ${canonical}:`, error);
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
    return Boolean(normalizeGitProviderKey(provider));
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
        scopes: GITHUB_CONNECT_SCOPES,
        webhookEvents: ["push", "pull_request"],
        supportsPrivateRepos: true,
        supportsOrganizations: true,
        supportsActions: true,
      },
      gitlab: {
        name: "GitLab",
        baseUrl: "https://gitlab.com",
        apiUrl: "https://gitlab.com/api/v4",
        scopes: GITLAB_CONNECT_SCOPES,
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
