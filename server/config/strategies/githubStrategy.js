const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../../models/User");
const crypto = require("crypto");

function sanitizeUsername(username) {
  if (!username) return undefined;
  // Only allow letters, numbers, hyphens, and underscores
  return username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
}

// Basic Login Strategy (limited scopes)
const githubBasicStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL:
      process.env.GITHUB_CALLBACK_URL ||
      `${process.env.BASE_URL}/api/v1/users/auth/github/callback`,
    scope: ["user:email"], // Limited scope for basic login
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("GitHub Basic OAuth Profile:", {
        id: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
      });

      let user = await User.findOne({ githubId: profile.id });

      // Try to find by email for account linking
      if (!user && profile.emails && profile.emails[0]) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Link GitHub to existing account
          user.githubId = profile.id;
          user.isEmailVerified = true;
        }
      }

      if (user) {
        // Always update email if changed and present
        if (
          profile.emails &&
          profile.emails[0] &&
          user.email !== profile.emails[0].value
        ) {
          user.email = profile.emails[0].value;
        }
        // Always update profile image if changed and present
        if (
          profile.photos &&
          profile.photos[0] &&
          user.profileImage !== profile.photos[0].value
        ) {
          user.profileImage = profile.photos[0].value;
        }
        // Always update lastLogin
        user.lastLogin = new Date();
        // Always set isEmailVerified true for OAuth
        user.isEmailVerified = true;
        await user.save();
        return done(null, user, { accessToken, refreshToken });
      } else {
        // Create new user with basic GitHub info
        const emailForUser = profile.emails?.[0]?.value;
        if (!emailForUser) {
          return done(
            new Error("GitHub account must have a public email"),
            null
          );
        }

        const newUser = new User({
          githubId: profile.id,
          email: emailForUser,
          username:
            sanitizeUsername(profile.username) || `github_${profile.id}`,
          fullName: profile.displayName || profile.username || "GitHub User",
          profileImage: profile.photos?.[0]?.value,
          isVerified: true, // Auto-verify OAuth users
          isEmailVerified: true,
          lastLogin: new Date(),
        });

        await newUser.save();
        console.log("New user created via GitHub basic auth:", newUser.email);

        // Follow the same flow as regular registration for consistency
        try {
          // Import required services
          const AuthNotifications = require("../../services/user/authNotifications");
          const AuthActivityLogger = require("../../services/user/authActivityLogger");

          // Log registration activity (similar to regular registration)
          await AuthActivityLogger.logRegistration(newUser._id, {
            email: newUser.email,
            username: newUser.username,
            provider: "github",
            githubId: profile.id,
          });

          // Send welcome notification (same as regular users after verification)
          await AuthNotifications.sendWelcome(newUser._id, {
            username: newUser.username,
            email: newUser.email,
          });

          console.log(
            `Welcome notification sent to new GitHub user ${newUser.email}`
          );
        } catch (notificationError) {
          // Don't fail the OAuth flow if notifications fail
          console.error(
            `Failed to send welcome notification to GitHub user ${newUser.email}:`,
            {
              error: notificationError.message,
              userId: newUser._id,
              email: newUser.email,
            }
          );
        }

        return done(null, newUser, { accessToken, refreshToken });
      }
    } catch (error) {
      console.error("GitHub basic strategy error:", error);
      return done(error, null);
    }
  }
);

// Full Integration Strategy (comprehensive scopes)
const githubIntegrationStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID_INTEGRATION,
    clientSecret: process.env.GITHUB_CLIENT_SECRET_INTEGRATION,
    callbackURL: `${process.env.BASE_URL}/api/v1/git/connect/github/callback`,
    scope: ["user:email", "repo", "workflow", "admin:repo_hook", "read:org"], // Full scopes
    passReqToCallback: true, // Enable req parameter to access state
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log("GitHub Integration OAuth Profile:", {
        id: profile.id,
        username: profile.username,
        email: profile.emails?.[0]?.value,
        state: req.query.state,
      });

      // Return the GitHub profile, tokens, and state
      return done(null, profile, {
        accessToken,
        refreshToken,
        state: req.query.state,
      });
    } catch (error) {
      console.error("GitHub integration strategy error:", error);
      return done(error, null);
    }
  }
);

module.exports = {
  sanitizeUsername,
  githubBasicStrategy,
  githubIntegrationStrategy,
};
