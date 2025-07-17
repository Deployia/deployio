/**
 * OAuth Redirect Middleware
 * Handles storing and retrieving redirect paths for OAuth flows
 */

/**
 * Middleware to capture and store the intended redirect path from OAuth initiation
 */
const captureOAuthRedirect = (req, res, next) => {
  const redirectPath = req.query.redirect;

  if (redirectPath) {
    // Store the redirect path in session or pass it as state
    // Validate that it's a safe relative path
    if (
      redirectPath.startsWith("/") &&
      !redirectPath.startsWith("//") &&
      !redirectPath.startsWith("/auth/")
    ) {
      req.oauthRedirect = redirectPath;
    }
  }

  next();
};

/**
 * Middleware to generate OAuth state with redirect information
 */
const generateOAuthState = (req, res, next) => {
  const redirectPath = req.oauthRedirect || "/dashboard";

  // Encode the redirect path as state parameter
  req.oauthState = encodeURIComponent(redirectPath);

  next();
};

module.exports = {
  captureOAuthRedirect,
  generateOAuthState,
};
