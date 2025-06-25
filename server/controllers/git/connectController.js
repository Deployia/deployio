// Git Connect Controller
// Handles ONLY Git provider connection and disconnection

const GitProviderService = require("@services/gitProvider/GitProviderService");
const GitProviderFactory = require("@services/gitProviders/ProviderFactory");
const crypto = require("crypto");

/**
 * Generate secure OAuth state parameter
 * @param {string} userId - User ID
 * @param {string} provider - Git provider name
 * @returns {string} Base64URL encoded state
 */
const generateOAuthState = (userId, provider) => {
  const stateData = {
    userId: userId.toString(),
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
    provider,
  };
  return Buffer.from(JSON.stringify(stateData)).toString("base64url");
};

/**
 * Validate OAuth state parameter
 * @param {string} stateString - Base64URL encoded state
 * @returns {Promise<{user: Object, provider: string, nonce: string}>}
 */
const validateOAuthState = async (stateString) => {
  try {
    if (!stateString) {
      throw new Error("OAuth state parameter is required");
    }

    const stateData = JSON.parse(
      Buffer.from(stateString, "base64url").toString()
    );

    // Validate required fields
    if (
      !stateData.userId ||
      !stateData.timestamp ||
      !stateData.nonce ||
      !stateData.provider
    ) {
      throw new Error("Invalid OAuth state format");
    }

    // Validate timestamp (10 minutes max)
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - stateData.timestamp > maxAge) {
      throw new Error("OAuth state expired. Please try connecting again.");
    }

    // Validate user exists
    const User = require("@models/User");
    const user = await User.findById(stateData.userId);
    if (!user) {
      throw new Error("User not found. Please log in and try again.");
    }

    return {
      user,
      provider: stateData.provider,
      nonce: stateData.nonce,
    };
  } catch (error) {
    console.error("OAuth state validation error:", error);
    throw new Error(`Invalid OAuth state: ${error.message}`);
  }
};

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
 * Initiate provider connection
 */
const initiateConnection = (provider) => {
  return (req, res, next) => {
    try {
      // Generate secure state parameter
      const state = generateOAuthState(req.user._id, provider);

      // Store state in session for additional validation if needed
      // (optional - the state parameter itself is sufficient for security)
      req.session = req.session || {};
      req.session.oauthState = state;

      // Set state in passport options
      req.authInfo = { state };

      next();
    } catch (error) {
      console.error(`${provider} connection initiation error:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to initiate ${provider} connection`,
        error: error.message,
      });
    }
  };
};

/**
 * Connect provider callback handlers
 */
const connectGitHub = async (req, res) => {
  try {
    const { accessToken, refreshToken, state } = req.authInfo;
    const githubProfile = req.user; // This is the GitHub profile from Passport

    // Validate OAuth state
    const { user, provider } = await validateOAuthState(state);

    // Verify provider matches
    if (provider !== "github") {
      throw new Error("Provider mismatch in OAuth state");
    }

    // Extract user info from GitHub profile
    const userInfo = {
      id: githubProfile.id,
      username: githubProfile.username,
      email: githubProfile.emails?.[0]?.value,
      name: githubProfile.displayName || githubProfile.username,
      avatar: githubProfile.photos?.[0]?.value,
    };

    await GitProviderService.connectProvider(
      user._id,
      "github",
      { accessToken, refreshToken },
      userInfo
    );

    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=github&status=success`
    );
  } catch (error) {
    console.error("GitHub connection error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=github&status=error&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

const connectGitLab = async (req, res) => {
  try {
    const { accessToken, refreshToken, state } = req.authInfo;
    const gitlabProfile = req.user; // This is the GitLab profile from Passport

    // Validate OAuth state
    const { user, provider } = await validateOAuthState(state);

    // Verify provider matches
    if (provider !== "gitlab") {
      throw new Error("Provider mismatch in OAuth state");
    }

    // Extract user info from GitLab profile
    const userInfo = {
      id: gitlabProfile.id,
      username: gitlabProfile.username,
      email: gitlabProfile.emails?.[0]?.value || gitlabProfile.email,
      name:
        gitlabProfile.displayName ||
        gitlabProfile.name ||
        gitlabProfile.username,
      avatar: gitlabProfile.photos?.[0]?.value || gitlabProfile.avatar_url,
    };

    await GitProviderService.connectProvider(
      user._id,
      "gitlab",
      { accessToken, refreshToken },
      userInfo
    );

    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=gitlab&status=success`
    );
  } catch (error) {
    console.error("GitLab connection error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=gitlab&status=error&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

const connectAzureDevOps = async (req, res) => {
  try {
    const { accessToken, refreshToken, state } = req.authInfo;
    const azureProfile = req.user; // This is the Azure DevOps profile from Passport

    // Validate OAuth state
    const { user, provider } = await validateOAuthState(state);

    // Verify provider matches
    if (provider !== "azuredevops") {
      throw new Error("Provider mismatch in OAuth state");
    }

    // Extract user info from Azure DevOps profile
    const userInfo = {
      id: azureProfile.id,
      username: azureProfile.username || azureProfile.displayName,
      email: azureProfile.emails?.[0]?.value || azureProfile.email,
      name: azureProfile.displayName || azureProfile.username,
      avatar: azureProfile.photos?.[0]?.value || azureProfile.avatar,
    };

    await GitProviderService.connectProvider(
      user._id,
      "azuredevops",
      { accessToken, refreshToken },
      userInfo
    );

    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=azuredevops&status=success`
    );
  } catch (error) {
    console.error("Azure DevOps connection error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=azuredevops&status=error&error=${encodeURIComponent(
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
  // Provider management
  getProviders,
  getConnectedProviders,
  // Connection initiation
  initiateConnection,
  // Connection callbacks
  connectGitHub,
  connectGitLab,
  connectAzureDevOps,
  // Management
  disconnectProvider,
  testConnection,
  // Utilities
  generateOAuthState,
  validateOAuthState,
};
