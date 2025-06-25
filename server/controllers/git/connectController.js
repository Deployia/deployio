// Git Connect Controller - Clean State-Based OAuth Implementation
// Handles ONLY Git provider connection and disconnection

const GitProviderService = require("@services/gitProvider/GitProviderService");
const GitProviderFactory = require("@services/gitProviders/ProviderFactory");
const crypto = require("crypto");
const logger = require("@config/logger");

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
    nonce: crypto.randomBytes(16).toString('hex'),
    provider
  };
  return Buffer.from(JSON.stringify(stateData)).toString('base64url');
};

/**
 * Validate OAuth state parameter
 * @param {string} stateString - Base64URL encoded state
 * @returns {Promise<{user: Object, provider: string, nonce: string}>}
 */
const validateOAuthState = async (stateString) => {
  try {
    if (!stateString) {
      throw new Error('OAuth state parameter is required');
    }

    const stateData = JSON.parse(Buffer.from(stateString, 'base64url').toString());
    
    // Validate required fields
    if (!stateData.userId || !stateData.timestamp || !stateData.nonce || !stateData.provider) {
      throw new Error('Invalid OAuth state format');
    }
    
    // Validate timestamp (10 minutes max)
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - stateData.timestamp > maxAge) {
      throw new Error('OAuth state expired. Please try connecting again.');
    }
    
    // Validate user exists
    const User = require("@models/User");
    const user = await User.findById(stateData.userId);
    if (!user) {
      throw new Error('User not found. Please log in and try again.');
    }
    
    return { 
      user, 
      provider: stateData.provider, 
      nonce: stateData.nonce 
    };
  } catch (error) {
    logger.error('OAuth state validation error:', error);
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
    logger.error('Get providers error:', error);
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
    logger.error('Get connected providers error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get connected providers",
      error: error.message,
    });
  }
};

/**
 * Initiate OAuth connection for a provider
 */
const initiateConnection = (provider) => {
  return (req, res, next) => {
    try {
      // Generate secure state parameter
      const state = generateOAuthState(req.user._id, provider);
      
      // Pass state to passport
      req.oauthState = state;
      
      logger.info(`Initiating OAuth connection for ${provider}`, {
        userId: req.user._id,
        provider
      });
      
      next();
    } catch (error) {
      logger.error(`${provider} connection initiation error:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to initiate ${provider} connection`,
        error: error.message,
      });
    }
  };
};

/**
 * GitHub OAuth callback handler
 */
const connectGitHub = async (req, res) => {
  try {
    const { accessToken, refreshToken, state } = req.authInfo;
    const githubProfile = req.user; // This is the GitHub profile from Passport

    logger.info('GitHub OAuth callback received', {
      profileId: githubProfile.id,
      hasState: !!state
    });

    // Validate OAuth state
    const { user, provider } = await validateOAuthState(state);
    
    // Verify provider matches
    if (provider !== 'github') {
      throw new Error('Provider mismatch in OAuth state');
    }

    // Extract user info from GitHub profile
    const userInfo = {
      id: githubProfile.id,
      username: githubProfile.username,
      email: githubProfile.emails?.[0]?.value,
      name: githubProfile.displayName || githubProfile.username,
      avatar: githubProfile.photos?.[0]?.value,
    };

    // Connect the provider
    await GitProviderService.connectProvider(
      user._id,
      "github",
      { accessToken, refreshToken },
      userInfo
    );

    logger.info('GitHub provider connected successfully', {
      userId: user._id,
      githubUsername: userInfo.username
    });

    // Redirect to frontend with success
    const frontUrl = process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=github&status=success`
    );
  } catch (error) {
    logger.error("GitHub connection error:", error);
    
    const frontUrl = process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=github&status=error&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

/**
 * GitLab OAuth callback handler
 */
const connectGitLab = async (req, res) => {
  try {
    const { accessToken, refreshToken, state } = req.authInfo;
    const gitlabProfile = req.user;

    logger.info('GitLab OAuth callback received', {
      profileId: gitlabProfile.id,
      hasState: !!state
    });

    // Validate OAuth state
    const { user, provider } = await validateOAuthState(state);
    
    // Verify provider matches
    if (provider !== 'gitlab') {
      throw new Error('Provider mismatch in OAuth state');
    }

    // Extract user info from GitLab profile
    const userInfo = {
      id: gitlabProfile.id,
      username: gitlabProfile.username,
      email: gitlabProfile.emails?.[0]?.value,
      name: gitlabProfile.displayName || gitlabProfile.username,
      avatar: gitlabProfile.photos?.[0]?.value,
    };

    // Connect the provider
    await GitProviderService.connectProvider(
      user._id,
      "gitlab",
      { accessToken, refreshToken },
      userInfo
    );

    logger.info('GitLab provider connected successfully', {
      userId: user._id,
      gitlabUsername: userInfo.username
    });

    const frontUrl = process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=gitlab&status=success`
    );
  } catch (error) {
    logger.error("GitLab connection error:", error);
    
    const frontUrl = process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=gitlab&status=error&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

/**
 * Azure DevOps OAuth callback handler
 */
const connectAzureDevOps = async (req, res) => {
  try {
    const { accessToken, refreshToken, state } = req.authInfo;
    const azureProfile = req.user;

    logger.info('Azure DevOps OAuth callback received', {
      profileId: azureProfile.id,
      hasState: !!state
    });

    // Validate OAuth state
    const { user, provider } = await validateOAuthState(state);
    
    // Verify provider matches
    if (provider !== 'azuredevops') {
      throw new Error('Provider mismatch in OAuth state');
    }

    // Extract user info from Azure profile
    const userInfo = {
      id: azureProfile.id,
      username: azureProfile.username || azureProfile.displayName,
      email: azureProfile.emails?.[0]?.value,
      name: azureProfile.displayName,
      avatar: azureProfile.photos?.[0]?.value,
    };

    // Connect the provider
    await GitProviderService.connectProvider(
      user._id,
      "azuredevops",
      { accessToken, refreshToken },
      userInfo
    );

    logger.info('Azure DevOps provider connected successfully', {
      userId: user._id,
      azureUsername: userInfo.username
    });

    const frontUrl = process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL_PROD;

    res.redirect(
      `${frontUrl}/dashboard/integrations?connected=azuredevops&status=success`
    );
  } catch (error) {
    logger.error("Azure DevOps connection error:", error);
    
    const frontUrl = process.env.NODE_ENV === "development"
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

    logger.info('Disconnecting provider', {
      userId: req.user._id,
      provider
    });

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
    logger.error('Disconnect provider error:', error);
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
    logger.error('Test connection error:', error);
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
  // Utilities (for testing)
  generateOAuthState,
  validateOAuthState,
};
