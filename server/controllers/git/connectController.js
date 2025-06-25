// Git Connect Controller
// Handles ONLY Git provider connection and disconnection

const GitProviderService = require("@services/gitProvider/GitProviderService");
const GitProviderFactory = require("@services/gitProviders/ProviderFactory");

/**
 * Get available Git providers
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
 * Get user's connected providers
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
 * Connect provider callback handlers
 */
const connectGitHub = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.authInfo;
    const userInfo = req.user.gitProviders?.github || {};

    await GitProviderService.connectProvider(
      req.user._id,
      "github",
      { accessToken, refreshToken },
      userInfo
    );

    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(`${frontUrl}/git/connect/success?provider=github`);
  } catch (error) {
    console.error("GitHub connection error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/git/connect/error?provider=github&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

const connectGitLab = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.authInfo;
    const userInfo = req.user.gitProviders?.gitlab || {};

    await GitProviderService.connectProvider(
      req.user._id,
      "gitlab",
      { accessToken, refreshToken },
      userInfo
    );

    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(`${frontUrl}/git/connect/success?provider=gitlab`);
  } catch (error) {
    console.error("GitLab connection error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/git/connect/error?provider=gitlab&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

const connectAzureDevOps = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.authInfo;
    const userInfo = req.user.gitProviders?.azuredevops || {};

    await GitProviderService.connectProvider(
      req.user._id,
      "azuredevops",
      { accessToken, refreshToken },
      userInfo
    );

    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(`${frontUrl}/git/connect/success?provider=azuredevops`);
  } catch (error) {
    console.error("Azure DevOps connection error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/git/connect/error?provider=azuredevops&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

/**
 * Disconnect a provider
 */
const disconnectProvider = async (req, res) => {
  try {
    const { provider } = req.params;

    const result = await GitProviderService.disconnectProvider(
      req.user._id,
      provider
    );

    res.json({
      success: true,
      message: `Successfully disconnected ${provider}`,
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

module.exports = {
  // Provider management only
  getProviders,
  getConnectedProviders,
  connectGitHub,
  connectGitLab,
  connectAzureDevOps,
  disconnectProvider,
  testConnection,
};
