/**
 * Calculate security score based on user profile and security features
 * @param {Object} params - Parameters for security score calculation
 * @param {Object} params.authUser - User object from auth state
 * @param {boolean} params.twoFactorEnabled - 2FA status from twoFactor state
 * @param {Array} params.apiKeys - User's API keys
 * @param {Object} params.linkedProviders - OAuth providers
 * @returns {number} Security score (0-100)
 */
export const calculateSecurityScore = ({
  authUser,
  twoFactorEnabled,
  apiKeys,
  linkedProviders,
}) => {
  let score = 0;

  // Two-Factor Authentication (40 points)
  if (authUser?.twoFactorEnabled || twoFactorEnabled) {
    score += 40;
  }

  // Email verification (20 points)
  if (authUser?.email && authUser.emailVerified) {
    score += 20;
  }

  // Recent password change within 90 days (20 points)
  if (
    authUser?.lastPasswordChange &&
    new Date() - new Date(authUser.lastPasswordChange) <
      90 * 24 * 60 * 60 * 1000
  ) {
    score += 20;
  }

  // API keys generated (10 points)
  if (apiKeys && apiKeys.length > 0) {
    score += 10;
  }

  // Profile completion (10 points)
  const profileComplete = (() => {
    if (!authUser) return false;
    const requiredFields = ["firstName", "lastName", "email", "bio"];
    const completedFields = requiredFields.filter(
      (field) => authUser[field] && authUser[field].trim() !== ""
    );
    return completedFields.length >= Math.ceil(requiredFields.length * 0.75);
  })();

  if (profileComplete) {
    score += 10;
  }

  // OAuth connections (10 points)
  const oauthConnections = linkedProviders
    ? Object.values(linkedProviders).filter(Boolean).length
    : 0;

  if (oauthConnections > 0) {
    score += 10;
  }

  return Math.min(score, 100);
};

/**
 * Get security score color classes based on score value
 * @param {number} score - Security score (0-100)
 * @returns {string} CSS classes for score color
 */
export const getSecurityScoreColor = (score) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
};

/**
 * Get security score background color classes
 * @param {number} score - Security score (0-100)
 * @returns {string} CSS classes for score background color
 */
export const getSecurityScoreBackground = (score) => {
  if (score >= 80) return "bg-green-500/20";
  if (score >= 60) return "bg-yellow-500/20";
  return "bg-red-500/20";
};

/**
 * Get security score label
 * @param {number} score - Security score (0-100)
 * @returns {string} Score label
 */
export const getSecurityScoreLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
};
