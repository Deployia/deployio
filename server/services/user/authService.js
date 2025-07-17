/**
 * Main Authentication Service - Delegates to specialized services
 *
 * This service acts as a facade, delegating to specialized services:
 * - coreAuthService: Registration, login, OTP verification
 * - passwordService: Password validation, reset, updates
 * - twoFactorService: 2FA operations
 * - oauthService: OAuth provider management
 * - sessionService: Session and token management
 * - securityService: Rate limiting and security monitoring
 */

// Import specialized services
const coreAuthService = require("./coreAuthService");
const passwordService = require("./passwordService");
const twoFactorService = require("./twoFactorService");
const oauthService = require("./oauthService");
const sessionService = require("./sessionService");
const securityService = require("./securityService");

// Export delegated functions from specialized services
module.exports = {
  // Core authentication functions
  registerUser: coreAuthService.registerUser,
  loginUser: coreAuthService.loginUser,
  verifyOtp: coreAuthService.verifyOtp,
  resendOtp: coreAuthService.resendOtp,
  generateToken: coreAuthService.generateToken,
  generateRefreshToken: coreAuthService.generateRefreshToken,

  // Password management functions
  forgotPassword: passwordService.forgotPassword,
  resetPassword: passwordService.resetPassword,
  updatePassword: passwordService.updatePassword,
  setInitialPassword: passwordService.setInitialPassword,
  validatePasswordPolicy: passwordService.validatePasswordPolicy,

  // Session management functions
  refreshAccessToken: sessionService.refreshAccessToken,
  getActiveSessions: sessionService.getActiveSessions,
  revokeSession: sessionService.revokeSession,
  revokeAllOtherSessions: sessionService.revokeAllOtherSessions,
  logoutUser: sessionService.logoutUser,
  storeRefreshToken: sessionService.storeRefreshToken,

  // 2FA functions
  generate2FASecret: twoFactorService.generate2FASecret,
  enable2FA: twoFactorService.enable2FA,
  verify2FALogin: twoFactorService.verify2FALogin,
  disable2FA: twoFactorService.disable2FA,
  get2FAStatus: twoFactorService.get2FAStatus,
  generateNewBackupCodes: twoFactorService.generateNewBackupCodes,
  complete2FALogin: twoFactorService.complete2FALogin,

  // OAuth provider management
  getLinkedProviders: oauthService.getLinkedProviders,
  linkProvider: oauthService.linkProvider,
  unlinkProvider: oauthService.unlinkProvider,
  completeOAuthLogin: oauthService.completeOAuthLogin,

  // Security functions
  checkAdaptiveRateLimit: securityService.checkAdaptiveRateLimit,
  monitorSuspiciousActivity: securityService.monitorSuspiciousActivity,

  // Additional security functions that might be called directly
  checkRecentLoginAttempts: securityService.checkRecentLoginAttempts,
  logFailedLoginAttempt: securityService.logFailedLoginAttempt,
  clearLoginAttempts: securityService.clearLoginAttempts,
  incrementFailedAttempts: securityService.incrementFailedAttempts,
  logSuccessfulLogin: securityService.logSuccessfulLogin,

  // Additional helper functions that might be needed
  generateOtp: coreAuthService.generateOtp,
  calculatePasswordStrength: passwordService.calculatePasswordStrength,
  passwordPolicy: passwordService.passwordPolicy,
};
