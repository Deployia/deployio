import api, { analysisApi } from "@/utils/api.js";

/**
 * Git Provider Service
 * Handles all API calls for Git provider integration
 */
class GitProviderService {
  /**
   * CONNECTION LAYER - /api/v1/git/connect/*
   * OAuth flows and provider connection/disconnection
   */

  // Get available providers
  async getAvailableProviders() {
    const response = await api.get("/git/connect/providers");
    return response.data;
  }

  // Get connected providers status
  async getConnectedProviders() {
    const response = await api.get("/git/connect/connected");
    return response.data;
  }

  // Initiate OAuth connection (redirects to provider)
  initiateConnection(provider) {
    const connectUrl = `${api.defaults.baseURL}/git/connect/${provider}`;
    window.location.href = connectUrl;
  }

  // Disconnect provider
  async disconnectProvider(provider) {
    const response = await api.delete(`/git/connect/${provider}`);
    return response.data;
  }

  /**
   * REPOSITORY ACCESS LAYER - /api/v1/users/git-providers/*
   * Repository browsing, management, and operations
   */

  // Get provider configurations
  async getProviderConfigurations() {
    const response = await api.get("/users/git-providers/");
    return response.data;
  }

  // Get detailed connection status
  async getDetailedConnectionStatus() {
    const response = await api.get("/users/git-providers/connected");
    return response.data;
  }

  // Test connection to provider
  async testConnection(provider) {
    const response = await api.get(`/users/git-providers/${provider}/test`);
    return response.data;
  }

  // Refresh provider token
  async refreshToken(provider) {
    const response = await api.post(`/users/git-providers/${provider}/refresh`);
    return response.data;
  }

  // Update provider info
  async updateProviderInfo(provider, info) {
    const response = await api.patch(
      `/users/git-providers/${provider}/info`,
      info
    );
    return response.data;
  }

  // Get provider statistics
  async getProviderStats(provider) {
    const response = await api.get(`/users/git-providers/${provider}/stats`);
    return response.data;
  }

  /**
   * REPOSITORY OPERATIONS
   */

  // Browse repositories
  async getRepositories(provider, options = {}) {
    const { page = 1, limit = 30, sort = "updated", search = "" } = options;
    const params = { page, limit, sort };
    if (search) params.search = search;

    const response = await api.get(
      `/users/git-providers/${provider}/repositories`,
      { params }
    );
    return response.data;
  }

  // Get repository details
  async getRepositoryDetails(provider, owner, repo) {
    const response = await api.get(
      `/users/git-providers/${provider}/repositories/${owner}/${repo}`
    );
    return response.data;
  }

  // Get repository branches
  async getRepositoryBranches(provider, owner, repo) {
    const response = await api.get(
      `/users/git-providers/${provider}/repositories/${owner}/${repo}/branches`
    );
    return response.data;
  }

  // AI analyze repository (uses longer timeout)
  async analyzeRepository(provider, owner, repo) {
    const response = await analysisApi.post(
      `/users/git-providers/${provider}/repositories/${owner}/${repo}/analyze`
    );
    return response.data;
  }

  /**
   * UTILITY METHODS
   */

  // Get provider icon component name
  getProviderIcon(provider) {
    const iconMap = {
      github: "FaGithub",
      gitlab: "FaGitlab",
      bitbucket: "FaBitbucket",
      azuredevops: "FaMicrosoft",
    };
    return iconMap[provider] || "FaCode";
  }

  // Get provider display name
  getProviderDisplayName(provider) {
    const nameMap = {
      github: "GitHub",
      gitlab: "GitLab",
      bitbucket: "Bitbucket",
      azuredevops: "Azure DevOps",
    };
    return nameMap[provider] || provider;
  }

  // Get provider description
  getProviderDescription(provider) {
    const descMap = {
      github: "Connect your GitHub repositories for automated deployments",
      gitlab: "Integrate with GitLab for CI/CD pipelines",
      bitbucket: "Connect Bitbucket repositories and pipelines",
      azuredevops: "Integrate with Azure DevOps repositories and pipelines",
    };
    return descMap[provider] || "Git repository integration";
  }

  // Check if provider supports specific features
  getProviderFeatures(provider) {
    const featureMap = {
      github: [
        "Auto-deploy on push",
        "Pull request previews",
        "Branch protection",
        "Repository analysis",
      ],
      gitlab: [
        "CI/CD integration",
        "Merge request builds",
        "Container registry",
        "Repository analysis",
      ],
      bitbucket: [
        "Repository sync",
        "Pipeline triggers",
        "Branch workflows",
        "Repository analysis",
      ],
      azuredevops: [
        "Repository integration",
        "Pipeline integration",
        "Work item linking",
        "Repository analysis",
      ],
    };
    return featureMap[provider] || ["Repository integration"];
  }
}

export default new GitProviderService();
