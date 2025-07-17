const User = require("@models/User");
const logger = require("@config/logger");
const AuthActivityLogger = require("./authActivityLogger");

/**
 * OAuth Service - Handles OAuth provider operations
 *
 * Responsibilities:
 * - OAuth provider linking/unlinking
 * - OAuth callback handling
 * - Provider token management
 * - OAuth user data synchronization
 */

/**
 * Get linked OAuth providers for a user
 * @param {String} userId - User ID
 * @returns {Object} Linked providers information
 */
const getLinkedProviders = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      "githubId googleId gitlabId bitbucketId azureDevOpsId gitProviders"
    );

    if (!user) {
      throw new Error("User not found");
    }

    const linkedProviders = {
      github: {
        linked: !!user.githubId,
        username: user.gitProviders?.github?.username || null,
        email: user.gitProviders?.github?.email || null,
      },
      google: {
        linked: !!user.googleId,
        email: user.gitProviders?.google?.email || null,
      },
      gitlab: {
        linked: !!user.gitlabId,
        username: user.gitProviders?.gitlab?.username || null,
      },
      bitbucket: {
        linked: !!user.bitbucketId,
        username: user.gitProviders?.bitbucket?.username || null,
      },
      azureDevOps: {
        linked: !!user.azureDevOpsId,
        username: user.gitProviders?.azureDevOps?.username || null,
      },
    };

    return linkedProviders;
  } catch (error) {
    logger.error("Error getting linked providers:", error);
    throw error;
  }
};

/**
 * Link OAuth provider to existing user account
 * @param {String} userId - User ID
 * @param {String} provider - Provider name (github, google, etc.)
 * @param {Object} providerData - Provider-specific data
 * @returns {String} Success message
 */
const linkProvider = async (userId, provider, providerData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if provider is already linked to another account
    const existingUser = await checkProviderLinked(provider, providerData.id);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error(
        `This ${provider} account is already linked to another user`
      );
    }

    // Update user with provider information
    const updateData = {};

    switch (provider.toLowerCase()) {
      case "github":
        updateData.githubId = providerData.id;
        updateData["gitProviders.github"] = {
          id: providerData.id,
          username: providerData.username,
          email: providerData.email,
          avatarUrl: providerData.avatarUrl,
          profileUrl: providerData.profileUrl,
          accessToken: providerData.accessToken,
          refreshToken: providerData.refreshToken,
          isConnected: true,
          connectedAt: new Date(),
        };
        break;

      case "google":
        updateData.googleId = providerData.id;
        updateData["gitProviders.google"] = {
          id: providerData.id,
          email: providerData.email,
          name: providerData.name,
          picture: providerData.picture,
          isConnected: true,
          connectedAt: new Date(),
        };
        break;

      case "gitlab":
        updateData.gitlabId = providerData.id;
        updateData["gitProviders.gitlab"] = {
          id: providerData.id,
          username: providerData.username,
          email: providerData.email,
          avatarUrl: providerData.avatarUrl,
          accessToken: providerData.accessToken,
          refreshToken: providerData.refreshToken,
          isConnected: true,
          connectedAt: new Date(),
        };
        break;

      case "bitbucket":
        updateData.bitbucketId = providerData.id;
        updateData["gitProviders.bitbucket"] = {
          id: providerData.id,
          username: providerData.username,
          email: providerData.email,
          avatarUrl: providerData.avatarUrl,
          accessToken: providerData.accessToken,
          refreshToken: providerData.refreshToken,
          isConnected: true,
          connectedAt: new Date(),
        };
        break;

      case "azuredevops":
        updateData.azureDevOpsId = providerData.id;
        updateData["gitProviders.azureDevOps"] = {
          id: providerData.id,
          username: providerData.username,
          email: providerData.email,
          accessToken: providerData.accessToken,
          refreshToken: providerData.refreshToken,
          isConnected: true,
          connectedAt: new Date(),
        };
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    await User.findByIdAndUpdate(userId, updateData);

    // Log provider linking activity
    try {
      await AuthActivityLogger.logProviderLinked(userId, {
        provider,
        providerId: providerData.id,
        providerUsername: providerData.username,
      });
    } catch (activityError) {
      logger.warn("Failed to log provider linking activity", {
        error: activityError.message,
        userId,
        provider,
      });
    }

    logger.info(`${provider} linked to user: ${userId}`);
    return `${provider} account linked successfully`;
  } catch (error) {
    logger.error(`Error linking ${provider} provider:`, error);
    throw error;
  }
};

