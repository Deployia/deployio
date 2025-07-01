// Git Provider Controllers - Repository Access Only
// Handles business logic for Git provider repository operations
// Connection logic is handled by /git/connect controllers

const GitProviderService = require("@services/gitProvider/GitProviderService");
const GitProviderFactory = require("@services/gitProviders/ProviderFactory");

/**
 * Get available Git providers (read-only info)
 */
const getProviders = async (req, res) => {
  try {
    const supportedProviders = GitProviderFactory.getSupportedProviders();
    const providerConfigs = supportedProviders.map((provider) => {
      const config = GitProviderFactory.getProviderConfig(provider);
      return {
        name: provider,
        displayName: config.name,
        baseUrl: config.baseUrl,
        supportsPrivateRepos: config.supportsPrivateRepos,
        supportsOrganizations: config.supportsOrganizations,
        supportsActions: config.supportsActions,
        // Note: Connection URLs are handled by /git/connect
        authUrl: `/api/v1/git/connect/${provider}`,
        scopes: config.scopes,
      };
    });

    res.json({
      success: true,
      data: {
        supportedProviders,
        configs: providerConfigs,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get provider configurations",
      error: error.message,
    });
  }
};

/**
 * Get user's connected providers (read-only status)
 */
const getConnectedProviders = async (req, res) => {
  try {
    const connectedProviders = await GitProviderService.getConnectedProviders(
      req.user._id
    );

    res.json({
      success: true,
      data: connectedProviders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get connected providers",
      error: error.message,
    });
  }
};

/**
 * Test provider connection
 */
const testConnection = async (req, res) => {
  try {
    const { provider } = req.params;

    const result = await GitProviderService.testConnection(
      req.user._id,
      provider
    );

    res.json({
      success: result.success,
      message: result.success
        ? "Connection test successful"
        : "Connection test failed",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Refresh provider token
 */
const refreshToken = async (req, res) => {
  try {
    const { provider } = req.params;

    const result = await GitProviderService.refreshToken(
      req.user._id,
      provider
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update provider information
 */
const updateProviderInfo = async (req, res) => {
  try {
    const { provider } = req.params;

    const result = await GitProviderService.updateProviderInfo(
      req.user._id,
      provider
    );

    res.json({
      success: true,
      message: "Provider information updated",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get provider statistics
 */
const getProviderStats = async (req, res) => {
  try {
    const { provider } = req.params;

    const stats = await GitProviderService.getProviderStats(
      req.user._id,
      provider
    );

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "Provider not connected",
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get repositories
 */
const getRepositories = async (req, res) => {
  try {
    const { provider } = req.params;
    const {
      page = 1,
      per_page = 30,
      sort = "updated",
      type = "all",
      visibility = "all",
      affiliation = "owner,collaborator",
      search,
    } = req.query;

    const options = {
      page: parseInt(page),
      per_page: Math.min(parseInt(per_page), 100),
      sort,
      type,
      visibility,
      affiliation,
      search,
    };

    const result = await GitProviderService.getRepositories(
      req.user._id,
      provider,
      options
    );

    res.json({
      success: true,
      data: {
        provider,
        repositories: result.repositories,
        pagination: {
          page: result.pagination.page,
          totalPages: result.pagination.has_more
            ? result.pagination.page + 1
            : result.pagination.page,
          totalCount: result.pagination.total_count,
          hasMore: result.pagination.has_more,
          perPage: result.pagination.per_page,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get specific repository details
 */
const getRepository = async (req, res) => {
  try {
    const { provider, owner, repo } = req.params;
    const repoFullName = `${owner}/${repo}`;

    const repository = await GitProviderService.getRepository(
      req.user._id,
      provider,
      repoFullName
    );

    res.json({
      success: true,
      data: repository,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get repository branches
 */
const getBranches = async (req, res) => {
  try {
    const { provider, owner, repo } = req.params;
    const repoFullName = `${owner}/${repo}`;

    const branches = await GitProviderService.getBranches(
      req.user._id,
      provider,
      repoFullName
    );

    res.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get repository data for analysis
 */
const getRepositoryData = async (req, res) => {
  try {
    const { provider, owner, repo } = req.params;
    const { branch = "main" } = req.body;
    const repoFullName = `${owner}/${repo}`;

    // Get repository data from provider
    const repositoryData = await GitProviderService.getRepositoryData(
      req.user._id,
      provider,
      repoFullName,
      branch
    );

    res.json({
      success: true,
      data: repositoryData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  // Provider information (read-only)
  getProviders,
  getConnectedProviders,

  // Provider management
  testConnection,
  refreshToken,
  updateProviderInfo,
  getProviderStats,

  // Repository operations
  getRepositories,
  getRepository,
  getBranches,
  getRepositoryData,
};
