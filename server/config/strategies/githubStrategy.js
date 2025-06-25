const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../../models/User");
const crypto = require("crypto");

function sanitizeUsername(username) {
  if (!username) return undefined;
  // Only allow letters, numbers, hyphens, and underscores
  return username.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
}

const githubStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL:
      process.env.GITHUB_CALLBACK_URL ||
      `${process.env.BASE_URL}/auth/github/callback`,
    scope: ["user:email", "repo", "workflow", "admin:repo_hook"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("GitHub OAuth Profile:", {
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

          // Initialize gitProviders if not exists
          if (!user.gitProviders) {
            user.gitProviders = {};
          }

          // Set GitHub provider data
          user.gitProviders.github = {
            id: profile.id,
            username: profile.username,
            email: profile.emails[0].value,
            avatarUrl: profile.photos?.[0]?.value,
            profileUrl: profile.profileUrl,
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiry: refreshToken
              ? new Date(Date.now() + 8 * 60 * 60 * 1000)
              : null, // 8 hours
            scopes: ["user:email", "repo", "workflow", "admin:repo_hook"],
            repoAccess: {
              public: true,
              private: true, // GitHub scope 'repo' includes private repos
            },
            isConnected: true,
            connectedAt: new Date(),
            lastUsed: new Date(),
          };

          // Update profile image if changed
          if (
            profile.photos &&
            profile.photos[0] &&
            user.profileImage !== profile.photos[0].value
          ) {
            user.profileImage = profile.photos[0].value;
          }

          await user.save();
        }
      }

      if (!user) {
        // Create new user with GitHub account
        const userData = {
          username: sanitizeUsername(
            profile.username ||
              profile.displayName ||
              profile.emails?.[0]?.value?.split("@")[0]
          ),
          email: profile.emails?.[0]?.value,
          githubId: profile.id,
          password: crypto.randomBytes(20).toString("hex"),
          profileImage: profile.photos?.[0]?.value || "",
          isEmailVerified: true,
          status: "active",
          gitProviders: {
            github: {
              id: profile.id,
              username: profile.username,
              email: profile.emails?.[0]?.value,
              avatarUrl: profile.photos?.[0]?.value,
              profileUrl: profile.profileUrl,
              accessToken: accessToken,
              refreshToken: refreshToken,
              tokenExpiry: refreshToken
                ? new Date(Date.now() + 8 * 60 * 60 * 1000)
                : null,
              scopes: ["user:email", "repo", "workflow", "admin:repo_hook"],
              repoAccess: {
                public: true,
                private: true,
              },
              isConnected: true,
              connectedAt: new Date(),
              lastUsed: new Date(),
            },
          },
        };

        user = await User.create(userData);
      } else {
        // Update existing GitHub connection
        if (!user.gitProviders) {
          user.gitProviders = {};
        }

        // Update GitHub provider data
        user.gitProviders.github = {
          ...user.gitProviders.github,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenExpiry: refreshToken
            ? new Date(Date.now() + 8 * 60 * 60 * 1000)
            : null,
          avatarUrl: profile.photos?.[0]?.value,
          isConnected: true,
          lastUsed: new Date(),
        };

        // Update profile image if changed
        if (
          profile.photos &&
          profile.photos[0] &&
          user.profileImage !== profile.photos[0].value
        ) {
          user.profileImage = profile.photos[0].value;
        }

        await user.save();
      }

      return done(null, user);
    } catch (err) {
      console.error("GitHub OAuth Error:", err);
      return done(err, null);
    }
  }
);

module.exports = githubStrategy;
