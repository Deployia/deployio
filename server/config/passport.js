const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const crypto = require("crypto");

// Import enhanced Git provider strategies
const {
  githubBasicStrategy,
  githubIntegrationStrategy,
} = require("./strategies/githubStrategy");
const { gitlabIntegrationStrategy } = require("./strategies/gitlabStrategy");
const {
  azureDevOpsIntegrationStrategy,
} = require("./strategies/azureDevOpsStrategy");

function sanitizeUsername(username) {
  if (!username) return undefined;
  // Only allow letters, numbers, hyphens, and underscores
  return username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Try to find user by provider ID
        let user = await User.findOne({ googleId: profile.id });
        // If not found, try to find by email (for account linking)
        if (!user && profile.emails && profile.emails[0]) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            user.isVerified = true;
          }
        }
        if (!user) {
          user = await User.create({
            username: sanitizeUsername(
              profile.displayName ||
                profile.username ||
                profile.emails?.[0]?.value?.split("@")[0]
            ),
            email: profile.emails[0].value,
            googleId: profile.id,
            password: crypto.randomBytes
              ? crypto.randomBytes(20).toString("hex")
              : Math.random().toString(36).slice(-20),
            profileImage:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : "",
            isVerified: true,
            lastLogin: new Date(),
          });
        } else {
          let updated = false;
          // Always update email if changed and present
          if (
            profile.emails &&
            profile.emails[0] &&
            user.email !== profile.emails[0].value
          ) {
            user.email = profile.emails[0].value;
            updated = true;
          }
          // Always update profile image if changed and present
          if (
            profile.photos &&
            profile.photos[0] &&
            user.profileImage !== profile.photos[0].value
          ) {
            user.profileImage = profile.photos[0].value;
            updated = true;
          }
          // Always update lastLogin
          user.lastLogin = new Date();
          updated = true;
          // Always set isVerified true for OAuth
          user.isVerified = true;
          if (updated) await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Enhanced Git Provider OAuth Strategies
passport.use("github-basic", githubBasicStrategy); // For basic login
passport.use("github-integration", githubIntegrationStrategy); // For full Git integration
passport.use("gitlab-integration", gitlabIntegrationStrategy); // For repository access only
passport.use("azuredevops-integration", azureDevOpsIntegrationStrategy); // For repository access only

// Note: No serializeUser/deserializeUser for stateless JWT authentication
// These are only needed for session-based authentication

module.exports = passport;