/**
 * Unlink OAuth provider from user account
 * @param {String} userId - User ID
 * @param {String} provider - Provider name
 * @returns {String} Success message
 */
const unlinkProvider = async (userId, provider) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has password or other auth methods
    const hasPassword = !!user.password;
    const linkedProviders = await getLinkedProviders(userId);
    const totalLinkedProviders = Object.values(linkedProviders).filter(
      (p) => p.linked
    ).length;

    // Prevent unlinking if it's the only auth method
    if (!hasPassword && totalLinkedProviders <= 1) {
      throw new Error(
        "Cannot unlink the only authentication method. Please set a password first."
      );
    }

    // Update user to remove provider information
    const updateData = {};

    switch (provider.toLowerCase()) {
      case "github":
        updateData.githubId = undefined;
        updateData["gitProviders.github"] = {
          isConnected: false,
          disconnectedAt: new Date(),
        };
        break;

      case "google":
        updateData.googleId = undefined;
        updateData["gitProviders.google"] = {
          isConnected: false,
          disconnectedAt: new Date(),
        };
        break;

      case "gitlab":
        updateData.gitlabId = undefined;
        updateData["gitProviders.gitlab"] = {
          isConnected: false,
          disconnectedAt: new Date(),
        };
        break;

      case "bitbucket":
        updateData.bitbucketId = undefined;
        updateData["gitProviders.bitbucket"] = {
          isConnected: false,
          disconnectedAt: new Date(),
        };
        break;

      case "azuredevops":
        updateData.azureDevOpsId = undefined;
        updateData["gitProviders.azureDevOps"] = {
          isConnected: false,
          disconnectedAt: new Date(),
        };
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    await User.findByIdAndUpdate(userId, { $unset: updateData });

    // Log provider unlinking activity
    try {
      await AuthActivityLogger.logProviderUnlinked(userId, {
        provider,
      });
    } catch (activityError) {
      logger.warn("Failed to log provider unlinking activity", {
        error: activityError.message,
        userId,
        provider,
      });
    }

    logger.info(`${provider} unlinked from user: ${userId}`);
    return `${provider} account unlinked successfully`;
  } catch (error) {
    logger.error(`Error unlinking ${provider} provider:`, error);
    throw error;
  }
};

/**
 * Complete OAuth login flow
 * @param {String} provider - Provider name
 * @param {Object} userOrProfile - User object (from passport) or OAuth profile data
 * @param {Object} tokens - OAuth tokens
 * @param {Object} loginInfo - Login information
 * @returns {Object} User and authentication tokens
 */
const completeOAuthLogin = async (
  provider,
  userOrProfile,
  tokens,
  loginInfo = {}
) => {
  try {
    let user;

    // Check if userOrProfile is already a User object (from passport strategy)
    if (userOrProfile._id) {
      user = userOrProfile;
    } else {
      // Original flow for profile data
      user = await findUserByProvider(provider, userOrProfile.id);

      // If not found by provider ID, try to find by email for account linking
      if (!user && userOrProfile.emails && userOrProfile.emails[0]) {
        user = await User.findOne({ email: userOrProfile.emails[0].value });
        if (user) {
          // Link the provider to existing account
          await linkProvider(user._id, provider, {
            id: userOrProfile.id,
            username: userOrProfile.username,
            email: userOrProfile.emails[0].value,
            ...tokens,
          });
        }
      }
    }

    if (!user) {
      throw new Error(
        "User not found. Please register first or link your account."
      );
    }

    // Update user's last login and provider data (only if we have profile data)
    if (!userOrProfile._id && userOrProfile.id) {
      await updateUserProviderData(user, provider, userOrProfile, tokens);
    } else {
      // Update last login for existing user
      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date(),
        isVerified: true,
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user._id,
        message: "Please provide your 2FA code to complete login",
      };
    }

    // Generate authentication tokens
    const {
      generateToken,
      generateRefreshToken,
    } = require("./coreAuthService");
    const { storeRefreshToken } = require("./sessionService");

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await storeRefreshToken(user._id, refreshToken);

    // Log successful OAuth login
    const { logSuccessfulLogin } = require("./securityService");
    await logSuccessfulLogin(user._id, { ...loginInfo, provider });

    // Log OAuth login activity
    await AuthActivityLogger.logLogin(
      user._id,
      { ...loginInfo, provider },
      provider
    );

    logger.info(`OAuth login completed for user: ${user._id} via ${provider}`);

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        role: user.role,
      },
      token,
      refreshToken,
    };
  } catch (error) {
    logger.error(`Error completing OAuth login for ${provider}:`, error);
    throw error;
  }
};

/**
 * Helper function to find user by provider
 * @param {String} provider - Provider name
 * @param {String} providerId - Provider ID
 * @returns {Object|null} User object or null
 */
const findUserByProvider = async (provider, providerId) => {
  const query = {};

  if (typeof provider !== "string" || !provider) {
    // Optionally log the error for debugging
    logger.error("Invalid provider in findUserByProvider", { provider });
    return null;
  }

  switch (provider.toLowerCase()) {
    case "github":
      query.githubId = providerId;
      break;
    case "google":
      query.googleId = providerId;
      break;
    case "gitlab":
      query.gitlabId = providerId;
      break;
    case "bitbucket":
      query.bitbucketId = providerId;
      break;
    case "azuredevops":
      query.azureDevOpsId = providerId;
      break;
    default:
      return null;
  }

  return await User.findOne(query);
};

/**
 * Helper function to check if provider is already linked
 * @param {String} provider - Provider name
 * @param {String} providerId - Provider ID
 * @returns {Object|null} User object or null
 */
const checkProviderLinked = async (provider, providerId) => {
  return await findUserByProvider(provider, providerId);
};

/**
 * Helper function to update user provider data
 * @param {Object} user - User object
 * @param {String} provider - Provider name
 * @param {Object} profile - OAuth profile
 * @param {Object} tokens - OAuth tokens
 */
const updateUserProviderData = async (user, provider, profile, tokens) => {
  const updateData = {
    lastLogin: new Date(),
    isVerified: true, // OAuth users are auto-verified
  };

  // Update email if changed and present
  if (
    profile.emails &&
    profile.emails[0] &&
    user.email !== profile.emails[0].value
  ) {
    updateData.email = profile.emails[0].value;
  }

  // Update profile image if changed and present
  if (
    profile.photos &&
    profile.photos[0] &&
    user.profileImage !== profile.photos[0].value
  ) {
    updateData.profileImage = profile.photos[0].value;
  }

  // Update provider-specific data
  switch (provider.toLowerCase()) {
    case "github":
      updateData["gitProviders.github.accessToken"] = tokens.accessToken;
      updateData["gitProviders.github.refreshToken"] = tokens.refreshToken;
      updateData["gitProviders.github.lastSync"] = new Date();
      break;
    case "google":
      updateData["gitProviders.google.lastSync"] = new Date();
      break;
    // Add other providers as needed
  }

  await User.findByIdAndUpdate(user._id, updateData);
};

/**
 * Refresh OAuth provider tokens
 * @param {String} userId - User ID
 * @param {String} provider - Provider name
 * @returns {Object} Updated token information
 */
const refreshProviderTokens = async (userId, provider) => {
  try {
    // This would implement token refresh logic for each provider
    // For now, return a placeholder
    throw new Error("Token refresh not implemented yet");
  } catch (error) {
    logger.error(`Error refreshing ${provider} tokens:`, error);
    throw error;
  }
};

module.exports = {
  getLinkedProviders,
  linkProvider,
  unlinkProvider,
  completeOAuthLogin,
  findUserByProvider,
  checkProviderLinked,
  updateUserProviderData,
  refreshProviderTokens,
};
